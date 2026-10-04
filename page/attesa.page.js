// Iris al lavoro, a tutto schermo: occhi grandi al centro e sotto cosa sta facendo (pensa, usa uno strumento).
// Quando la risposta è pronta l'orologio vibra e questa pagina diventa la pagina della risposta.
// Se Iris ci mette tanto: "Aspetta ancora" riprende ad aspettare la stessa risposta, senza rifare la domanda.
import * as hmUI from '@zos/ui'
import { px } from '@zos/utils'
import { replace, back } from '@zos/router'
import { setWakeUpRelaunch, setPageBrightTime, resetPageBrightTime, pauseDropWristScreenOff, resetDropWristScreenOff } from '@zos/display'
import { Vibrator } from '@zos/sensor'
import { BasePage } from '@zeppos/zml/base-page'
import { creaOcchi } from './occhi'

const ATTESA = 300000 // al massimo 5 minuti di schermo acceso
const dati = () => { try { return getApp()._options.globalData } catch (e) { return {} } }

Page(
  BasePage({
    onInit(params) {
      try { this.d = JSON.parse(params || '{}') } catch (e) { this.d = {} }
    },

    build() {
      setWakeUpRelaunch({ relaunch: true }) // a schermo riacceso si torna qui, non sul quadrante
      this.occhi = creaOcchi({ cx: px(240), cy: px(200), scala: 1.2 })
      this.testo = hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(60), y: px(296), w: px(360), h: px(80), text: 'Sto pensando…', text_size: px(28), color: 0xa78bfa,
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V, text_style: hmUI.text_style.WRAP,
      })
      this.chiedi('ask', { text: this.d.text || '' })
    },

    scrivi(t, colore) { this.testo.setProperty(hmUI.prop.MORE, { text: t, color: colore }) },

    // stato mandato dal telefono mentre Iris lavora
    onCall(d) {
      const p = (d && d.params) || {}
      if (!d || d.method !== 'stato' || !this.inCorso) return
      if (p.stato === 'strumento') { this.occhi.stato('strumento'); this.scrivi(p.tool ? 'Uso: ' + p.tool : 'Uso uno strumento…', 0xf59e0b) }
      else if (p.stato === 'pensa') { this.occhi.stato('pensa'); this.scrivi('Sto pensando…', 0xa78bfa) }
    },

    chiedi(metodo, params) {
      this.togliPulsanti()
      this.inCorso = true
      this.occhi.stato('pensa')
      this.scrivi('Sto pensando…', 0xa78bfa)
      setPageBrightTime({ brightTime: ATTESA })
      pauseDropWristScreenOff({ duration: ATTESA })
      this.request({ method: metodo, params: params || {} }, { timeout: ATTESA + 10000 })
        .then((r) => {
          this.fine()
          if (r && r.error) return this.errore(r.error, r.lento)
          this.occhi.stato('risponde')
          this.scrivi('Risposta pronta', 0x5eead4)
          this.vibra()
          const ultima = { q: this.d.text || '', a: r.text, tools: r.tools || [] }
          dati().last = ultima
          setTimeout(() => replace({ url: 'page/risposta.page', params: JSON.stringify(ultima) }), 900)
        })
        .catch(() => { this.fine(); this.errore('Il telefono non risponde. L\'app Zepp è aperta e vicina?', false) })
    },

    errore(t, lento) {
      this.occhi.stato('errore')
      this.scrivi(t, 0xf87171)
      this.vibra()
      setTimeout(() => !this.inCorso && this.occhi.stato('riposo'), 2600)
      this.pulsanti = []
      if (lento) {
        this.pulsanti.push(hmUI.createWidget(hmUI.widget.BUTTON, {
          x: px(130), y: px(384), w: px(220), h: px(56), radius: px(28),
          normal_color: 0x7cc4ff, press_color: 0x5aa6e6, color: 0x04121f, text_size: px(24),
          text: 'Aspetta ancora', click_func: () => this.chiedi('wait'),
        }))
      } else {
        this.pulsanti.push(hmUI.createWidget(hmUI.widget.BUTTON, {
          x: px(150), y: px(384), w: px(180), h: px(56), radius: px(28),
          normal_color: 0x141824, press_color: 0x1f2433, color: 0xaab0c4, text_size: px(24),
          text: 'Indietro', click_func: () => back(),
        }))
      }
    },

    togliPulsanti() {
      ;(this.pulsanti || []).forEach((b) => { try { hmUI.deleteWidget(b) } catch (e) {} })
      this.pulsanti = []
    },

    fine() {
      this.inCorso = false
      try { resetPageBrightTime(); resetDropWristScreenOff() } catch (e) {}
    },

    vibra() {
      try { const v = new Vibrator(); v.start(); setTimeout(() => v.stop(), 350) } catch (e) {}
    },

    onDestroy() {
      this.occhi && this.occhi.ferma()
      this.fine()
    },
  }),
)
