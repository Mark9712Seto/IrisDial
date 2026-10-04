// Pagina principale: gli occhi, cosa sta facendo Iris e tre tasti:
//   Chiedi a Iris  → chat nuova, con la tastiera di sistema (dettatura o lettere)
//   Cronologia     → le ultime conversazioni, per continuarne una
//   chat fissata   → la conversazione fissata dalla cronologia, per riprenderla al volo
// Per continuare la chat appena fatta c'è "Continua" in fondo alla risposta.
import * as hmUI from '@zos/ui'
import { px } from '@zos/utils'
import { push } from '@zos/router'
import { setWakeUpRelaunch, setPageBrightTime, resetPageBrightTime, pauseDropWristScreenOff, resetDropWristScreenOff } from '@zos/display'
import { Vibrator } from '@zos/sensor'
import { BasePage } from '@zeppos/zml/base-page'
import { creaOcchi } from './occhi'

const C = px(240) // centro dello schermo (480 × 480)
const dati = () => { try { return getApp()._options.globalData } catch (e) { return {} } }

Page(
  BasePage({
    state: { occhi: null, testo: null, titolo: null, busy: false },

    onInit(params) {
      this.state.apri = params === 'tastiera'
    },


    build() {
      setWakeUpRelaunch({ relaunch: true }) // a schermo riacceso si torna qui, non sul quadrante
      this.state.occhi = creaOcchi({ cx: C, cy: px(132), scala: 0.9 })
      this.state.testo = hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(60), y: px(198), w: px(360), h: px(64),
        text: 'Tocca per chiedere', text_size: px(26), color: 0x8e95ad,
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V, text_style: hmUI.text_style.WRAP,
      })
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(100), y: px(272), w: px(280), h: px(80), radius: px(40),
        normal_color: 0x7cc4ff, press_color: 0x5aa6e6, color: 0x04121f, text_size: px(30),
        text: 'Chiedi a Iris', click_func: () => this.nuovaChat(),
      })
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(84), y: px(366), w: px(152), h: px(58), radius: px(29),
        normal_color: 0x141824, press_color: 0x1f2433, color: 0xaab0c4, text_size: px(22),
        text: 'Cronologia', click_func: () => !this.state.busy && push({ url: 'page/sessioni.page' }),
      })
      this.state.fissa = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(244), y: px(366), w: px(152), h: px(58), radius: px(29),
        normal_color: 0x13202c, press_color: 0x1b3550, color: 0x9fd2ff, text_size: px(20),
        text: 'Fissata', click_func: () => this.tastoFissato(),
      })
      this.aggiornaTitolo()
      if (this.state.apri) setTimeout(() => this.tastiera(), 300)
    },

    // tornando qui da un'altra pagina: titolo aggiornato, e se si è scelto "Continua" / "Nuova chat" si riapre la tastiera
    onResume() {
      const g = dati()
      this.aggiornaTitolo()
      if (g.nuovaChat) { g.nuovaChat = false; this.nuovaChat() }
      else if (g.continua) { g.continua = false; setTimeout(() => this.tastiera(), 300) }
    },

    aggiornaTitolo() {
      this.request({ method: 'current' }, { timeout: 20000 })
        .then((c) => {
          if (!this.state.fissa) return
          this.state.pin = (c && c.pinned) || null
          const t = this.state.pin ? this.state.pin.title : 'Fissata'
          this.state.fissa.setProperty(hmUI.prop.MORE, { text: t.length > 12 ? t.slice(0, 11) + '…' : t })
        })
        .catch(() => {})
    },

    // Chiedi a Iris: conversazione nuova (si crea su Hermes alla prima domanda) e tastiera
    nuovaChat() {
      if (this.state.busy) return
      this.request({ method: 'new' }).finally(() => this.tastiera())
    },

    // la chat fissata: ci si sposta lì e si apre subito la tastiera
    tastoFissato() {
      if (this.state.busy) return
      const p = this.state.pin
      if (!p) return this.scrivi('Nessuna chat fissata: scegline una in Cronologia → Fissa')
      this.request({ method: 'use', params: { id: p.id } }).finally(() => this.tastiera())
    },

    scrivi(t, colore = 0x8e95ad) {
      this.state.testo.setProperty(hmUI.prop.MORE, { text: t, color: colore })
    },

    // stato mandato dal telefono mentre Iris lavora
    onCall(d) {
      const p = (d && d.params) || {}
      if (!d || d.method !== 'stato' || !this.state.busy) return
      if (p.stato === 'strumento') { this.state.occhi.stato('strumento'); this.scrivi(p.tool ? 'Uso: ' + p.tool : 'Uso uno strumento…', 0xf59e0b) }
      else if (p.stato === 'pensa') { this.state.occhi.stato('pensa'); this.scrivi('Sto pensando…', 0xa78bfa) }
    },

    // la tastiera di sistema: dettatura se c'è, altrimenti lettere; la domanda va nella conversazione in corso
    tastiera() {
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
      setPageBrightTime({ brightTime: 125000 })
      pauseDropWristScreenOff({ duration: 125000 })
      this.request({ method: 'ask', params: { text: domanda } }, { timeout: 130000 })
        .then((r) => {
          this.fine()
          if (r && r.error) return this.errore(r.error)
          this.state.occhi.stato('risponde')
          this.scrivi('Risposta pronta', 0x5eead4)
          this.vibra()
          const ultima = { q: domanda, a: r.text, tools: r.tools || [] }
          dati().last = ultima
          setTimeout(() => {
            push({ url: 'page/risposta.page', params: JSON.stringify(ultima) })
            this.state.occhi.stato('riposo'); this.scrivi('Tocca per chiedere')
          }, 900)
        })
        .catch(() => { this.fine(); this.errore('Il telefono non risponde. L\'app Zepp è aperta e vicina?') })
    },

    errore(t) {
      this.state.occhi.stato('errore')
      this.scrivi(t, 0xf87171)
      this.vibra()
      setTimeout(() => !this.state.busy && this.state.occhi.stato('dorme'), 2300)
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
