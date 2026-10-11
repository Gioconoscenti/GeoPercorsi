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

/** Controllo minimo della struttura, per non salvare percorsi che poi manderebbero in errore l'app */
function percorsoValido(p: unknown): p is Percorso {
  const x = p as Partial<Percorso> | null
  return !!x && typeof x.id === 'string' && typeof x.titolo === 'string' && [1, 2, 3].includes(x.classe as number) &&
    Array.isArray(x.tappe) && x.tappe.every((t) => !!t && typeof t.id === 'string' && Array.isArray(t.elementi))
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
  if (!percorsoValido(percorso)) throw new Error('Il pacchetto è danneggiato o di una versione non compatibile')
  const assets: Asset[] = []
  for (const a of manifest.assets ?? []) {
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

/** Backup di tutti i percorsi: uno zip che contiene un pacchetto .geopercorso per ciascuno */
export async function scaricaBackup(): Promise<number> {
  const { db } = await import('../data/db')
  const percorsi = await db.percorsi.toArray()
  const zip = new JSZip()
  zip.file('backup.json', JSON.stringify({ app: 'geopercorsi-backup', versione: VERSIONE, data: Date.now(), percorsi: percorsi.length }, null, 2))
  const nomi = new Set<string>()
  for (const p of percorsi) {
    const assets = (await db.assets.bulkGet(assetUsati(p))).filter((a): a is Asset => !!a)
    let nome = nomeFile(p.titolo)
    while (nomi.has(nome)) nome += '_'
    nomi.add(nome)
    zip.file(`percorsi/${nome}.geopercorso`, await creaZip(p, assets))
  }
  const oggi = new Date().toISOString().slice(0, 10)
  scaricaBlob(await zip.generateAsync({ type: 'blob' }), `GeoPercorsi_backup_${oggi}.zip`)
  await db.impostazioni.put({ chiave: 'ultimo-backup', valore: Date.now() })
  return percorsi.length
}

/** Importa un pacchetto .geopercorso oppure un backup completo; restituisce i percorsi importati */
export async function importaFile(file: Blob): Promise<Percorso[]> {
  const zip = await JSZip.loadAsync(file)
  if (!zip.file('backup.json')) return [await importaPacchetto(file)]
  const out: Percorso[] = []
  for (const f of Object.values(zip.files).filter((f) => !f.dir && f.name.endsWith('.geopercorso'))) {
    out.push(await importaPacchetto(await f.async('blob'), true))
  }
  return out
}

export async function importaPacchetto(file: Blob, ripristino = false): Promise<Percorso> {
  const { db } = await import('../data/db')
  const { percorso, assets } = await leggiZip(file)
  // ripristinando un backup, un percorso identico a quello già presente non si duplica
  const esistente = await db.percorsi.get(percorso.id)
  if (ripristino && esistente && esistente.aggiornato >= percorso.aggiornato) return esistente
  if (esistente && !ripristino) {
    percorso.id = nuovoId()
    percorso.titolo += ' (importato)'
  }
  await db.transaction('rw', db.percorsi, db.assets, async () => {
    await db.assets.bulkPut(assets)
    await db.percorsi.put(ripristino ? percorso : { ...percorso, aggiornato: Date.now() })
  })
  return percorso
}
