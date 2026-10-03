// Pagina principale: gli occhi, cosa sta facendo Iris e il pulsante per fare una domanda.
// La domanda si detta (tastiera vocale di sistema, se l'orologio la offre) o si scrive; la manda il telefono.
import * as hmUI from '@zos/ui'
import { px } from '@zos/utils'
import { push } from '@zos/router'
import { setWakeUpRelaunch, setPageBrightTime, resetPageBrightTime, pauseDropWristScreenOff, resetDropWristScreenOff } from '@zos/display'
import { Vibrator } from '@zos/sensor'
import { BasePage } from '@zeppos/zml/base-page'
import { creaOcchi } from './occhi'

const C = px(240) // centro dello schermo (480 × 480)

Page(
  BasePage({
    state: { occhi: null, testo: null, busy: false },

    build() {
      setWakeUpRelaunch({ relaunch: true }) // a schermo riacceso si torna qui, non sul quadrante
      this.state.occhi = creaOcchi({ cx: C, cy: px(165) })
      this.state.testo = hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(60), y: px(232), w: px(360), h: px(70),
        text: 'Tocca per chiedere', text_size: px(26), color: 0x8e95ad,
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V, text_style: hmUI.text_style.WRAP,
      })
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(120), y: px(312), w: px(240), h: px(76), radius: px(38),
        normal_color: 0x7cc4ff, press_color: 0x5aa6e6, color: 0x04121f, text_size: px(30),
        text: 'Chiedi a Iris', click_func: () => this.chiedi(),
      })
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(150), y: px(400), w: px(180), h: px(48), radius: px(24),
        normal_color: 0x141824, press_color: 0x1f2433, color: 0xaab0c4, text_size: px(22),
        text: 'Prova collegamento', click_func: () => this.prova(),
      })
    },

    scrivi(t, colore = 0x8e95ad) {
      this.state.testo.setProperty(hmUI.prop.MORE, { text: t, color: colore })
    },

    chiedi() {
      if (this.state.busy) return
      const tastiera = hmUI.inputType && typeof hmUI.createKeyboard === 'function'
      if (!tastiera) return this.scrivi('Su questo orologio non c\'è la tastiera di sistema', 0xf87171)
      let tipo = hmUI.inputType.CHAR
      try { if (hmUI.keyboard && hmUI.keyboard.checkVoiceInputAvailable && hmUI.keyboard.checkVoiceInputAvailable()) tipo = hmUI.inputType.VOICE } catch (e) {}
      hmUI.createKeyboard({
        inputType: tipo,
        text: '',
        onComplete: (_, r) => { hmUI.deleteKeyboard(); const t = (r && r.data || '').trim(); if (t) this.invia(t) },
        onCancel: () => hmUI.deleteKeyboard(),
      })
    },

    invia(domanda) {
      this.state.busy = true
      this.state.occhi.stato('pensa')
      this.scrivi('Sto pensando…', 0xa78bfa)
      // durante l'attesa lo schermo resta acceso e non si spegne abbassando il polso (al massimo 2 minuti)
      setPageBrightTime({ brightTime: 120000 })
      pauseDropWristScreenOff({ duration: 120000 })
      this.request({ method: 'ask', params: { text: domanda } }, { timeout: 130000 })
        .then((r) => {
          this.fine()
          if (r && r.error) return this.errore(r.error)
          this.state.occhi.stato('risponde')
          this.scrivi('Risposta pronta', 0x5eead4)
          this.vibra()
          try { getApp()._options.globalData.last = { q: domanda, a: r.text } } catch (e) {}
          push({ url: 'page/risposta.page', params: JSON.stringify({ q: domanda, a: r.text, tools: r.tools || [] }) })
          setTimeout(() => { this.state.occhi.stato('riposo'); this.scrivi('Tocca per chiedere') }, 1500)
        })
        .catch((e) => { this.fine(); this.errore('Il telefono non risponde. L\'app Zepp è aperta e vicina?') })
    },

    prova() {
      if (this.state.busy) return
      this.scrivi('Provo il collegamento…')
      this.request({ method: 'test' }, { timeout: 30000 })
        .then((r) => {
          if (r && r.ok) { this.state.occhi.stato('risponde'); this.scrivi(r.message, 0x5eead4); setTimeout(() => this.state.occhi.stato('riposo'), 1500) }
          else this.errore((r && r.error) || 'Errore sconosciuto')
        })
        .catch(() => this.errore('Il telefono non risponde. L\'app Zepp è aperta e vicina?'))
    },

    errore(t) {
      this.state.occhi.stato('dorme')
      this.scrivi(t, 0xf87171)
      this.vibra()
    },

    fine() {
      this.state.busy = false
      try { resetPageBrightTime(); resetDropWristScreenOff() } catch (e) {}
    },

    vibra() {
      try { const v = new Vibrator(); v.start(); setTimeout(() => v.stop(), 350) } catch (e) {}
    },

    onDestroy() {
      this.state.occhi && this.state.occhi.ferma()
      this.fine()
    },
  }),
)
