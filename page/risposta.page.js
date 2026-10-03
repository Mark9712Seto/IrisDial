// La risposta di Iris: si legge scorrendo con la corona o col dito (la pagina scorre da sola se il testo è lungo).
import * as hmUI from '@zos/ui'
import { px } from '@zos/utils'
import { back } from '@zos/router'

Page({
  onInit(params) {
    try { this.dati = JSON.parse(params || '{}') } catch (e) { this.dati = {} }
  },
  build() {
    const d = this.dati || {}, W = px(330), X = px(75)
    let y = px(70)
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: X, y, w: W, h: px(60), text: '«' + (d.q || '') + '»', text_size: px(22), color: 0x8e95ad,
      align_h: hmUI.align.CENTER_H, text_style: hmUI.text_style.ELLIPSIS,
    })
    y += px(64)
    if (d.tools && d.tools.length) {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: X, y, w: W, h: px(30), text: d.tools.join(' · '), text_size: px(18), color: 0x7d849c,
        align_h: hmUI.align.CENTER_H, text_style: hmUI.text_style.ELLIPSIS,
      })
      y += px(36)
    }
    const testo = (d.a || 'Nessuna risposta').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1')
    let h = px(600)
    try { h = hmUI.getTextLayout(testo, { text_size: px(28), text_width: W, wrapped: 1 }).height + px(10) } catch (e) {}
    hmUI.createWidget(hmUI.widget.TEXT, {
      x: X, y, w: W, h, text: testo, text_size: px(28), color: 0xe4e7f0, text_style: hmUI.text_style.WRAP,
    })
    y += h + px(24)
    hmUI.createWidget(hmUI.widget.BUTTON, {
      x: px(140), y, w: px(200), h: px(64), radius: px(32),
      normal_color: 0x7cc4ff, press_color: 0x5aa6e6, color: 0x04121f, text_size: px(26),
      text: 'Nuova domanda', click_func: () => back(),
    })
    // spazio in fondo, così l'ultima riga non finisce sotto il bordo rotondo
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y: y + px(64), w: px(10), h: px(120), color: 0x000000 })
  },
})
