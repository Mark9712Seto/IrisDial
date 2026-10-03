// Parte di Iris Dial che gira dentro l'app Zepp del telefono. L'orologio non va su internet: chiede qui,
// e qui si parla con Hermes attraverso il tunnel Cloudflare (service token + chiave di Hermes).
// Le chiavi stanno nelle impostazioni dell'app Zepp (settingsStorage) e non vengono mai mandate all'orologio.
import { BaseSideService } from '@zeppos/zml/base-side'
import { settingsLib } from '@zeppos/zml/base-side'

const K = { url: 'tunnel_url', id: 'cf_client_id', secret: 'cf_client_secret', key: 'hermes_key', session: 'session_id' }

function get(key) {
  try { return (settingsLib.getItem(key) || '').trim() } catch (e) { return '' }
}

function conf() {
  const url = get(K.url).replace(/\/+$/, '')
  if (!url) throw new Error('Manca l\'indirizzo del tunnel: aprilo nell\'app Zepp → Iris Dial → Impostazioni')
  const headers = { 'Content-Type': 'application/json' }
  if (get(K.id)) headers['CF-Access-Client-Id'] = get(K.id)
  if (get(K.secret)) headers['CF-Access-Client-Secret'] = get(K.secret)
  if (get(K.key)) headers['Authorization'] = 'Bearer ' + get(K.key)
  return { url, headers }
}

// spiega gli errori più comuni con parole semplici
function spiega(status, body) {
  if (status === 401 || status === 403) {
    const html = typeof body === 'string' && /cloudflare|access/i.test(body)
    return html ? 'Cloudflare non fa passare: controlla Client ID e Client Secret (o il token è scaduto)' : 'Hermes rifiuta la chiave: controlla la chiave di Hermes'
  }
  if (status === 404) return 'Hermes non conosce questa funzione: forse va aggiornato'
  if (status >= 500) return 'Hermes ha avuto un errore (' + status + ')'
  return 'Risposta inattesa (' + status + ')'
}

function asJson(body) {
  if (body && typeof body === 'object') return body
  try { return JSON.parse(body) } catch (e) { return null }
}

// eventi della run in formato SSE: "id: n\ndata: {json}\n\n"
function eventi(testo) {
  const out = []
  String(testo || '').split(/\n\n/).forEach((f) => {
    const data = f.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('\n')
    if (!data) return
    try { out.push(JSON.parse(data)) } catch (e) {}
  })
  return out
}

AppSideService(
  BaseSideService({
    async http(method, path, body, extra, timeout) {
      const c = conf()
      const r = await this.fetch({ method, url: c.url + path, headers: Object.assign({}, c.headers, extra || {}), body: body ? JSON.stringify(body) : undefined, timeout: timeout || 30000 })
      if (r.status < 200 || r.status >= 300) throw new Error(spiega(r.status, r.body))
      return r.body
    },

    async sessione() {
      const s = get(K.session)
      if (s) return s
      const v = asJson(await this.http('POST', '/api/sessions', { source: 'desktop' }))
      const id = v && (v.id || (v.session && v.session.id))
      if (!id) throw new Error('Hermes non ha creato la sessione')
      settingsLib.setItem(K.session, id)
      return id
    },

    async chiedi(text) {
      const sid = await this.sessione()
      const run = asJson(await this.http('POST', '/v1/runs', { input: text, session_id: sid }))
      const rid = run && run.run_id
      if (!rid) throw new Error('Hermes non ha avviato la richiesta')
      // prima versione: si aspetta la fine della run e si leggono tutti gli eventi insieme
      const evs = eventi(await this.http('GET', '/v1/runs/' + rid + '/events', null, { Accept: 'text/event-stream' }, 125000))
      let text2 = '', tools = []
      for (const e of evs) {
        if (e.event === 'message.delta') text2 += e.delta || ''
        if (e.event === 'tool.started' && e.tool && tools.indexOf(e.tool) < 0) tools.push(e.tool)
        if (e.event === 'run.completed' && e.output) text2 = e.output
        if (e.event === 'run.failed' || e.event === 'run.interrupted') throw new Error(e.error || 'La richiesta non è andata a buon fine')
        if (e.event === 'approval.request') throw new Error('Iris chiede un permesso: per ora dallo dall\'isola sul PC (dall\'orologio arriva nella prossima versione)')
      }
      return { text: text2.trim() || 'Nessuna risposta', tools }
    },

    async prova() {
      const c = conf()
      const h = await this.fetch({ method: 'GET', url: c.url + '/health', headers: c.headers, timeout: 15000 })
      if (h.status !== 200) return { ok: false, error: spiega(h.status, h.body) }
      const cap = await this.fetch({ method: 'GET', url: c.url + '/v1/capabilities', headers: c.headers, timeout: 15000 })
      if (cap.status !== 200) return { ok: false, error: spiega(cap.status, cap.body) }
      return { ok: true, message: 'Collegata: tunnel e Hermes rispondono' }
    },

    onRequest(req, res) {
      if (req.method === 'ask') {
        this.chiedi(String((req.params && req.params.text) || '')).then((r) => res(null, r), (e) => res(null, { error: e.message || String(e) }))
      } else if (req.method === 'test') {
        this.prova().then((r) => res(null, r), (e) => res(null, { ok: false, error: e.message || String(e) }))
      } else res('metodo sconosciuto')
    },

    // pulsante «Prova» nelle impostazioni dell'app Zepp
    onSettingsChange({ key }) {
      if (key !== 'test_run') return
      settingsLib.setItem('test_result', 'Provo…')
      this.prova().then(
        (r) => settingsLib.setItem('test_result', r.ok ? '✓ ' + r.message : '✗ ' + r.error),
        (e) => settingsLib.setItem('test_result', '✗ ' + (e.message || String(e))),
      )
    },
  }),
)
