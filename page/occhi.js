// Gli occhi di Iris in versione orologio: due rettangoli arrotondati che sbattono le palpebre, si guardano
// intorno e cambiano colore con lo stato. Pochi widget e un timer, per non pesare sulla batteria.
import * as hmUI from '@zos/ui'
import { px } from '@zos/utils'

export const COLORE = {
  riposo: 0x7cc4ff,
  pensa: 0xa78bfa,
  strumento: 0xf59e0b,
  risponde: 0x5eead4,
  permesso: 0xfb7185,
  errore: 0xf87171,
  dorme: 0x475569,
}

export function creaOcchi({ cx, cy, scala = 1 }) {
  const W = px(56 * scala), H = px(86 * scala), R = px(26 * scala), GAP = px(36 * scala)
  const pos = (lato, dx = 0, h = H) => ({ x: cx + lato * (GAP / 2 + W / 2) - W / 2 + dx, y: cy - h / 2, w: W, h, radius: Math.min(R, h / 2) })
  const L = hmUI.createWidget(hmUI.widget.FILL_RECT, { ...pos(-1), color: COLORE.riposo })
  const D = hmUI.createWidget(hmUI.widget.FILL_RECT, { ...pos(1), color: COLORE.riposo })
  let colore = COLORE.riposo, sguardo = 0, timer = null, vivo = true

  const disegna = (h = H) => {
    L.setProperty(hmUI.prop.MORE, { ...pos(-1, sguardo, h), color: colore })
    D.setProperty(hmUI.prop.MORE, { ...pos(1, sguardo, h), color: colore })
  }
  const battito = () => {
    if (!vivo) return
    disegna(px(8))
    setTimeout(() => vivo && disegna(), 130)
    const r = Math.random()
    if (r < 0.35) { sguardo = (Math.random() < 0.5 ? -1 : 1) * px(14); setTimeout(() => vivo && disegna(), 140) }
    else if (r < 0.6) { sguardo = 0; setTimeout(() => vivo && disegna(), 140) }
    timer = setTimeout(battito, 2500 + Math.random() * 3500)
  }
  timer = setTimeout(battito, 1500)

  return {
    stato(nome) {
      colore = COLORE[nome] || COLORE.riposo
      sguardo = nome === 'pensa' ? px(10) : 0
      disegna(nome === 'dorme' ? px(10) : H)
    },
    ferma() { vivo = false; clearTimeout(timer) },
  }
}
