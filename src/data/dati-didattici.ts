// Dati per i grafici dei percorsi d'esempio che non vengono dalle carte (clima, terremoti).
// Sono valori medi arrotondati, adatti alla scuola: non vanno usati come dati scientifici.
import { domandeGrafico, opzioniQuiz } from '../attivita/generatori'
import { mescola } from '../attivita/correzione'
import { conUnita } from '../lib/numeri'
import type { Attivita, DatiGrafico, DomandaQuiz } from '../types'

export const MESI_BREVI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']

/** Medie mensili di precipitazioni (mm) e temperature (°C), da gennaio a dicembre */
export const CLIMI: Record<string, { precipitazioni: number[]; temperature: number[]; tipo: string }> = {
  Milano: {
    tipo: 'continentale',
    precipitazioni: [55, 56, 71, 83, 109, 80, 65, 89, 81, 108, 87, 56],
    temperature: [2.4, 4.4, 8.9, 13.3, 17.6, 21.7, 24.2, 23.4, 19.4, 13.7, 7.7, 3.5],
  },
  Roma: {
    tipo: 'mediterraneo',
    precipitazioni: [66, 73, 58, 70, 49, 37, 22, 31, 74, 109, 123, 81],
    temperature: [7.5, 8.4, 10.7, 13.5, 17.9, 21.8, 24.6, 24.5, 21, 16.7, 11.6, 8.3],
  },
  Palermo: {
    tipo: 'mediterraneo',
    precipitazioni: [71, 59, 52, 40, 20, 8, 3, 15, 41, 80, 80, 77],
    temperature: [11.3, 11.5, 13, 15.3, 18.9, 22.9, 25.9, 26.3, 23.4, 19.6, 15.8, 12.6],
  },
  Londra: {
    tipo: 'oceanico',
    precipitazioni: [55, 41, 42, 44, 49, 45, 45, 50, 49, 68, 59, 55],
    temperature: [5.2, 5.3, 7.6, 9.9, 13.3, 16.5, 18.7, 18.4, 15.6, 12, 8.1, 5.7],
  },
  Mosca: {
    tipo: 'continentale freddo',
    precipitazioni: [52, 41, 36, 37, 52, 80, 85, 80, 66, 63, 52, 53],
    temperature: [-6.5, -5.9, -0.8, 7.2, 13.7, 17.5, 19.7, 17.7, 11.9, 5.7, -0.4, -4.8],
  },
}

export function datiClimogramma(citta: string): DatiGrafico {
  const c = CLIMI[citta]
  return {
    forma: 'climogramma', titolo: `Clima di ${citta} (valori medi arrotondati)`,
    colonne: [{ nome: 'Precipitazioni', unita: 'mm' }, { nome: 'Temperatura', unita: '°C' }],
    righe: MESI_BREVI.map((m, i) => ({ etichetta: m, valori: [c.precipitazioni[i], c.temperature[i]] })),
  }
}

const SOMMA = (v: number[], mesi: number[]) => mesi.reduce((a, i) => a + v[i], 0)
const STAGIONI: [string, number[]][] = [['inverno', [11, 0, 1]], ['primavera', [2, 3, 4]], ['estate', [5, 6, 7]], ['autunno', [8, 9, 10]]]

/**
 * Domande su un climogramma, calcolate dai dati (le risposte non possono essere sbagliate).
 * Nel grafico non ci sono i numeri: le opzioni sono sempre abbastanza diverse tra loro da distinguerle a colpo d'occhio,
 * per esempio il mese più caldo si confronta solo con mesi nettamente più freschi.
 */
export function domandeClimogramma(citta: string): DomandaQuiz[] {
  const { precipitazioni: p, temperature: t } = CLIMI[citta]
  const argmax = (v: number[]) => v.indexOf(Math.max(...v))
  const argmin = (v: number[]) => v.indexOf(Math.min(...v))
  const out: DomandaQuiz[] = []

  /** Il mese giusto con tre mesi che hanno un valore lontano almeno "margine" (se non ce ne sono abbastanza, la domanda non si fa) */
  const mese = (domanda: string, v: number[], k: number, margine: number) => {
    const lontani = MESI.filter((_, i) => i !== k && Math.abs(v[k] - v[i]) >= margine)
    if (lontani.length < 3) return
    const opzioni = mescola([MESI[k], ...mescola(lontani).slice(0, 3)])
    out.push({ domanda, opzioni, corrette: [opzioni.indexOf(MESI[k])] })
  }
  mese(`Quale di questi mesi è il più caldo a ${citta}?`, t, argmax(t), 3)
  mese(`Quale di questi mesi è il più freddo a ${citta}?`, t, argmin(t), 3)
  mese(`Quale di questi mesi è il più piovoso a ${citta}?`, p, argmax(p), 15)

  // temperature e differenze arrotondate al grado, con scelte lontane tra loro
  const k = mescola([...MESI.keys()])[0]
  const gradi = (x: number) => conUnita(Math.round(x), '°C')
  out.push({ domanda: `Quanti gradi ha circa la temperatura media di ${MESI[k]} a ${citta}?`, ...opzioniQuiz(gradi(t[k]), [-8, -5, 5, 8, 12].map((d) => gradi(t[k] + d))) })

  const escursione = Math.max(...t) - Math.min(...t)
  out.push({
    domanda: `Qual è circa l’escursione termica annua di ${citta} (differenza tra il mese più caldo e il più freddo)?`,
    ...opzioniQuiz(gradi(escursione), [-9, -5, 5, 9].map((d) => gradi(Math.max(2, escursione + d)))),
  })

  const piogge = STAGIONI.map(([n, m]) => ({ n, mm: SOMMA(p, m) })).sort((x, y) => x.mm - y.mm)
  if (piogge[1].mm - piogge[0].mm >= 30) {
    out.push({ domanda: `In quale stagione piove meno a ${citta}?`, ...opzioniQuiz(piogge[0].n, STAGIONI.map(([n]) => n)) })
  }
  return out
}

/** Terremoti italiani del Novecento e del nuovo millennio (magnitudo momento, arrotondata) */
export const TERREMOTI: DatiGrafico = {
  forma: 'barre', titolo: 'Alcuni grandi terremoti italiani (valori arrotondati)',
  colonne: [{ nome: 'Magnitudo', unita: '' }],
  righe: [
    { etichetta: 'Messina 1908', valori: [7.1] },
    { etichetta: 'Irpinia 1980', valori: [6.9] },
    { etichetta: 'Friuli 1976', valori: [6.5] },
    { etichetta: 'L’Aquila 2009', valori: [6.1] },
    { etichetta: 'Amatrice 2016', valori: [6] },
  ],
}

export function grafico(titolo: string, dati: DatiGrafico, domande: DomandaQuiz[]): Attivita {
  return { tipo: 'grafico', titolo, grafico: dati, domande }
}

export const domandeTerremoti = (): DomandaQuiz[] =>
  domandeGrafico(TERREMOTI, {
    max: 'Quale di questi terremoti ha avuto la magnitudo più alta?',
    min: 'Quale di questi terremoti ha avuto la magnitudo più bassa?',
    valore: (n) => `Che magnitudo ha avuto il terremoto di ${n}?`,
  })
