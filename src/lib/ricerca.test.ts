import { describe, expect, it } from 'vitest'
import { cercaPercorso } from './ricerca'
import type { Percorso } from '../types'

const percorso = (titolo: string, descrizione: string, tappe: string[]): Percorso => ({
  id: titolo, titolo, descrizione, classe: 1, creato: 0, aggiornato: 0,
  tappe: tappe.map((t, i) => ({ id: String(i), titolo: t, sfondo: '#fff', elementi: [] })),
})

const nw = percorso('Carte mute: il Nord-Ovest', 'Valle d’Aosta, Piemonte, Liguria e Lombardia', ['Copertina', 'Carta muta fisica – Lombardia', 'Carta muta politica – Piemonte'])

describe('ricerca dei percorsi', () => {
  it('senza parole trova tutto', () => {
    expect(cercaPercorso(nw, '').ok).toBe(true)
    expect(cercaPercorso(nw, '   ').ok).toBe(true)
  })

  it('ignora maiuscole, accenti e apostrofi', () => {
    expect(cercaPercorso(nw, 'NORD-OVEST').ok).toBe(true)
    expect(cercaPercorso(percorso('Le città', '', []), 'citta').ok).toBe(true)
    expect(cercaPercorso(nw, "valle d'aosta").ok).toBe(true)
    expect(cercaPercorso(nw, 'valle d’aosta').ok).toBe(true)
  })

  it('servono tutte le parole, in qualunque ordine', () => {
    expect(cercaPercorso(nw, 'ovest nord').ok).toBe(true)
    expect(cercaPercorso(nw, 'nord sud').ok).toBe(false)
  })

  it('trova anche dai titoli delle tappe e dice quale', () => {
    const r = cercaPercorso(percorso('Carte mute: il Centro', 'Toscana, Umbria, Marche e Lazio', ['Copertina', 'Carta muta fisica – Umbria']), 'fisica umbria')
    expect(r).toEqual({ ok: true, tappa: 'Carta muta fisica – Umbria' })
    // se le parole stanno già nel titolo non serve indicare la tappa
    expect(cercaPercorso(nw, 'nord-ovest').tappa).toBeUndefined()
  })

  it('non trova ciò che non c’è', () => {
    expect(cercaPercorso(nw, 'vulcani').ok).toBe(false)
  })
})
