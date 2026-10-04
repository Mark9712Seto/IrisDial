// Prova la parte telefono contro un Hermes vero o finto, fuori dall'app Zepp.
// Uso: node tools/prova-hermes.mjs <indirizzo> [chiave] ["domanda"]
//   es. con il finto Hermes di Iris Notch:  python3 mock_hermes.py 8642  →  node tools/prova-hermes.mjs http://127.0.0.1:8642 prova
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dir = mkdtempSync(join(tmpdir(), 'irisdial-'))
const src = readFileSync(new URL('../app-side/hermes.js', import.meta.url), 'utf8')
writeFileSync(join(dir, 'hermes.mjs'), src)
const { createHermes } = await import(join(dir, 'hermes.mjs'))

const [url, key = '', domanda = 'Ciao Iris, come stai?'] = process.argv.slice(2)
const store = { tunnel_url: url, hermes_key: key }
const fetchZepp = async ({ method, url, headers, body, timeout }) => {
  const r = await fetch(url, { method, headers, body, signal: AbortSignal.timeout(timeout || 20000) })
  const text = await r.text()
  let b = text; try { b = JSON.parse(text) } catch (e) {}
  return { status: r.status, body: b }
}
const h = createHermes({ fetch: fetchZepp, get: (k) => store[k], set: (k, v) => (store[k] = v), intervallo: 300 })
console.log('prova:', await h.prova())
const t0 = Date.now()
console.log('risposta:', await h.chiedi(domanda), `(${((Date.now() - t0) / 1000).toFixed(1)} s)`)
console.log('seconda domanda nella stessa conversazione:', await h.chiedi('E adesso?'))
console.log('sessione salvata:', store.session_id)
