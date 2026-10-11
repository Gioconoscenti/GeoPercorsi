import { beforeAll, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { setRuntime } from '../lib/runtime'
import { convertiPercorso, estraiJson, normalizza } from './schema'
import { costruisciPrompt } from './prompt'

beforeAll(() => {
  setRuntime({
    assetUrl: async () => undefined,
    assetInfo: async () => undefined,
    pdfPagine: async () => undefined,
    loadGeo: async (area, tipo) => JSON.parse(fs.readFileSync(path.join(__dirname, '../../public/geo', area, tipo + '.json'), 'utf8')),
    flagUrl: () => '',
  })
})

const VALIDO = {
  formato: 'geopercorsi-1',
  titolo: 'Parma, Ferrara e Ravenna',
  descrizione: 'Tre città d’arte',
  classe: 1,
  tappe: [
    { tipo: 'lezione', titolo: 'Introduzione', testo: 'Tre città dell’Emilia-Romagna.' },
    { tipo: 'carta', titolo: 'Dove sono', area: 'italia', carta: 'politica', zoom: 'Emilia-Romagna', testo: 'Clicca le città.',
      schede: { Parma: 'Città farnesiana.', Ferrara: 'Città estense.', Ravenna: 'Mosaici bizantini.' } },
    { tipo: 'trova', titolo: 'Trova le città', area: 'italia', carta: 'politica', livello: 'capoluoghi', zoom: 'Emilia-Romagna', luoghi: ['Parma', 'Ferrara', 'Ravenna'] },
    { tipo: 'quiz', titolo: 'Quiz', domande: [{ domanda: 'Dove sono i mosaici?', opzioni: ['Parma', 'Ravenna', 'Ferrara'], corrette: [1] }] },
    { tipo: 'vf', titolo: 'V/F', affermazioni: [{ testo: 'Ferrara fu degli Estensi.', vera: true }] },
    { tipo: 'abbina', titolo: 'Abbina', coppie: [{ a: 'Ravenna', b: 'Mosaici' }, { a: 'Ferrara', b: 'Castello' }] },
    { tipo: 'completa', titolo: 'Completa', testo: 'San Vitale è a [Ravenna].' },
    { tipo: 'ordina', titolo: 'Ordina', consegna: 'In ordine', elementi: ['A', 'B', 'C'] },
    { tipo: 'flashcard', titolo: 'Ripasso', carte: [{ fronte: 'Duomo', retro: 'Parma' }] },
  ],
}

describe('estraiJson', () => {
  it('legge un blocco ```json con testo attorno', () => {
    const r = estraiJson('Ecco il percorso:\n```json\n{"a": {"b": "}"}, "c": [1,2,],}\n```\nBuon lavoro!')
    expect(r.errore).toBeUndefined()
    expect(r.dati).toEqual({ a: { b: '}' }, c: [1, 2] })
  })
  it('segnala JSON assente o interrotto', () => {
    expect(estraiJson('niente').errore).toMatch(/nessun JSON/)
    expect(estraiJson('{"a": [1, 2').errore).toMatch(/interrotto/)
  })
})

describe('convertiPercorso', () => {
  it('trasforma un percorso valido, con luoghi e schede collegati alla carta', async () => {
    const r = await convertiPercorso(VALIDO)
    expect(r.errori).toEqual([])
    const p = r.percorso!
    expect(p.tappe).toHaveLength(VALIDO.tappe.length + 1) // + copertina
    const carta = p.tappe[2].elementi.find((e) => e.tipo === 'mappa')!
    if (carta.tipo !== 'mappa') throw new Error()
    expect(Object.keys(carta.contenuti)).toHaveLength(3)
    const trova = p.tappe[3].elementi[0]
    if (trova.tipo !== 'attivita' || trova.attivita.tipo !== 'trova') throw new Error()
    expect(trova.attivita.obiettivi).toHaveLength(3)
    expect(trova.attivita.obiettivi.every((id) => id.startsWith('capoluogo-'))).toBe(true)
    // il pulsante della copertina porta alla prima tappa
    const btn = p.tappe[0].elementi.find((e) => e.tipo === 'pulsante')
    expect(btn && btn.tipo === 'pulsante' && btn.vaiA).toBe(p.tappe[1].id)
  })

  it('scarta i luoghi inesistenti con un avviso', async () => {
    const d = structuredClone(VALIDO)
    d.tappe[2] = { tipo: 'trova', titolo: 'T', area: 'italia', carta: 'politica', livello: 'capoluoghi', luoghi: ['Parma', 'Ferrara', 'Atlantide'] } as never
    const r = await convertiPercorso(d)
    expect(r.errori).toEqual([])
    expect(r.avvisi.join(' ')).toMatch(/Atlantide/)
  })

  it('segnala gli errori con la tappa a cui si riferiscono', async () => {
    const d = structuredClone(VALIDO)
    d.tappe[3] = { tipo: 'quiz', titolo: 'Quiz rotto', domande: [{ domanda: 'X?', opzioni: ['a', 'b'], corrette: [5] }] } as never
    d.tappe.push({ tipo: 'indovinello', titolo: 'Boh' } as never, { tipo: 'completa', titolo: 'C', testo: 'senza parentesi' } as never)
    const r = await convertiPercorso(d)
    expect(r.percorso).toBeUndefined()
    expect(r.errori.some((e) => e.includes('Quiz rotto') && e.includes('corrette'))).toBe(true)
    expect(r.errori.some((e) => e.includes('indovinello'))).toBe(true)
    expect(r.errori.some((e) => e.includes('parentesi quadre'))).toBe(true)
  })

  it('accetta “corretta” singola e rifiuta titolo o tappe mancanti', async () => {
    const ok = await convertiPercorso({ titolo: 'T', tappe: [{ tipo: 'quiz', domande: [{ domanda: 'D?', opzioni: ['a', 'b'], corretta: 1 }] }] })
    expect(ok.errori).toEqual([])
    expect((await convertiPercorso({ tappe: [] })).errori.length).toBeGreaterThan(0)
    expect((await convertiPercorso('x')).errori.length).toBeGreaterThan(0)
  })
})

describe('costruisciPrompt', () => {
  it('contiene richiesta, formato e i luoghi reali della carta', async () => {
    const p = await costruisciPrompt({ richiesta: 'Percorso su Parma, Ferrara e Ravenna', classe: 1, aree: ['italia'] })
    expect(p).toContain('Percorso su Parma, Ferrara e Ravenna')
    expect(p).toContain('geopercorsi-1')
    expect(p).toContain('area "italia", carta "politica"')
    expect(p).toMatch(/livello "regioni"[^\n]*Lombardia/)
    expect(normalizza('L’Aquila')).toBe('laquila')
  })
})
