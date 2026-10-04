// Le conversazioni: in cima "Nuova chat", poi le ultime di Hermes (anche quelle nate su Telegram o sull'isola).
// Si scorre con la corona; toccandone una si torna agli occhi con la tastiera aperta, e si continua lì.
// "Fissa" la mette nella prima schermata, per riprenderla al volo.
import * as hmUI from '@zos/ui'
import { px } from '@zos/utils'
import { back, replace } from '@zos/router'
import { BasePage } from '@zeppos/zml/base-page'

const dati = () => { try { return getApp()._options.globalData } catch (e) { return {} } }

Page(
  BasePage({
    build() {
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(90), y: px(36), w: px(300), h: px(44), text: 'Conversazioni', text_size: px(28), color: 0xe4e7f0,
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V,
      })
      this.attesa = hmUI.createWidget(hmUI.widget.TEXT, {
        x: px(60), y: px(200), w: px(360), h: px(80), text: 'Carico…', text_size: px(24), color: 0x8e95ad,
        align_h: hmUI.align.CENTER_H, align_v: hmUI.align.CENTER_V, text_style: hmUI.text_style.WRAP,
      })
      this.request({ method: 'sessions' }, { timeout: 25000 })
        .then((r) => {
          if (r && r.error) return this.attesa.setProperty(hmUI.prop.MORE, { text: r.error, color: 0xf87171 })
          this.attesa.setProperty(hmUI.prop.VISIBLE, false)
          this.elenco((r && r.list) || [])
        })
        .catch(() => this.attesa.setProperty(hmUI.prop.MORE, { text: 'Il telefono non risponde', color: 0xf87171 }))
    },

    elenco(list) {
      let y = px(96)
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x: px(80), y, w: px(320), h: px(70), radius: px(35),
        normal_color: 0x13263a, press_color: 0x1b3550, color: 0x7cc4ff, text_size: px(24),
        text: '+ Nuova chat', click_func: () => { dati().nuovaChat = true; back() },
      })
      y += px(84)
      list.forEach((s) => {
        const corto = s.title.length > 18 ? s.title.slice(0, 17) + '…' : s.title
        // a sinistra si apre la conversazione, a destra la si fissa nella prima schermata
        hmUI.createWidget(hmUI.widget.BUTTON, {
          x: px(48), y, w: px(278), h: px(76), radius: px(38),
          normal_color: s.current ? 0x1b2636 : 0x10131c, press_color: 0x24324a, color: s.current ? 0xffffff : 0xaab0c4, text_size: px(22),
          text: corto + '\n' + (s.current ? 'in corso · ' : '') + s.ago,
          click_func: () => this.request({ method: 'use', params: { id: s.id } }).finally(() => { dati().continua = true; back() }),
        })
        const pin = hmUI.createWidget(hmUI.widget.BUTTON, {
          x: px(334), y: y + px(8), w: px(98), h: px(60), radius: px(30),
          normal_color: s.pinned ? 0x13263a : 0x141824, press_color: 0x1b3550, color: s.pinned ? 0x7cc4ff : 0x7d849c, text_size: px(19),
          text: s.pinned ? 'Fissata' : 'Fissa',
          click_func: () => this.request({ method: 'pin', params: { id: s.id, title: s.title } }).then(() => replace({ url: 'page/sessioni.page' })),
        })
        y += px(88)
      })
      hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 0, y, w: px(10), h: px(120), color: 0x000000 })
    },
  }),
)
