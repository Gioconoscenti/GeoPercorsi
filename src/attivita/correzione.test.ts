import { describe, expect, it } from 'vitest'
import { analizzaCompleta, bucoGiusto, correggiAbbina, correggiCompleta, correggiEtichette, correggiOrdina, correggiQuiz, correggiTrova, correggiVF, domandaGiusta, mescolaDiverso } from './correzione'

describe('quiz', () => {
  it('risposta singola', () => {
    expect(domandaGiusta([1], [1])).toBe(true)
    expect(domandaGiusta([1], [0])).toBe(false)
    expect(domandaGiusta([1], [])).toBe(false)
  })
  it('risposte multiple: servono tutte e solo quelle giuste', () => {
    expect(domandaGiusta([0, 2], [2, 0])).toBe(true)
    expect(domandaGiusta([0, 2], [0])).toBe(false)
    expect(domandaGiusta([0, 2], [0, 1, 2])).toBe(false)
  })
  it('punteggio', () => {
    expect(correggiQuiz([{ corrette: [0] }, { corrette: [1] }, { corrette: [0, 1] }], [[0], [0], [1, 0]])).toEqual({ punti: 2, max: 3 })
    expect(correggiQuiz([{ corrette: [0] }], [])).toEqual({ punti: 0, max: 1 })
  })
})

describe('vero/falso, abbina, ordina, mappe', () => {
  it('vero/falso', () => {
    expect(correggiVF([{ vera: true }, { vera: false }, { vera: true }], [true, true, null])).toEqual({ punti: 1, max: 3 })
  })
  it('abbina', () => {
    expect(correggiAbbina(3, [0, 2, 1])).toEqual({ punti: 1, max: 3 })
    expect(correggiAbbina(2, [0, 1])).toEqual({ punti: 2, max: 2 })
  })
  it('ordina', () => {
    expect(correggiOrdina(['a', 'b', 'c'], ['a', 'c', 'b'])).toEqual({ punti: 1, max: 3 })
  })
  it('etichette e trova', () => {
    expect(correggiEtichette(['x', 'y'], { x: 'x', y: 'x' })).toEqual({ punti: 1, max: 2 })
    expect(correggiTrova([true, false, true], 3)).toEqual({ punti: 2, max: 3 })
  })
  it('mescolaDiverso cambia l’ordine', () => {
    for (let i = 0; i < 20; i++) expect(mescolaDiverso([1, 2, 3])).not.toEqual([1, 2, 3])
  })
})

describe('completa il testo', () => {
  const testo = 'Il [Po|fiume Po] sfocia nel mare [Adriatico]. La capitale è [Roma].'
  it('trova gli spazi', () => {
    const p = analizzaCompleta(testo)
    expect(p.filter((x) => x.tipo === 'buco')).toHaveLength(3)
    expect(p[0]).toEqual({ tipo: 'testo', testo: 'Il ' })
    expect(p[1]).toEqual({ tipo: 'buco', soluzioni: ['Po', 'fiume Po'] })
  })
  it('ignora maiuscole, accenti e spazi', () => {
    expect(bucoGiusto(['Po'], '  po ')).toBe(true)
    expect(bucoGiusto(['Città'], 'citta')).toBe(true)
    expect(bucoGiusto(['L’Aquila'], "l'aquila")).toBe(true)
    expect(bucoGiusto(['Po'], '')).toBe(false)
  })
  it('punteggio con alternative', () => {
    expect(correggiCompleta(testo, ['fiume po', 'adriatico', 'Milano'])).toEqual({ punti: 2, max: 3 })
  })
})
