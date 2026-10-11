// Logica di correzione delle attività (funzioni pure, testate in correzione.test.ts)

export interface Risultato {
  punti: number
  max: number
}

export const normalizza = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

/** Quiz: una domanda è giusta se le risposte scelte coincidono esattamente con quelle corrette */
export function domandaGiusta(corrette: number[], scelte: number[]) {
  const a = new Set(corrette)
  const b = new Set(scelte)
  return a.size === b.size && [...a].every((x) => b.has(x))
}

export function correggiQuiz(domande: { corrette: number[] }[], risposte: number[][]): Risultato {
  return { punti: domande.filter((d, i) => domandaGiusta(d.corrette, risposte[i] ?? [])).length, max: domande.length }
}

export function correggiVF(affermazioni: { vera: boolean }[], risposte: (boolean | null)[]): Risultato {
  return { punti: affermazioni.filter((a, i) => risposte[i] === a.vera).length, max: affermazioni.length }
}

/** Abbinamenti: risposte[i] = indice della coppia scelta per l'elemento di sinistra i */
export function correggiAbbina(n: number, risposte: (number | null)[]): Risultato {
  let punti = 0
  for (let i = 0; i < n; i++) if (risposte[i] === i) punti++
  return { punti, max: n }
}

export type PezzoTesto = { tipo: 'testo'; testo: string } | { tipo: 'buco'; soluzioni: string[] }

/** "Il [Po|fiume Po] sfocia nell'[Adriatico]" → pezzi di testo e spazi da completare */
export function analizzaCompleta(testo: string): PezzoTesto[] {
  const out: PezzoTesto[] = []
  const re = /\[([^\]]+)\]/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(testo))) {
    if (m.index > last) out.push({ tipo: 'testo', testo: testo.slice(last, m.index) })
    out.push({ tipo: 'buco', soluzioni: m[1].split('|').map((s) => s.trim()).filter(Boolean) })
    last = m.index + m[0].length
  }
  if (last < testo.length) out.push({ tipo: 'testo', testo: testo.slice(last) })
  return out
}

export function bucoGiusto(soluzioni: string[], risposta: string) {
  const r = normalizza(risposta)
  return r.length > 0 && soluzioni.some((s) => normalizza(s) === r)
}

export function correggiCompleta(testo: string, risposte: string[]): Risultato {
  const buchi = analizzaCompleta(testo).filter((p): p is Extract<PezzoTesto, { tipo: 'buco' }> => p.tipo === 'buco')
  return { punti: buchi.filter((b, i) => bucoGiusto(b.soluzioni, risposte[i] ?? '')).length, max: buchi.length }
}

/** Ordina: un punto per ogni elemento nella posizione giusta */
export function correggiOrdina(corretto: string[], risposta: string[]): Risultato {
  return { punti: corretto.filter((x, i) => risposta[i] === x).length, max: corretto.length }
}

/** Etichette sulla mappa: posizionate[idArea] = idEtichetta */
export function correggiEtichette(obiettivi: string[], posizionate: Record<string, string>): Risultato {
  return { punti: obiettivi.filter((id) => posizionate[id] === id).length, max: obiettivi.length }
}

/** Coordinate: un punto per ogni clic abbastanza vicino al punto giusto */
export function correggiCoordinate(distanzeKm: number[], tolleranzaKm: number, totale: number): Risultato {
  return { punti: distanzeKm.filter((d) => d <= tolleranzaKm).length, max: totale }
}

/** Trova sulla mappa: un punto per ogni luogo trovato al primo tentativo */
export function correggiTrova(esiti: boolean[], totale: number): Risultato {
  return { punti: esiti.filter(Boolean).length, max: totale }
}

export function mescola<T>(arr: T[], seme = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(seme() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Mescola garantendo (se possibile) un ordine diverso da quello di partenza */
export function mescolaDiverso<T>(arr: T[]): T[] {
  if (arr.length < 2) return [...arr]
  for (let i = 0; i < 10; i++) {
    const m = mescola(arr)
    if (m.some((x, j) => x !== arr[j])) return m
  }
  return [...arr].reverse()
}

/** Punteggio massimo di un'attività (serve per contare anche quelle non svolte) */
export function puntiMassimi(a: import('../types').Attivita): number {
  switch (a.tipo) {
    case 'quiz': return a.domande.length
    case 'vf': return a.affermazioni.length
    case 'abbina': return a.coppie.length
    case 'completa': return analizzaCompleta(a.testo).filter((p) => p.tipo === 'buco').length
    case 'ordina': return a.elementi.length
    case 'trova':
    case 'etichette': return a.obiettivi.length
    case 'coordinate': return a.punti.length
    case 'flashcard': return 0
  }
}

/** Storia dei tentativi di un'attività: il primo conta per il voto, il migliore mostra il ripasso */
export interface Esito {
  primo: Risultato
  migliore: Risultato
  tentativi: number
}

export function registraTentativo(prec: Esito | undefined, r: Risultato): Esito {
  if (!prec) return { primo: r, migliore: r, tentativi: 1 }
  const meglio = r.max && (!prec.migliore.max || r.punti / r.max > prec.migliore.punti / prec.migliore.max)
  return { primo: prec.primo, migliore: meglio ? r : prec.migliore, tentativi: prec.tentativi + 1 }
}
