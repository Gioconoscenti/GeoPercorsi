import { beforeAll, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { setRuntime } from '../lib/runtime'
import { caricaGeo } from '../geo/useGeo'
import { genera, generatoriPossibili, livelliDisponibili, pool } from './generatori'
import type { Attivita } from '../types'

// le carte vere di public/geo
beforeAll(() => {
  setRuntime({
    assetUrl: async () => undefined,
    assetInfo: async () => undefined,
    pdfPagine: async () => undefined,
    loadGeo: async (area, tipo) => JSON.parse(fs.readFileSync(path.join(__dirname, '../../public/geo', area, tipo + '.json'), 'utf8')),
    flagUrl: () => '',
  })
})

const quiz = (a: Attivita) => {
  if (a.tipo !== 'quiz') throw new Error('non è un quiz')
  return a
}

describe('dati di dettaglio', () => {
  it('ogni regione ha province, capoluogo di provincia e scheda completa', async () => {
    const it = await caricaGeo('italia', 'politica')
    expect(it.perLivello.get('province')).toHaveLength(110)
    for (const r of it.perLivello.get('regioni')!) {
      const id = r.properties.id!
      expect(pool(it, 'province', undefined, id).length, r.properties.nome).toBeGreaterThan(0)
      expect(r.properties.i_Confina_con, r.properties.nome).toBeTruthy()
      expect(r.properties.desc, r.properties.nome).toBeTruthy()
    }
    // la Lombardia ha 12 province
    expect(pool(it, 'province', undefined, 'regione-3')).toHaveLength(12)
  })

  it('ogni regione ha fiumi o laghi e almeno una vetta', async () => {
    const fis = await caricaGeo('italia', 'fisica')
    for (let r = 1; r <= 20; r++) {
      const id = 'regione-' + r
      expect(pool(fis, 'fiumi', undefined, id).length + pool(fis, 'laghi', undefined, id).length, id).toBeGreaterThan(0)
      expect(pool(fis, 'vette', undefined, id).length + pool(fis, 'vulcani', undefined, id).length, id).toBeGreaterThan(0)
    }
  })

  it('ogni Stato europeo ha la scheda e (se non è minuscolo) le suddivisioni', async () => {
    const eu = await caricaGeo('europa', 'politica')
    const piccoli = ['stato-AND', 'stato-LIE', 'stato-MCO', 'stato-SMR', 'stato-VAT', 'stato-MLT', 'stato-LUX', 'stato-CYP']
    for (const s of eu.perLivello.get('stati')!) {
      const id = s.properties.id!
      expect(s.properties.i_Governo, id).toBeTruthy()
      if (!piccoli.includes(id)) expect(pool(eu, 'suddivisioni', undefined, id).length, id).toBeGreaterThan(1)
    }
    expect(pool(eu, 'suddivisioni', undefined, 'stato-FRA')).toHaveLength(13)
    expect(pool(eu, 'suddivisioni', undefined, 'stato-DEU')).toHaveLength(16)
  })
})

describe('giochi su una singola regione / Stato', () => {
  it('trova le province della Lombardia', async () => {
    const a = await genera('trova', { area: 'italia', tipo: 'politica', livello: 'province', quanti: 20, focus: 'regione-3' })
    if (a.tipo !== 'trova') throw new Error()
    expect(a.obiettivi).toHaveLength(12)
    expect(a.mappa.focus).toBe('regione-3')
    expect(a.obiettivi).toContain('provincia-MI')
  })

  it('quiz sui capoluoghi di provincia della Toscana', async () => {
    const q = quiz(await genera('capitali', { area: 'italia', tipo: 'politica', livello: 'province', quanti: 10, focus: 'regione-9' }))
    expect(q.domande).toHaveLength(10)
    const lucca = q.domande.find((d) => d.domanda.startsWith('Lucca'))!
    expect(lucca.opzioni[lucca.corrette[0]]).toBe('Lucca')
    expect(lucca.opzioni).toHaveLength(4)
  })

  it('le regioni della Francia', async () => {
    const eu = await caricaGeo('europa', 'politica')
    expect(livelliDisponibili(eu, 'stato-FRA')).toContain('suddivisioni')
    const a = await genera('etichette', { area: 'europa', tipo: 'politica', livello: 'suddivisioni', quanti: 13, focus: 'stato-FRA' })
    if (a.tipo !== 'etichette') throw new Error()
    expect(a.obiettivi).toHaveLength(13)
  })

  it('i fiumi della Germania includono anche quelli minori', async () => {
    const fis = await caricaGeo('europa', 'fisica')
    const tutti = pool(fis, 'fiumi')
    const tedeschi = pool(fis, 'fiumi', undefined, 'stato-DEU')
    expect(tedeschi.map((f) => f.properties.nome)).toEqual(expect.arrayContaining(['Reno', 'Elba', 'Danubio']))
    expect(tedeschi.some((f) => f.properties.minore)).toBe(true)
    expect(tutti.some((f) => f.properties.minore)).toBe(false)
  })
})

describe('nuovi quiz', () => {
  it('confini: la risposta giusta confina davvero', async () => {
    const it = await caricaGeo('italia', 'politica')
    const q = quiz(await genera('confini', { area: 'italia', tipo: 'politica', livello: 'regioni', quanti: 8 }))
    expect(q.domande.length).toBeGreaterThan(0)
    for (const d of q.domande) {
      const nome = d.domanda.replace('Quale di queste regioni confina con ', '').replace('?', '')
      const r = it.perLivello.get('regioni')!.find((x) => x.properties.nome === nome)!
      const vicini = r.properties.i_Confina_con as string
      expect(vicini).toContain(d.opzioni[d.corrette[0]])
      for (const [i, o] of d.opzioni.entries()) if (i !== d.corrette[0]) expect(vicini.split(', ')).not.toContain(o)
    }
  })

  it('dove si trova: fiumi e regioni', async () => {
    expect(generatoriPossibili(await caricaGeo('italia', 'fisica'), 'fiumi')).toContain('dove')
    const q = quiz(await genera('dove', { area: 'italia', tipo: 'fisica', livello: 'fiumi', quanti: 6 }))
    expect(q.domande).toHaveLength(6)
    for (const d of q.domande) expect(d.opzioni).toHaveLength(4)
  })
})

describe('strumenti del geografo', () => {
  it('direzioni cardinali', async () => {
    const { direzione } = await import('./generatori')
    const roma: [number, number] = [12.5, 41.9]
    expect(direzione(roma, [9.19, 45.46])).toBe('Nord-Ovest') // Milano
    expect(direzione(roma, [16.87, 41.12])).toBe('Est') // Bari
    expect(direzione(roma, [13.36, 38.12])).toBe('Sud') // Palermo
  })

  it('fusi orari teorici', async () => {
    const { fusoTeorico } = await import('./generatori')
    expect(fusoTeorico(12.5)).toBe(1) // Roma
    expect(fusoTeorico(139.7)).toBe(9) // Tokyo
    expect(fusoTeorico(-74)).toBe(-5) // New York
  })

  it('quiz e giochi sulle coordinate', async () => {
    const q = quiz(await genera('coordinate-quiz', { area: 'italia', tipo: 'politica', livello: 'citta', quanti: 5 }))
    expect(q.domande).toHaveLength(5)
    for (const d of q.domande) expect(new Set(d.opzioni).size).toBe(4)
    const c = await genera('coordinate-clic', { area: 'europa', tipo: 'politica', livello: 'citta', quanti: 6 })
    if (c.tipo !== 'coordinate') throw new Error()
    expect(c.punti).toHaveLength(6)
    expect(c.mappa.livelli).toContain('reticolato')
  })

  it('fusi orari nel mondo', async () => {
    const q = quiz(await genera('fusi', { area: 'mondo', tipo: 'politica', livello: 'citta', quanti: 6 }))
    expect(q.domande.length).toBeGreaterThan(0)
    for (const d of q.domande) expect(d.domanda).toContain('Roma')
  })

  it('i fusi orari sono 24 spicchi più quello del cambio di data', async () => {
    const m = await caricaGeo('mondo', 'politica')
    expect(m.perLivello.get('fusi')!.length).toBe(25)
  })
})

describe('regioni d’Europa', () => {
  it('ogni Stato studiato appartiene a una regione d’Europa', async () => {
    const eu = await caricaGeo('europa', 'politica')
    expect(eu.perLivello.get('macroregioni')!.length).toBe(9)
    expect(pool(eu, 'stati', undefined, 'macro-germanica').map((f) => f.properties.nome).sort()).toEqual(['Austria', 'Germania', 'Liechtenstein', 'Svizzera'])
    expect(pool(eu, 'stati', undefined, 'macro-nordica')).toHaveLength(8)
  })

  it('capitali della Regione balcanica e "dove si trova" per gli Stati', async () => {
    const q = quiz(await genera('capitali', { area: 'europa', tipo: 'politica', livello: 'stati', quanti: 10, focus: 'macro-balcanica' }))
    expect(q.domande).toHaveLength(10)
    const d = quiz(await genera('dove', { area: 'europa', tipo: 'politica', livello: 'stati', quanti: 5 }))
    for (const x of d.domande) expect(x.domanda).toMatch(/regione d’Europa/)
  })

  it('fiumi della Regione germanica', async () => {
    const fis = await caricaGeo('europa', 'fisica')
    expect(pool(fis, 'fiumi', undefined, 'macro-germanica').map((f) => f.properties.nome)).toEqual(expect.arrayContaining(['Reno', 'Danubio', 'Elba']))
  })
})

describe('mondo: continenti, aree geografiche e Stati studiati', () => {
  it('le aree geografiche contengono gli Stati del libro', async () => {
    const m = await caricaGeo('mondo', 'politica')
    const nomi = (focus: string) => pool(m, 'stati', undefined, focus).map((f) => f.properties.nome)
    expect(nomi('macro-africa-settentrionale')).toEqual(expect.arrayContaining(['Marocco', 'Egitto']))
    expect(nomi('macro-africa-meridionale')).toEqual(expect.arrayContaining(['Zambia', 'Sudafrica']))
    expect(nomi('macro-medio-oriente')).toEqual(expect.arrayContaining(['Turchia', 'Israele', 'Iran']))
    expect(nomi('macro-america-anglosassone')).toEqual(expect.arrayContaining(['Canada']))
    expect(nomi('macro-america-latina')).toEqual(expect.arrayContaining(['Messico', 'Cuba', 'Brasile', 'Perù', 'Argentina']))
  })

  it('gli Stati studiati hanno la scheda completa', async () => {
    const m = await caricaGeo('mondo', 'politica')
    for (const a3 of ['MAR', 'EGY', 'NGA', 'KEN', 'ZMB', 'ZAF', 'IND', 'CHN', 'JPN', 'USA', 'BRA', 'AUS']) {
      const s = m.byId.get('stato-' + a3)!.properties
      expect(s.i_Lingua, a3).toBeTruthy()
      expect(s.i_Governo, a3).toBeTruthy()
      expect(s.desc, a3).toBeTruthy()
    }
  })

  it('gli Stati federati degli USA e i fiumi del Brasile', async () => {
    const m = await caricaGeo('mondo', 'politica')
    expect(pool(m, 'suddivisioni', undefined, 'stato-USA')).toHaveLength(51)
    const fis = await caricaGeo('mondo', 'fisica')
    expect(pool(fis, 'fiumi', undefined, 'stato-BRA').length).toBeGreaterThan(5)
    const q = quiz(await genera('dove', { area: 'mondo', tipo: 'politica', livello: 'stati', quanti: 5 }))
    for (const d of q.domande) expect(d.domanda).toMatch(/continente/)
  })
})

describe('percorsi dei capitoli', () => {
  it('ogni capitolo diventa un percorso completo', async () => {
    const { percorsiCapitoli, CAPITOLI } = await import('../data/capitoli')
    const percorsi = await percorsiCapitoli()
    expect(percorsi).toHaveLength(CAPITOLI.length)
    for (const [i, p] of percorsi.entries()) {
      // copertina + tutte le tappe: nessuna attività deve mancare
      expect(p.tappe.length, p.titolo).toBe(CAPITOLI[i].passi.length + 1)
      for (const t of p.tappe) for (const e of t.elementi) {
        if (e.tipo !== 'attivita') continue
        const a = e.attivita
        if (a.tipo === 'quiz') expect(a.domande.length, `${p.titolo}: ${a.titolo}`).toBeGreaterThan(0)
        if (a.tipo === 'trova' || a.tipo === 'etichette') expect(a.obiettivi.length, `${p.titolo}: ${a.titolo}`).toBeGreaterThanOrEqual(3)
      }
    }
    expect(percorsi.filter((p) => p.classe === 2).map((p) => p.titolo)).toContain('La Regione nordica')
  }, 60000)
})
