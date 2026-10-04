// Le chiamate a Hermes, separate dal resto così si possono provare anche fuori dall'app Zepp (tools/prova-hermes.mjs).
// fetch(opts) -> { status, body }; get(chiave) / set(chiave, valore) leggono e scrivono le impostazioni.
//
// Niente flusso di eventi (SSE): l'app Zepp non regge una risposta che resta aperta e la chiude con un errore di rete.
// Si avvia la run e poi, ogni 2 secondi, si leggono i messaggi della sessione finché arriva la risposta di Iris.

export const K = { url: 'tunnel_url', id: 'cf_client_id', secret: 'cf_client_secret', key: 'hermes_key', session: 'session_id', pin: 'pinned_session' }

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

export function createHermes({ fetch, get, set, intervallo = 2000, attesaMax = 270000 }) {
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

  // nome leggibile di uno strumento: "mcp__calendari_casa__calendario_leggi" → "calendario leggi"
  function nomeStrumento(n) {
    const parti = String(n || '').replace(/^mcp__/, '').split('__')
    return parti[parti.length - 1].replace(/[_-]+/g, ' ').trim()
  }

  // onStato({ stato, tool }) avvisa l'orologio mentre Iris lavora (pensa / usa uno strumento)
  let ultima = null // l'ultima richiesta, per "Aspetta ancora" se Iris ci mette tanto
  async function chiedi(text, onStato) {
    let sid = await sessione()
    let prima
    try { prima = (await messaggi(sid)).length } catch (e) {
      // la conversazione salvata non esiste più (cancellata da un'altra parte): se ne apre una nuova
      if (!/404|non conosce/.test(e.message)) throw e
      set(K.session, ''); sid = await sessione(); prima = 0
    }
    const run = await http('Invio la domanda', 'POST', '/v1/runs', { input: text, session_id: sid })
    const rid = run && run.run_id
    if (!rid) throw new Error('Invio la domanda: Hermes non ha avviato la richiesta')
    ultima = { rid, sid, prima }
    return attendi(ultima, onStato)
  }

  // riprende ad aspettare l'ultima richiesta (la domanda non viene rifatta)
  async function aspettaAncora(onStato) {
    if (!ultima) throw new Error('Non c\'è una richiesta da aspettare')
    return attendi(ultima, onStato)
  }

  async function attendi({ rid, sid, prima }, onStato) {
    const avvisa = (s) => { try { onStato && onStato(s) } catch (e) {} }
    avvisa({ stato: 'pensa' })
    const fine = Date.now() + attesaMax
    let conStato = true, ultimoStrumento = ''
    const tools = []
    while (Date.now() < fine) {
      await pausa(intervallo)
      // 1. lo stato della run (GET /v1/runs/{id}): dice quando ha finito e con che testo
      if (conStato) {
        let r = null
        try { r = await http('Leggo la risposta', 'GET', '/v1/runs/' + encodeURIComponent(rid), null, 15000) } catch (e) {
          if (/non conosce/.test(e.message)) conStato = false // Hermes vecchio: si guardano solo i messaggi
          else throw e
        }
        if (r && r.status === 'completed' && r.output) { ultima = null; return { text: String(r.output).trim(), tools } }
        if (r && (r.status === 'failed' || r.status === 'interrupted')) { ultima = null; throw new Error(r.error || 'La richiesta non è andata a buon fine') }
        if (r && r.status === 'cancelled') { ultima = null; throw new Error('La richiesta è stata fermata') }
      }
      // 2. i messaggi della sessione: quale strumento sta usando e, con Hermes vecchi, la risposta
      const m = (await messaggi(sid)).slice(prima)
      m.forEach((x) => {
        const t = x.tool_name || x.name
        if (x.role === 'tool' && t && tools.indexOf(nomeStrumento(t)) < 0) tools.push(nomeStrumento(t))
        ;(x.tool_calls || []).forEach((c) => { const n = nomeStrumento((c.function && c.function.name) || c.name); if (n && n !== ultimoStrumento) { ultimoStrumento = n; avvisa({ stato: 'strumento', tool: n }) } })
      })
      const ultimo = m[m.length - 1]
      const chiamaStrumenti = ultimo && ultimo.tool_calls && ultimo.tool_calls.length
      if (!conStato && ultimo && ultimo.role === 'assistant' && ultimo.content && !chiamaStrumenti) {
        const testo = typeof ultimo.content === 'string' ? ultimo.content : JSON.stringify(ultimo.content)
        ultima = null
        return { text: testo.trim(), tools }
      }
      if (ultimo && ultimo.role === 'tool') avvisa({ stato: 'pensa' })
    }
    const e = new Error('Iris ci sta mettendo tanto (o aspetta un permesso dall\'isola). La risposta arriva comunque nella conversazione.')
    e.lento = true
    throw e
  }

  function fa(ts) {
    const d = Date.now() / 1000 - (ts || 0)
    if (!ts) return ''
    if (d < 3600) return Math.max(1, Math.round(d / 60)) + ' min'
    if (d < 86400) return Math.round(d / 3600) + ' h'
    return Math.round(d / 86400) + ' g'
  }

  // le ultime conversazioni (tutte: isola, Telegram, orologio…), la più recente prima
  async function sessioni(n = 10) {
    const v = await http('Carico le conversazioni', 'GET', '/api/sessions?limit=' + n)
    const lista = (v && (v.data || v.sessions)) || (Array.isArray(v) ? v : [])
    const cur = val(K.session), pin = fissata()
    return lista.slice(0, n).map((s) => ({
      id: s.id,
      title: (s.title || s.preview || 'Senza titolo').replace(/\s+/g, ' ').slice(0, 60),
      ago: fa(s.last_active || s.updated_at),
      current: s.id === cur,
      pinned: !!pin && pin.id === s.id,
    }))
  }

  // la conversazione fissata nella prima schermata, per riprenderla al volo: { id, title } oppure null
  function fissata() {
    try { const v = JSON.parse(val(K.pin) || 'null'); return v && v.id ? v : null } catch (e) { return null }
  }
  // fissa (o toglie, se è già quella) una conversazione
  function fissa(id, title) {
    const p = fissata()
    if (p && p.id === id) { set(K.pin, ''); return null }
    const v = { id, title: String(title || 'Conversazione').slice(0, 60) }
    set(K.pin, JSON.stringify(v))
    return v
  }

  async function corrente() {
    const cur = val(K.session), pin = fissata()
    if (!cur) return { id: null, title: 'Nuova conversazione', pinned: pin }
    try {
      const s = (await sessioni(20)).find((x) => x.id === cur)
      return { id: cur, title: s ? s.title : 'Conversazione', pinned: pin }
    } catch (e) { return { id: cur, title: 'Conversazione', pinned: pin } }
  }

  const usa = (id) => set(K.session, id || '')
  const nuova = () => set(K.session, '')

  async function prova() {
    await http('Prova', 'GET', '/health', null, 15000)
    await http('Prova', 'GET', '/v1/capabilities', null, 15000)
    return { ok: true, message: 'Collegata: tunnel e Hermes rispondono' }
  }

  return { chiedi, aspettaAncora, prova, sessione, sessioni, corrente, usa, nuova, fissata, fissa }
}
