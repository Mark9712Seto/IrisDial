// Gli occhi di Iris in versione orologio. A riposo sbattono le palpebre e ogni tanto fanno un gesto
// (sguardo di lato, sorriso, saltello); mentre Iris lavora si animano a ritmo (un timer solo, e solo
// in quei momenti, per non pesare sulla batteria).
//   pensa      viola, sguardo in alto a destra, tre puntini che pulsano
//   strumento  arancione, gli occhi scorrono a destra e sinistra come se leggessero
//   risponde   verde acqua, occhi "sorridenti" che saltellano
//   errore     rosso, scuotono la testa e poi si abbassano
//   dorme      grigi, chiusi, con una "z" che sale
import * as hmUI from '@zos/ui'
import { px } from '@zos/utils'

export const COLORE = {
  riposo: 0x7cc4ff,
  pensa: 0xa78bfa,
  strumento: 0xf59e0b,
  risponde: 0x5eead4,
  errore: 0xf87171,
  dorme: 0x475569,
}

export function creaOcchi({ cx, cy, scala = 1 }) {
  const W = px(56 * scala), H = px(86 * scala), R = px(26 * scala), GAP = px(36 * scala)
  const box = (lato, dx, dy, w, h) => ({ x: Math.round(cx + lato * (GAP / 2 + W / 2) - w / 2 + dx), y: Math.round(cy - h / 2 + dy), w: Math.round(w), h: Math.max(2, Math.round(h)), radius: Math.round(Math.min(R, h / 2, w / 2)) })
  const L = hmUI.createWidget(hmUI.widget.FILL_RECT, { ...box(-1, 0, 0, W, H), color: COLORE.riposo })
  const D = hmUI.createWidget(hmUI.widget.FILL_RECT, { ...box(1, 0, 0, W, H), color: COLORE.riposo })
  const P = px(13 * scala)
  const punti = [0, 1, 2].map((i) => hmUI.createWidget(hmUI.widget.FILL_RECT, {
    x: cx + GAP / 2 + W + px(14) + i * px(22), y: cy - H / 2 - px(10 + i * 10), w: P, h: P, radius: P / 2, color: COLORE.pensa,
  }))
  const zeta = hmUI.createWidget(hmUI.widget.TEXT, { x: cx + GAP / 2 + W, y: cy - H, w: px(60), h: px(50), text: 'z', text_size: px(34), color: COLORE.dorme })
  const mostra = (w, on) => { try { w.setProperty(hmUI.prop.VISIBLE, !!on) } catch (e) {} }
  punti.forEach((p) => mostra(p, false)); mostra(zeta, false)

  let stato = 'riposo', colore = COLORE.riposo, t0 = Date.now(), giro = null, attesa = null, vivo = true

  function disegna({ dx = 0, dy = 0, h = H, w = W, dxL = 0, dxR = 0, dyL = 0, dyR = 0 } = {}) {
    L.setProperty(hmUI.prop.MORE, { ...box(-1, dx + dxL, dy + dyL, w, h), color: colore })
    D.setProperty(hmUI.prop.MORE, { ...box(1, dx + dxR, dy + dyR, w, h), color: colore })
  }

  // un fotogramma delle animazioni "di lavoro"
  function fotogramma() {
    if (!vivo) return
    const t = (Date.now() - t0) / 1000
    if (stato === 'pensa') {
      disegna({ dx: px(10), dy: -px(10) + Math.sin(t * 2) * px(2) })
      punti.forEach((p, i) => { const on = Math.sin(t * 4 - i * 0.9) > -0.2; mostra(p, on) })
    } else if (stato === 'strumento') {
      const k = Math.sin(t * 3.2)
      disegna({ dx: k * px(20), dy: px(4), h: H * 0.82 })
    } else if (stato === 'risponde') {
      const salto = t < 1.6 ? Math.abs(Math.sin(t * 7)) * (1 - t / 1.6) : 0
      disegna({ dy: -px(14) - salto * px(12), h: px(30), w: W * 1.08 })
    } else if (stato === 'errore') {
      const scuoti = t < 0.9 ? Math.sin(t * 34) * px(12) * (1 - t / 0.9) : 0
      disegna({ dx: scuoti, dy: t < 0.9 ? 0 : px(10), h: t < 0.9 ? H : H * 0.6 })
    } else if (stato === 'dorme') {
      disegna({ dy: px(18), h: px(10) })
      const s = (t % 2.4) / 2.4
      zeta.setProperty(hmUI.prop.MORE, { x: cx + GAP / 2 + W + px(6 + s * 18), y: cy - px(30) - s * px(60), text: 'z', color: COLORE.dorme })
      mostra(zeta, s < 0.85)
    }
  }

  // a riposo: battito di ciglia e un gesto ogni tanto
  function gesto() {
    if (!vivo || stato !== 'riposo') return
    const r = Math.random()
    if (r < 0.45) { disegna({ h: px(8) }); setTimeout(() => vivo && stato === 'riposo' && disegna(), 130) }
    else if (r < 0.6) { disegna({ h: px(8) }); setTimeout(() => stato === 'riposo' && disegna(), 110); setTimeout(() => stato === 'riposo' && disegna({ h: px(8) }), 230); setTimeout(() => stato === 'riposo' && disegna(), 340) }
    else if (r < 0.8) { const d = (Math.random() < 0.5 ? -1 : 1) * px(16); disegna({ dx: d }); setTimeout(() => stato === 'riposo' && disegna(), 1200) }
    else if (r < 0.92) { disegna({ dy: -px(10), h: px(32) }); setTimeout(() => stato === 'riposo' && disegna(), 1100) }
    else { disegna({ dy: -px(12) }); setTimeout(() => stato === 'riposo' && disegna({ dy: px(3) }), 140); setTimeout(() => stato === 'riposo' && disegna(), 280) }
    attesa = setTimeout(gesto, 2600 + Math.random() * 3600)
  }
  attesa = setTimeout(gesto, 1500)

  return {
    stato(nome) {
      if (!COLORE[nome]) nome = 'riposo'
      stato = nome; colore = COLORE[nome]; t0 = Date.now()
      if (giro) { clearInterval(giro); giro = null }
      clearTimeout(attesa)
      punti.forEach((p) => mostra(p, false)); mostra(zeta, false)
      if (nome === 'riposo') { disegna(); attesa = setTimeout(gesto, 2000) }
      else { fotogramma(); giro = setInterval(fotogramma, 70) }
      if (nome === 'risponde' || nome === 'errore') setTimeout(() => { if (giro && (stato === nome)) { clearInterval(giro); giro = null } }, 2200)
    },
    ferma() { vivo = false; clearTimeout(attesa); if (giro) clearInterval(giro) },
  }
}
