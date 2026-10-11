import { aggiungiAsset } from '../data/db'
import { nuovoElemento } from '../lib/fabbrica'
import { STAGE_H, STAGE_W, type Elemento } from '../types'

/** Apre la finestra di scelta file */
export function scegliFile(accept: string, multiplo = false): Promise<File[]> {
  return new Promise((res) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = multiplo
    input.onchange = () => res(Array.from(input.files ?? []))
    // chiudendo la finestra senza scegliere: lista vuota (evento "cancel", browser recenti)
    input.addEventListener('cancel', () => res([]))
    input.click()
  })
}

function dimensioniImmagine(file: Blob): Promise<[number, number]> {
  return new Promise((res) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { res([img.naturalWidth, img.naturalHeight]); URL.revokeObjectURL(url) }
    img.onerror = () => res([4, 3])
    img.src = url
  })
}

export const ACCETTA_MEDIA = 'image/*,video/*,audio/*,application/pdf'

/** Crea l'elemento giusto per un file caricato (immagine, video, audio, PDF) */
export async function elementoDaFile(file: File, centro?: { x: number; y: number }): Promise<Elemento | null> {
  const t = file.type
  const tipo = t.startsWith('image/') ? 'immagine' : t.startsWith('video/') ? 'video' : t.startsWith('audio/') ? 'audio' : t === 'application/pdf' ? 'pdf' : null
  if (!tipo) return null
  const assetId = await aggiungiAsset(file)
  const el = nuovoElemento(tipo, { assetId } as never)
  if (tipo === 'audio') (el as Extract<Elemento, { tipo: 'audio' }>).etichetta = file.name.replace(/\.[^.]+$/, '')
  if (tipo === 'immagine') {
    const [w, h] = await dimensioniImmagine(file)
    const s = Math.min(640 / w, 440 / h, 1.5)
    el.w = Math.round(w * s)
    el.h = Math.round(h * s)
  }
  if (centro) {
    el.x = Math.round(Math.max(0, Math.min(STAGE_W - el.w, centro.x - el.w / 2)))
    el.y = Math.round(Math.max(0, Math.min(STAGE_H - el.h, centro.y - el.h / 2)))
  } else {
    el.x = Math.round((STAGE_W - el.w) / 2)
    el.y = Math.round((STAGE_H - el.h) / 2)
  }
  return el
}
