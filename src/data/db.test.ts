import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { db, pulisciAsset } from './db'
import { nuovoPercorso } from '../lib/fabbrica'

const asset = (id: string) => ({ id, nome: id + '.png', mime: 'image/png', blob: new Blob([id]) })

describe('pulizia dei file', () => {
  it('tiene i file usati e cancella quelli orfani', async () => {
    const p = nuovoPercorso(1)
    p.tappe[0].sfondoAssetId = 'sfondo'
    p.tappe[0].elementi.push({ id: 'e1', tipo: 'immagine', x: 0, y: 0, w: 10, h: 10, adatta: 'contain', assetId: 'foto' })
    await db.percorsi.put(p)
    await db.assets.bulkPut([asset('sfondo'), asset('foto'), asset('vecchia'), asset('di-un-percorso-eliminato')])

    expect(await pulisciAsset()).toBe(2)
    expect((await db.assets.toCollection().primaryKeys()).sort()).toEqual(['foto', 'sfondo'])
  })
})
