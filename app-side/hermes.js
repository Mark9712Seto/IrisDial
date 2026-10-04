// Le chiamate a Hermes, separate dal resto così si possono provare anche fuori dall'app Zepp (tools/prova-hermes.mjs).
// fetch(opts) -> { status, body }; get(chiave) / set(chiave, valore) leggono e scrivono le impostazioni.
//
// Niente flusso di eventi (SSE): l'app Zepp non regge una risposta che resta aperta e la chiude con un errore di rete.
// Si avvia la run e poi, ogni 2 secondi, si leggono i messaggi della sessione finché arriva la risposta di Iris.

export const K = { url: 'tunnel_url', id: 'cf_client_id', secret: 'cf_client_secret', key: 'hermes_key', session: 'session_id' }

const pausa = (ms) => new Promise((r) => setTimeout(r, ms))

function asJson(body) {
  if (body && typeof body === 'object') return body
  try { return JSON.parse(body) } catch (e) { return null }
}

// spiega gli errori più comuni con parole semplici
export function spiega(status, body) {
  if (status === 401 || status === 403) {
    const html = typeof body === 'string' && /cloudflare|access/i.test(body)
    return html ? 'Cloudflare non fa passare: controlla Client ID e Client Secret (o il token è scaduto)' : 'Hermes rifiuta la chiave: controlla la chiave di Hermes'
  }
  if (status === 404) return 'Hermes non conosce questa funzione: forse va aggiornato'
  if (status === 524 || status === 522) return 'Cloudflare non arriva a Hermes (' + status + '): controlla il tunnel e il firewall'
  if (status >= 500) return 'Hermes ha avuto un errore (' + status + ')'
  return 'Risposta inattesa (' + status + ')'
}

export function createHermes({ fetch, get, set, intervallo = 2000, attesaMax = 115000 }) {
  const val = (k) => String(get(k) || '').trim()

  function conf() {
    const url = val(K.url).replace(/\/+$/, '')
    if (!url) throw new Error('Manca l\'indirizzo del tunnel: aprilo nell\'app Zepp → Iris Dial → Impostazioni')
    const headers = { 'Content-Type': 'application/json' }
    if (val(K.id)) headers['CF-Access-Client-Id'] = val(K.id)
    if (val(K.secret)) headers['CF-Access-Client-Secret'] = val(K.secret)
    if (val(K.key)) headers['Authorization'] = 'Bearer ' + val(K.key)
    return { url, headers }
  }

  // passo: a che punto eravamo, per dire dove si è fermato se qualcosa va storto
  async function http(passo, method, path, body, timeout) {
    const c = conf()
    let r
    try {
      r = await fetch({ method, url: c.url + path, headers: c.headers, body: body ? JSON.stringify(body) : undefined, timeout: timeout || 20000 })
    } catch (e) {
      throw new Error(passo + ': la rete non risponde (' + ((e && e.message) || e) + ')')
    }
    if (!r || r.status < 200 || r.status >= 300) throw new Error(passo + ': ' + spiega(r ? r.status : 0, r && r.body))
    return asJson(r.body)
  }

  async function messaggi(sid) {
    const v = await http('Leggo la risposta', 'GET', '/api/sessions/' + encodeURIComponent(sid) + '/messages?inline_images=false')
    return (v && (v.data || v.messages)) || (Array.isArray(v) ? v : [])
  }

  async function sessione() {
    const s = val(K.session)
    if (s) return s
    const v = await http('Creo la conversazione', 'POST', '/api/sessions', { source: 'desktop' })
    const id = v && (v.id || (v.session && v.session.id) || (v.data && v.data.id))
    if (!id) throw new Error('Creo la conversazione: Hermes non ha risposto con un id')
    set(K.session, id)
    return id
  }

  async function chiedi(text) {
    let sid = await sessione()
    let prima
    try { prima = (await messaggi(sid)).length } catch (e) {
      // la conversazione salvata non esiste più (cancellata da un'altra parte): se ne apre una nuova
      if (!/404|non conosce/.test(e.message)) throw e
      set(K.session, ''); sid = await sessione(); prima = 0
    }
    const run = await http('Invio la domanda', 'POST', '/v1/runs', { input: text, session_id: sid })
    if (!run || !run.run_id) throw new Error('Invio la domanda: Hermes non ha avviato la richiesta')
    const fine = Date.now() + attesaMax
    while (Date.now() < fine) {
      await pausa(intervallo)
      const m = (await messaggi(sid)).slice(prima)
      const tools = []
      m.forEach((x) => { const t = x.tool_name || x.name; if (x.role === 'tool' && t && tools.indexOf(t) < 0) tools.push(t) })
      const ultimo = m[m.length - 1]
      const chiamaStrumenti = ultimo && ultimo.tool_calls && ultimo.tool_calls.length
      if (ultimo && ultimo.role === 'assistant' && ultimo.content && !chiamaStrumenti) {
        const testo = typeof ultimo.content === 'string' ? ultimo.content : JSON.stringify(ultimo.content)
        return { text: testo.trim(), tools }
      }
    }
    throw new Error('Iris ci sta mettendo troppo, o aspetta un permesso: guarda sull\'isola del PC')
  }

  async function prova() {
    await http('Prova', 'GET', '/health', null, 15000)
    await http('Prova', 'GET', '/v1/capabilities', null, 15000)
    return { ok: true, message: 'Collegata: tunnel e Hermes rispondono' }
  }

  return { chiedi, prova, sessione }
}
