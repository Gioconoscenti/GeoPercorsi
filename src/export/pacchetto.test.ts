import { describe, expect, it } from 'vitest'
import { assetUsati, creaZip, leggiZip, mappeUsate } from './pacchetto'
import { esempi } from '../data/esempi'
import type { Asset, Percorso } from '../types'

describe('pacchetto .geopercorso', () => {
  const p: Percorso = esempi()[0]
  p.tappe[1].sfondoAssetId = 'img1'
  p.tappe[1].elementi.push({ id: 'e1', tipo: 'immagine', x: 0, y: 0, w: 10, h: 10, adatta: 'contain', assetId: 'img2' })

  it('trova file e mappe usati', () => {
    expect(assetUsati(p).sort()).toEqual(['img1', 'img2'])
    expect(mappeUsate(p)).toContain('italia/politica')
  })

  it('esporta e reimporta senza perdite', async () => {
    const assets: Asset[] = [
      { id: 'img1', nome: 'sfondo.png', mime: 'image/png', blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }) },
      { id: 'img2', nome: 'foto.jpg', mime: 'image/jpeg', blob: new Blob([new Uint8Array([9, 8, 7, 6])], { type: 'image/jpeg' }) },
    ]
    const zip = await creaZip(p, assets)
    const letto = await leggiZip(await zip.arrayBuffer())
    expect(letto.percorso).toEqual(p)
    expect(letto.assets.map((a) => [a.id, a.nome, a.mime])).toEqual(assets.map((a) => [a.id, a.nome, a.mime]))
    expect([...new Uint8Array(await letto.assets[1].blob.arrayBuffer())]).toEqual([9, 8, 7, 6])
  })

  it('rifiuta file non validi', async () => {
    await expect(leggiZip(new Blob(['ciao']))).rejects.toThrow()
  })

  it('rifiuta pacchetti con un percorso danneggiato', async () => {
    for (const rotto of [{ ...p, tappe: undefined }, { ...p, classe: 7 }, { ...p, tappe: [{ titolo: 'x' }] }]) {
      const zip = await creaZip(rotto as unknown as Percorso, [])
      await expect(leggiZip(await zip.arrayBuffer())).rejects.toThrow(/danneggiato/)
    }
  })
})
