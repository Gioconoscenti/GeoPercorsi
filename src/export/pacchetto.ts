import JSZip from 'jszip'
import type { Asset, Percorso } from '../types'
import { nuovoId } from '../lib/id'
import { nomeFile, scaricaBlob } from '../lib/scarica'

const VERSIONE = 1

/** Tutti gli id dei file usati dal percorso */
export function assetUsati(p: Percorso): string[] {
  const ids = new Set<string>()
  const walk = (o: unknown) => {
    if (Array.isArray(o)) o.forEach(walk)
    else if (o && typeof o === 'object') {
      for (const [k, v] of Object.entries(o)) {
        if ((k === 'assetId' || k === 'sfondoAssetId') && typeof v === 'string') ids.add(v)
        else walk(v)
      }
    }
  }
  walk(p.tappe)
  return [...ids]
}

/** Mappe (area/tipo) usate dal percorso */
export function mappeUsate(p: Percorso): string[] {
  const out = new Set<string>()
  const walk = (o: unknown) => {
    if (Array.isArray(o)) o.forEach(walk)
    else if (o && typeof o === 'object') {
      const r = o as Record<string, unknown>
      if (typeof r.area === 'string' && typeof r.tipo === 'string' && ['politica', 'fisica'].includes(r.tipo)) out.add(`${r.area}/${r.tipo}`)
      Object.values(r).forEach(walk)
    }
  }
  walk(p.tappe)
  return [...out]
}

export async function creaZip(p: Percorso, assets: Asset[]): Promise<Blob> {
  const zip = new JSZip()
  zip.file('manifest.json', JSON.stringify({ app: 'geopercorsi', versione: VERSIONE, assets: assets.map((a) => ({ id: a.id, nome: a.nome, mime: a.mime })) }, null, 2))
  zip.file('percorso.json', JSON.stringify(p, null, 2))
  for (const a of assets) zip.file('assets/' + a.id, a.blob)
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
}

export async function leggiZip(data: Blob | ArrayBuffer): Promise<{ percorso: Percorso; assets: Asset[] }> {
  const zip = await JSZip.loadAsync(data)
  const man = zip.file('manifest.json')
  const per = zip.file('percorso.json')
  if (!man || !per) throw new Error('Il file non è un pacchetto GeoPercorsi')
  const manifest = JSON.parse(await man.async('string')) as { app: string; assets: { id: string; nome: string; mime: string }[] }
  if (manifest.app !== 'geopercorsi') throw new Error('Il file non è un pacchetto GeoPercorsi')
  const percorso = JSON.parse(await per.async('string')) as Percorso
  const assets: Asset[] = []
  for (const a of manifest.assets) {
    const f = zip.file('assets/' + a.id)
    if (!f) continue
    const buf = await f.async('arraybuffer')
    assets.push({ ...a, blob: new Blob([buf], { type: a.mime }) })
  }
  return { percorso, assets }
}

export async function scaricaPacchetto(p: Percorso) {
  const { db } = await import('../data/db')
  const assets = (await db.assets.bulkGet(assetUsati(p))).filter((a): a is Asset => !!a)
  scaricaBlob(await creaZip(p, assets), nomeFile(p.titolo) + '.geopercorso')
}

export async function importaPacchetto(file: Blob): Promise<Percorso> {
  const { db } = await import('../data/db')
  const { percorso, assets } = await leggiZip(file)
  if (await db.percorsi.get(percorso.id)) {
    percorso.id = nuovoId()
    percorso.titolo += ' (importato)'
  }
  await db.transaction('rw', db.percorsi, db.assets, async () => {
    await db.assets.bulkPut(assets)
    await db.percorsi.put({ ...percorso, aggiornato: Date.now() })
  })
  return percorso
}
