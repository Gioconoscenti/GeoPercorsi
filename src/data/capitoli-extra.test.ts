import { beforeAll, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { setRuntime } from '../lib/runtime'
import { caricaGeo } from '../geo/useGeo'
import { puntiMassimi } from '../attivita/correzione'
import { CAPITOLI_EXTRA, coloriUE, percorsiExtra } from './capitoli-extra'
import type { Attivita, Percorso } from '../types'

beforeAll(() => {
  setRuntime({
    assetUrl: async () => undefined,
    assetInfo: async () => undefined,
    pdfPagine: async () => undefined,
    loadGeo: async (area, tipo) => JSON.parse(fs.readFileSync(path.join(__dirname, '../../public/geo', area, tipo + '.json'), 'utf8')),
    flagUrl: () => '',
  })
})

const attivitaDi = (p: Percorso) => p.tappe.flatMap((t) => t.elementi).flatMap((e) => (e.tipo === 'attivita' ? [e.attivita] : []))

describe('percorsi aggiunti (temi e carte mute)', () => {
  let percorsi: Percorso[] = []
  beforeAll(async () => { percorsi = await percorsiExtra() }, 120000)

  it('si creano tutti, con titoli diversi e almeno una attività ciascuno', () => {
    expect(percorsi).toHaveLength(CAPITOLI_EXTRA().length)
    expect(new Set(percorsi.map((p) => p.titolo)).size).toBe(percorsi.length)
    for (const p of percorsi) expect(attivitaDi(p).length, p.titolo).toBeGreaterThan(0)
  })

  it('ogni attività ha elementi da giocare e il punteggio massimo coincide', () => {
    for (const p of percorsi) {
      for (const a of attivitaDi(p)) {
        expect(puntiMassimi(a), `${p.titolo} / ${a.titolo}`).toBeGreaterThan(0)
        if (a.tipo === 'etichette' || a.tipo === 'trova') expect(a.obiettivi.length, `${p.titolo} / ${a.titolo}`).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('i luoghi delle carte mute e dei giochi esistono davvero nelle carte', async () => {
    for (const p of percorsi) {
      for (const a of attivitaDi(p)) {
        if (a.tipo !== 'etichette' && a.tipo !== 'trova') continue
        const geo = await caricaGeo(a.mappa.area, a.mappa.tipo)
        for (const id of a.obiettivi) expect(geo.byId.has(id), `${p.titolo} / ${a.titolo}: ${id}`).toBe(true)
      }
    }
  })

  it('le carte mute sono una per regione italiana e per ogni Stato scelto, in coppia politica/fisica', () => {
    const mute = (t: string) => attivitaDi(percorsi.find((p) => p.titolo === t)!).filter((a) => a.titolo.startsWith('Carta muta'))
    expect(mute('Carte mute: il Nord-Ovest').map((a) => a.titolo).sort()).toContain('Carta muta fisica – Lombardia')
    expect(mute('Carte mute: il Sud e le isole').some((a) => a.titolo === 'Carta muta fisica – Sardegna')).toBe(true)
    expect(mute('Carte mute: la Regione iberica').some((a) => a.titolo === 'Carta muta politica – Spagna')).toBe(true)
    expect(mute('Carte mute: l’Africa').some((a) => a.titolo.startsWith('Carta muta politica'))).toBe(true)
  })

  it('stampa il riepilogo delle carte mute', () => {
    const righe: string[] = []
    for (const p of percorsi.filter((x) => x.titolo.startsWith('Carte mute'))) {
      const at = attivitaDi(p)
      righe.push(`${p.titolo}: ${at.length} attività -> ${at.map((a: Attivita) => (a.tipo === 'etichette' ? a.titolo.replace('Carta muta ', '') + `(${a.obiettivi.length})` : a.titolo)).join(' | ')}`)
    }
    console.log(righe.join('\n'))
  })
})

describe('Unione europea', () => {
  it('i colori seguono l’anno di ingresso scritto nelle carte', async () => {
    const eu = await caricaGeo('europa', 'politica')
    const anno = (id: string) => Number(/dal (\d{4})/.exec(String(eu.byId.get(id)?.properties.i_Unione_europea))?.[1])
    const colori = coloriUE()
    expect(Object.keys(colori)).toHaveLength(27)
    const per = (c: string) => Object.entries(colori).filter(([, x]) => x === c).map(([id]) => anno(id))
    expect(per('#2563eb').every((a) => a === 1957)).toBe(true)
    expect(per('#16a34a').every((a) => a >= 1973 && a <= 1995)).toBe(true)
    expect(per('#f97316').every((a) => a === 2004)).toBe(true)
    expect(per('#a855f7').every((a) => a === 2007 || a === 2013)).toBe(true)
  })
})
