import { db } from '../data/db'
import { memo, type Runtime } from './runtime'

const urls = new Map<string, string>()
const BASE = import.meta.env.BASE_URL

const pdfPagine = memo(async (id: string) => {
  const a = await db.assets.get(id)
  if (!a) return undefined
  const { renderPdf } = await import('./pdf')
  return renderPdf(a.blob)
})

const loadGeo = memo(async ([area, tipo]: [string, string]) => {
  const res = await fetch(`${BASE}geo/${area}/${tipo}.json`)
  if (!res.ok) throw new Error('Mappa non trovata: ' + area + '/' + tipo)
  return res.json()
})

export const appRuntime: Runtime = {
  async assetUrl(id) {
    if (urls.has(id)) return urls.get(id)
    const a = await db.assets.get(id)
    if (!a) return undefined
    const u = URL.createObjectURL(a.blob)
    urls.set(id, u)
    return u
  },
  async assetInfo(id) {
    const a = await db.assets.get(id)
    return a ? { nome: a.nome, mime: a.mime } : undefined
  },
  pdfPagine,
  loadGeo: (area, tipo) => loadGeo([area, tipo]),
  flagUrl: (code) => `${BASE}flags/${code}.svg`,
}
