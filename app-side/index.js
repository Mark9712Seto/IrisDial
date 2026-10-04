// Parte di Iris Dial che gira dentro l'app Zepp del telefono. L'orologio non va su internet: chiede qui,
// e qui si parla con Hermes attraverso il tunnel Cloudflare (service token + chiave di Hermes).
// Le chiavi stanno nelle impostazioni dell'app Zepp (settingsStorage) e non vengono mai mandate all'orologio.
import { BaseSideService, settingsLib } from '@zeppos/zml/base-side'
import { createHermes } from './hermes'

const get = (k) => { try { return settingsLib.getItem(k) } catch (e) { return '' } }
const set = (k, v) => { try { settingsLib.setItem(k, v) } catch (e) {} }

AppSideService(
  BaseSideService({
    // creato al primo uso: onSettingsChange può arrivare prima di onInit quando il servizio parte per le impostazioni
    h() {
      if (!this.hermes) this.hermes = createHermes({ fetch: (o) => this.fetch(o), get, set })
      return this.hermes
    },

    onRequest(req, res) {
      const fail = (e) => (e && e.message) || String(e)
      const p = req.params || {}
      if (req.method === 'ask') {
        // mentre Iris lavora, l'orologio riceve lo stato (pensa / strumento) per animare gli occhi
        const stato = (st) => this.call({ method: 'stato', params: st })
        this.h().chiedi(String(p.text || ''), stato).then((r) => res(null, r), (e) => res(null, { error: fail(e) }))
      } else if (req.method === 'sessions') {
        this.h().sessioni(10).then((l) => res(null, { list: l }), (e) => res(null, { error: fail(e) }))
      } else if (req.method === 'current') {
        this.h().corrente().then((c) => res(null, c), () => res(null, { title: '' }))
      } else if (req.method === 'use') {
        this.h().usa(p.id); res(null, { ok: true })
      } else if (req.method === 'pin') {
        res(null, { pinned: this.h().fissa(p.id, p.title) })
      } else if (req.method === 'new') {
        this.h().nuova(); res(null, { ok: true })
      } else if (req.method === 'test') {
        this.h().prova().then((r) => res(null, r), (e) => res(null, { ok: false, error: fail(e) }))
      } else res('metodo sconosciuto')
    },

    // pulsante «Prova» nelle impostazioni dell'app Zepp
    onSettingsChange({ key }) {
      if (key !== 'test_run') return
      set('test_result', 'Provo…')
      this.h().prova().then(
        (r) => set('test_result', '✓ ' + r.message),
        (e) => set('test_result', '✗ ' + ((e && e.message) || String(e))),
      )
    },
  }),
)
