import type { Topology } from 'topojson-specification'
import type { Area, Percorso, TipoMappa } from '../types'
import type { DatiStandalone } from '../lib/runtime-standalone'
import { assetUsati, mappeUsate } from './pacchetto'
import { nomeFile, scaricaBlob } from '../lib/scarica'
import { getRuntime } from '../lib/runtime'

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = () => rej(r.error)
    r.readAsDataURL(b)
  })

/** Codici bandiera usati: tutti quelli delle mappe politiche incluse + quelli delle domande */
function bandiere(p: Percorso, geo: Record<string, Topology>): string[] {
  const out = new Set<string>()
  JSON.stringify(p.tappe, (k, v) => { if (k === 'bandiera' && typeof v === 'string') out.add(v); return v })
  for (const t of Object.values(geo)) JSON.stringify(t, (k, v) => { if (k === 'flag' && typeof v === 'string') out.add(v); return v })
  return [...out]
}

/** Crea un unico file HTML con player + percorso + file + mappe, apribile offline */
export async function esportaPerAlunni(p: Percorso) {
  const { db } = await import('../data/db')
  const base = import.meta.env.BASE_URL
  const res = await fetch(base + 'player/player.html')
  if (!res.ok) throw new Error('Player non trovato: esegui “npm run build:player”')
  let html = await res.text()

  const dati: DatiStandalone = { percorso: p, assets: {}, pdf: {}, geo: {}, flags: {} }
  for (const id of assetUsati(p)) {
    const a = await db.assets.get(id)
    if (!a) continue
    if (a.mime === 'application/pdf') {
      dati.pdf[id] = (await getRuntime().pdfPagine(id)) ?? []
      dati.assets[id] = { url: '', nome: a.nome, mime: a.mime }
    } else {
      dati.assets[id] = { url: await blobToDataUrl(a.blob), nome: a.nome, mime: a.mime }
    }
  }
  for (const key of mappeUsate(p)) {
    const [area, tipo] = key.split('/') as [Area, TipoMappa]
    dati.geo[key] = await getRuntime().loadGeo(area, tipo)
  }
  for (const code of bandiere(p, dati.geo)) {
    const r = await fetch(getRuntime().flagUrl(code))
    if (r.ok) dati.flags[code] = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(await r.text())))
  }
  // "<" diventa \u003c: nessun testo può chiudere il tag <script>
  const json = JSON.stringify(dati).replace(/</g, () => '\\u003c')
  // replacement tramite funzione: il JSON può contenere "$&" e simili
  html = html.replace(/<title>.*?<\/title>/, () => `<title>${p.titolo.replace(/</g, '&lt;')}</title>`)
    .replace('<head>', () => `<head><script>window.__GEOPERCORSO__=${json};</script>`)
  scaricaBlob(new Blob([html], { type: 'text/html' }), nomeFile(p.titolo) + '.html')
}
