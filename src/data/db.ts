import Dexie, { type EntityTable } from 'dexie'
import type { Asset, Percorso } from '../types'

export const db = new Dexie('geopercorsi') as Dexie & {
  percorsi: EntityTable<Percorso, 'id'>
  assets: EntityTable<Asset, 'id'>
  impostazioni: EntityTable<{ chiave: string; valore: unknown }, 'chiave'>
}

db.version(1).stores({
  percorsi: 'id, classe, aggiornato',
  assets: 'id',
  impostazioni: 'chiave',
})

export async function salvaPercorso(p: Percorso) {
  await db.percorsi.put({ ...p, aggiornato: Date.now() })
}

export async function aggiungiAsset(file: File | Blob, nome?: string): Promise<string> {
  const { nuovoId } = await import('../lib/id')
  const id = nuovoId()
  await db.assets.put({ id, nome: nome ?? (file as File).name ?? 'file', mime: file.type || 'application/octet-stream', blob: file })
  return id
}
