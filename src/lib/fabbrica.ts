import { nuovoId } from './id'
import { CLASSI, STAGE_H, STAGE_W, type Area, type Attivita, type Classe, type Elemento, type MappaConfig, type Percorso, type Tappa, type TipoAttivita, type TipoElemento } from '../types'

export function nuovaTappa(titolo = 'Nuova tappa'): Tappa {
  return { id: nuovoId(), titolo, sfondo: '#ffffff', elementi: [] }
}

export function nuovoPercorso(classe: Classe): Percorso {
  const t = nuovaTappa('Copertina')
  t.sfondo = CLASSI[classe].chiaro
  t.elementi.push(nuovoElemento('testo', { x: 140, y: 250, w: 1000, h: 140, testo: 'Titolo del percorso', size: 64, grassetto: true, allinea: 'center', colore: CLASSI[classe].colore }))
  return { id: nuovoId(), titolo: 'Nuovo percorso', descrizione: '', classe, tappe: [t], creato: Date.now(), aggiornato: Date.now() }
}

export function nuovaMappa(area: Area, tipo: MappaConfig['tipo'] = 'politica'): MappaConfig {
  return { area, tipo, etichette: true, colori: {} }
}

/** Distanza massima (km) per considerare giusto un clic sulle coordinate */
export const TOLLERANZA: Record<Area, number> = { italia: 40, europa: 150, mondo: 600 }

export function nuovaAttivita(tipo: TipoAttivita, area: Area): Attivita {
  switch (tipo) {
    case 'quiz':
      return { tipo, titolo: 'Quiz', domande: [{ domanda: 'Scrivi la domanda', opzioni: ['Risposta giusta', 'Risposta sbagliata'], corrette: [0] }] }
    case 'vf':
      return { tipo, titolo: 'Vero o falso?', affermazioni: [{ testo: 'Scrivi un’affermazione', vera: true }] }
    case 'abbina':
      return { tipo, titolo: 'Abbina', coppie: [{ a: 'Elemento A', b: 'Elemento B' }, { a: 'Elemento C', b: 'Elemento D' }] }
    case 'completa':
      return { tipo, titolo: 'Completa il testo', testo: 'Il fiume più lungo d’Italia è il [Po], che sfocia nel mare [Adriatico].' }
    case 'trova':
      return { tipo, titolo: 'Trova sulla mappa', mappa: { ...nuovaMappa(area), etichette: false }, obiettivi: [] }
    case 'etichette':
      return { tipo, titolo: 'Metti i nomi sulla mappa', mappa: { ...nuovaMappa(area), etichette: false }, obiettivi: [] }
    case 'flashcard':
      return { tipo, titolo: 'Flashcard', carte: [{ fronte: 'Domanda', retro: 'Risposta' }] }
    case 'coordinate':
      return { tipo, titolo: 'Clicca le coordinate', mappa: { ...nuovaMappa(area), etichette: true, livelli: undefined }, punti: [], tolleranza: TOLLERANZA[area] }
    case 'grafico':
      return { tipo, titolo: 'Leggi il grafico', grafico: {
        forma: 'istogramma', titolo: 'Titolo del grafico',
        colonne: [{ nome: 'Valore', unita: '' }],
        righe: [{ etichetta: 'A', valori: [4] }, { etichetta: 'B', valori: [7] }, { etichetta: 'C', valori: [5] }],
      }, domande: [{ domanda: 'Quale barra è la più alta?', opzioni: ['A', 'B', 'C'], corrette: [1] }] }
    case 'ordina':
      return { tipo, titolo: 'Metti in ordine', consegna: 'Ordina dal più grande al più piccolo', elementi: ['Primo', 'Secondo', 'Terzo'] }
  }
}

const DIM: Record<TipoElemento, [number, number]> = {
  testo: [600, 120], immagine: [520, 360], video: [640, 360], audio: [420, 90], pdf: [520, 600], hotspot: [56, 56],
  pulsante: [240, 64], mappa: [760, 600], attivita: [760, 560],
}

type Extra = Partial<Elemento> & Record<string, unknown>

export function nuovoElemento(tipo: TipoElemento, extra: Extra = {}, area: Area = 'italia'): Elemento {
  const [w, h] = DIM[tipo]
  const base = { id: nuovoId(), x: Math.round((STAGE_W - w) / 2), y: Math.round((STAGE_H - h) / 2), w, h }
  let e: Elemento
  switch (tipo) {
    case 'testo': e = { ...base, tipo, testo: 'Scrivi qui…', size: 28, colore: '#0f172a', sfondo: 'transparent', grassetto: false, allinea: 'left' }; break
    case 'immagine': e = { ...base, tipo, adatta: 'contain' }; break
    case 'video': e = { ...base, tipo }; break
    case 'audio': e = { ...base, tipo, etichetta: 'Ascolta' }; break
    case 'pdf': e = { ...base, tipo }; break
    case 'hotspot': e = { ...base, tipo, titolo: 'Lo sapevi?', testo: 'Scrivi qui una curiosità.', colore: '#f59e0b', icona: 'ℹ️' }; break
    case 'pulsante': e = { ...base, tipo, etichetta: 'Vai avanti ➜', colore: '#4f46e5' }; break
    case 'mappa': e = { ...base, tipo, mappa: nuovaMappa(area), contenuti: {} }; break
    case 'attivita': e = { ...base, tipo, attivita: nuovaAttivita('quiz', area) }; break
  }
  return { ...e, ...extra } as Elemento
}

export const NOMI_ELEMENTI: Record<TipoElemento, string> = {
  testo: 'Testo', immagine: 'Immagine', video: 'Video', audio: 'Audio', pdf: 'PDF', hotspot: 'Punto informativo', pulsante: 'Pulsante', mappa: 'Mappa', attivita: 'Attività',
}

export const NOMI_ATTIVITA: Record<TipoAttivita, { nome: string; icona: string; descr: string }> = {
  quiz: { nome: 'Quiz a scelta multipla', icona: '❓', descr: 'Domande con più risposte' },
  vf: { nome: 'Vero o falso', icona: '✅', descr: 'Affermazioni da valutare' },
  abbina: { nome: 'Abbinamenti', icona: '🔗', descr: 'Collega le coppie' },
  completa: { nome: 'Completa il testo', icona: '✍️', descr: 'Parole mancanti tra [parentesi quadre]' },
  trova: { nome: 'Trova sulla mappa', icona: '📍', descr: 'Clicca il luogo richiesto' },
  etichette: { nome: 'Etichette sulla mappa', icona: '🏷️', descr: 'Metti i nomi al posto giusto' },
  flashcard: { nome: 'Flashcard', icona: '🃏', descr: 'Carte da girare per ripassare' },
  ordina: { nome: 'Metti in ordine', icona: '🔢', descr: 'Riordina gli elementi' },
  coordinate: { nome: 'Clicca le coordinate', icona: '🌐', descr: 'Trova il punto da latitudine e longitudine' },
  grafico: { nome: 'Leggi il grafico', icona: '📊', descr: 'Istogramma, torta, climogramma o tabella con domande' },
}

/** Clona un percorso cambiando tutti gli id */
export function clonaPercorso(p: Percorso): Percorso {
  const mappaTappe = new Map<string, string>()
  const tappe = p.tappe.map((t) => {
    const id = nuovoId()
    mappaTappe.set(t.id, id)
    return { ...structuredClone(t), id }
  })
  tappe.forEach((t) => t.elementi.forEach((e) => {
    e.id = nuovoId()
    if (e.tipo === 'pulsante' && e.vaiA) e.vaiA = mappaTappe.get(e.vaiA) ?? e.vaiA
  }))
  return { ...p, id: nuovoId(), titolo: p.titolo + ' (copia)', tappe, creato: Date.now(), aggiornato: Date.now() }
}
