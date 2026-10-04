// Prova la parte telefono contro un Hermes vero o finto, fuori dall'app Zepp.
// Uso: node tools/prova-hermes.mjs <indirizzo> [chiave] ["domanda"]
//   es. con il finto Hermes di Iris Notch:  python3 mock_hermes.py 8642  →  node tools/prova-hermes.mjs http://127.0.0.1:8642 prova
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dir = mkdtempSync(join(tmpdir(), 'irisdial-'))
writeFileSync(join(dir, 'hermes.mjs'), readFileSync(new URL('../app-side/hermes.js', import.meta.url), 'utf8'))
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
const stati = []
console.log('prova:', await h.prova())
const t0 = Date.now()
console.log('risposta:', await h.chiedi(domanda, (s) => stati.push(s.stato + (s.tool ? ':' + s.tool : ''))), `(${((Date.now() - t0) / 1000).toFixed(1)} s)`, 'stati:', stati.join(' → '))
console.log('conversazione in corso:', await h.corrente())
console.log('seconda domanda, stessa conversazione:', (await h.chiedi('E adesso?')).text)
console.log('elenco:', (await h.sessioni(5)).map((s) => `${s.current ? '▶ ' : ''}${s.title} (${s.ago})`).join(' | '))
h.nuova()
console.log('dopo "nuova chat":', await h.corrente())
const prima = (await h.sessioni(5))[0]
console.log('fisso:', h.fissa(prima.id, prima.title), '→ corrente:', (await h.corrente()).pinned, '→ di nuovo (toglie):', h.fissa(prima.id, prima.title))
