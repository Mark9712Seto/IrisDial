// La risposta di Iris: si legge scorrendo con la corona o col dito (la pagina scorre da sola se il testo è lungo).
// In fondo: "Continua" (nuova domanda nella stessa conversazione) e "Nuova chat".
import * as hmUI from '@zos/ui'
import { px } from '@zos/utils'
import { back } from '@zos/router'
import { creaOcchi } from './occhi'

const dati = () => { try { return getApp()._options.globalData } catch (e) { return {} } }

Page({
  onInit(params) {
    try { this.d = JSON.parse(params || '{}') } catch (e) { this.d = {} }
  },
  build() {
    const d = this.d || {}, W = px(330), X = px(75)
    // gli occhi piccoli in alto: prima felici per la risposta, poi tornano ai loro gesti
    this.occhi = creaOcchi({ cx: px(240), cy: px(62), scala: 0.42 })
    this.occhi.stato('risponde')
    setTimeout(() => this.occhi && this.occhi.stato('riposo'), 2400)
    let y = px(104)
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: X, y, w: W, h: px(60), text: '«' + (d.q || '') + '»', text_size: px(22), color: 0x8e95ad,
      align_h: hmUI.align.CENTER_H, text_style: hmUI.text_style.ELLIPSIS,
    })
    y += px(62)
    if (d.tools && d.tools.length) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: X, y, w: W, h: px(30), text: d.tools.join(' · '), text_size: px(18), color: 0xf59e0b,
        align_h: hmUI.align.CENTER_H, text_style: hmUI.text_style.ELLIPSIS,
      })
      y += px(36)
    }
    // un po' di pulizia del markdown: grassetti, codice, titoli ed elenchi diventano testo semplice
    const testo = (d.a || 'Nessuna risposta')
      .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/^#+\s*/gm, '').replace(/^\s*[-*]\s+/gm, '• ')
    let h = px(600)
    try { h = hmUI.getTextLayout(testo, { text_size: px(28), text_width: W, wrapped: 1 }).height + px(10) } catch (e) {}
    hmUI.createWidget(hmUI.widget.TEXT, { x: X, y, w: W, h, text: testo, text_size: px(28), color: 0xe4e7f0, text_style: hmUI.text_style.WRAP })
    y += h + px(24)
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: px(120), y, w: px(240), h: px(68), radius: px(34),
      normal_color: 0x7cc4ff, press_color: 0x5aa6e6, color: 0x04121f, text_size: px(26),
      text: 'Continua', click_func: () => { dati().continua = true; back() },
    })
    y += px(80)
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: px(140), y, w: px(200), h: px(56), radius: px(28),
      normal_color: 0x141824, press_color: 0x1f2433, color: 0xaab0c4, text_size: px(22),
      text: 'Nuova chat', click_func: () => { dati().nuovaChat = true; back() },
    })
    // spazio in fondo, così l'ultimo pulsante non finisce sotto il bordo rotondo
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: y + px(56), w: px(10), h: px(140), color: 0x000000 })
  },
  onDestroy() {
    this.occhi && this.occhi.ferma()
  },
})
