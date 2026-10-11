// Formato di scambio dei percorsi: un JSON semplice che un assistente (es. Claude) sa scrivere
// e che l'app trasforma in un percorso vero, controllando ogni passo.
import { mappaGioco } from '../attivita/generatori'
import { conFocus, livelliPredefiniti, SFONDO } from '../geo/aree'
import { caricaGeo, type GeoData, type GeoFeature } from '../geo/useGeo'
import { CLASSI, type Area, type Attivita, type Classe, type ContenutoArea, type DomandaQuiz, type Elemento, type Percorso, type Tappa, type TipoMappa } from '../types'
import { M, attivita, copertina, mappa, percorso, tappa, testo, titolo } from '../data/esempi'

export const FORMATO = 'geopercorsi-1'
export const MAX_TAPPE = 30

export interface Segnalazioni {
  /** problemi che impediscono di creare il percorso */
  errori: string[]
  /** cose sistemate o scartate in automatico */
  avvisi: string[]
}

export interface Conversione extends Segnalazioni {
  percorso?: Percorso
}

type Dati = Record<string, unknown>
const isObj = (x: unknown): x is Dati => !!x && typeof x === 'object' && !Array.isArray(x)
const str = (x: unknown) => (typeof x === 'string' ? x.trim() : typeof x === 'number' ? String(x) : '')

/** minuscole, senza accenti né apostrofi: per confrontare i nomi dei luoghi */
export const normalizza = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`‘]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

/** Toglie recinti ```json e testo attorno, e prova a leggere il primo oggetto JSON */
export function estraiJson(grezzo: string): { dati?: unknown; errore?: string } {
  let t = grezzo.trim()
  const recinto = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (recinto) t = recinto[1].trim()
  const inizio = t.indexOf('{')
  if (inizio < 0) return { errore: 'Non trovo nessun JSON: incolla tutta la risposta di Claude, dall’apertura { alla chiusura }.' }
  // chiusura corrispondente, ignorando le graffe dentro alle stringhe
  let prof = 0
  let inStr = false
  let fine = -1
  for (let i = inizio; i < t.length; i++) {
    const c = t[i]
    if (inStr) {
      if (c === '\\') i++
      else if (c === '"') inStr = false
    } else if (c === '"') inStr = true
    else if (c === '{') prof++
    else if (c === '}' && --prof === 0) { fine = i; break }
  }
  if (fine < 0) return { errore: 'Il JSON sembra interrotto (manca la graffa finale }). Chiedi a Claude di continuare o di riscrivere il percorso più corto.' }
  const corpo = t.slice(inizio, fine + 1)
  try {
    return { dati: JSON.parse(corpo) }
  } catch {
    try {
      return { dati: JSON.parse(corpo.replace(/,(\s*[}\]])/g, '$1')) }
    } catch (e) {
      return { errore: 'Il JSON non è valido: ' + (e as Error).message + '. Chiedi a Claude di correggerlo.' }
    }
  }
}

// ---------------- luoghi ----------------
const LIVELLI_CONTENITORE = ['regioni', 'stati', 'continenti', 'macroregioni', 'macroaree']

interface Carte {
  area: Area
  pol: GeoData
  fis: GeoData
}
const cacheCarte = new Map<Area, Promise<Carte>>()
const carte = (area: Area) => {
  if (!cacheCarte.has(area)) cacheCarte.set(area, Promise.all([caricaGeo(area, 'politica'), caricaGeo(area, 'fisica')]).then(([pol, fis]) => ({ area, pol, fis })))
  return cacheCarte.get(area)!
}

/** Trova un luogo per nome: prima nel livello indicato, poi in tutti i livelli cliccabili della carta */
function cerca(geo: GeoData, nome: string, livello?: string): GeoFeature | undefined {
  const n = normalizza(nome)
  if (!n) return undefined
  const uguali = (l: string) => (geo.perLivello.get(l) ?? []).filter((f) => f.properties.id && f.properties.nome && normalizza(f.properties.nome) === n)
  if (livello) {
    const f = uguali(livello)[0]
    if (f) return f
  }
  for (const l of geo.perLivello.keys()) {
    if (SFONDO.has(l) || l === 'contesto') continue
    const f = uguali(l)[0]
    if (f) return f
  }
  return undefined
}

/** Zoom su una regione, uno Stato o un continente (cercato per nome) */
function cercaZoom(c: Carte, nome: string): GeoFeature | undefined {
  const n = normalizza(nome)
  for (const l of LIVELLI_CONTENITORE) {
    const f = (c.pol.perLivello.get(l) ?? []).find((x) => x.properties.nome && normalizza(x.properties.nome) === n)
    if (f) return f
  }
  return undefined
}

const tipoCarta = (x: unknown): TipoMappa => (str(x) === 'fisica' ? 'fisica' : 'politica')
const leggiArea = (x: unknown, def: Area): Area => {
  const a = normalizza(str(x))
  return a === 'italia' || a === 'europa' || a === 'mondo' ? a : def
}

// ---------------- conversione ----------------
const SFONDI_GIOCO = (c: Classe) => CLASSI[c].chiaro

/** Trasforma il JSON in un percorso. Se ci sono errori il percorso non viene creato. */
export async function convertiPercorso(dati: unknown, classePredefinita: Classe = 1): Promise<Conversione> {
  const errori: string[] = []
  const avvisi: string[] = []
  if (!isObj(dati)) return { errori: ['Il JSON deve essere un oggetto con titolo e tappe.'], avvisi }
  const titoloP = str(dati.titolo)
  if (!titoloP) errori.push('Manca il “titolo” del percorso.')
  const classeN = Number(dati.classe)
  const classe: Classe = classeN === 1 || classeN === 2 || classeN === 3 ? classeN : classePredefinita
  if (dati.classe !== undefined && classe !== classeN) avvisi.push(`Classe “${String(dati.classe)}” non valida: uso la ${CLASSI[classe].nome}.`)
  if (!Array.isArray(dati.tappe) || !dati.tappe.length) return { errori: [...errori, 'Mancano le “tappe” (un elenco con almeno una tappa).'], avvisi }
  if (dati.tappe.length > MAX_TAPPE) errori.push(`Troppe tappe (${dati.tappe.length}): il massimo è ${MAX_TAPPE}.`)

  const colore = CLASSI[classe].colore
  const tappe: Tappa[] = [copertina(classe, titoloP || 'Percorso', str(dati.descrizione))]
  for (const [i, t] of dati.tappe.slice(0, MAX_TAPPE).entries()) {
    const etichetta = `Tappa ${i + 1}`
    if (!isObj(t)) { errori.push(`${etichetta}: non è un oggetto.`); continue }
    const r = await convertiTappa(t, classe, colore, etichetta, errori, avvisi)
    if (r) tappe.push(r)
  }
  if (errori.length) return { errori, avvisi }
  return { percorso: percorso(classe, titoloP, str(dati.descrizione), tappe), errori, avvisi }
}

async function convertiTappa(t: Dati, classe: Classe, colore: string, et: string, errori: string[], avvisi: string[]): Promise<Tappa | undefined> {
  const tipo = normalizza(str(t.tipo)).replace(/ /g, '')
  const tit = str(t.titolo)
  const nome = tit ? `${et} (“${tit}”)` : et
  const err = (m: string) => errori.push(`${nome}: ${m}`)
  const gioco = (a: Attivita, grande = false) => tappa(a.titolo, grande ? '#ffffff' : SFONDI_GIOCO(classe), [attivita(a, grande)])

  switch (tipo) {
    case 'lezione': {
      const corpo = str(t.testo)
      if (!tit) return err('manca il “titolo”.'), undefined
      if (!corpo) return err('manca il “testo”.'), undefined
      if (corpo.length > 1100) avvisi.push(`${nome}: testo molto lungo (${corpo.length} caratteri), potrebbe non starci nella pagina.`)
      return tappa(tit, '#ffffff', [titolo(tit, colore), testo(corpo, 60, 120, 1160, 560, { size: corpo.length > 700 ? 22 : 28 })])
    }
    case 'carta': return convertiCarta(t, colore, nome, err, avvisi)
    case 'quiz': {
      const domande = leggiDomande(t.domande, nome, errori, avvisi)
      if (!domande?.length) return err('servono delle “domande”.'), undefined
      return gioco({ tipo: 'quiz', titolo: tit || 'Quiz', domande })
    }
    case 'vf':
    case 'veroofalso': {
      const aff = Array.isArray(t.affermazioni) ? t.affermazioni : []
      const ok = aff.flatMap((a, k) => {
        if (!isObj(a) || !str(a.testo) || typeof a.vera !== 'boolean') { errori.push(`${nome}, affermazione ${k + 1}: servono “testo” e “vera” (true o false).`); return [] }
        return [{ testo: str(a.testo), vera: a.vera }]
      })
      if (!ok.length) return err('servono delle “affermazioni”.'), undefined
      return gioco({ tipo: 'vf', titolo: tit || 'Vero o falso?', affermazioni: ok })
    }
    case 'abbina': {
      const coppie = (Array.isArray(t.coppie) ? t.coppie : []).flatMap((c, k) => {
        if (!isObj(c) || !str(c.a) || !str(c.b)) { errori.push(`${nome}, coppia ${k + 1}: servono “a” e “b”.`); return [] }
        return [{ a: str(c.a), b: str(c.b) }]
      })
      if (coppie.length < 2) return err('servono almeno 2 “coppie”.'), undefined
      if (coppie.length > 8) avvisi.push(`${nome}: ${coppie.length} coppie, ne tengo solo 8.`)
      return gioco({ tipo: 'abbina', titolo: tit || 'Abbina', coppie: coppie.slice(0, 8) })
    }
    case 'completa': {
      const corpo = str(t.testo)
      if (!/\[[^\]]+\]/.test(corpo)) return err('il “testo” deve avere almeno una parola mancante tra [parentesi quadre].'), undefined
      return gioco({ tipo: 'completa', titolo: tit || 'Completa il testo', testo: corpo })
    }
    case 'ordina': {
      const el = (Array.isArray(t.elementi) ? t.elementi : []).map(str).filter(Boolean)
      if (el.length < 3) return err('servono almeno 3 “elementi”, scritti già nell’ordine giusto.'), undefined
      if (new Set(el).size !== el.length) return err('gli “elementi” devono essere tutti diversi.'), undefined
      return gioco({ tipo: 'ordina', titolo: tit || 'Metti in ordine', consegna: str(t.consegna) || 'Metti in ordine gli elementi', elementi: el })
    }
    case 'flashcard': {
      const cs = (Array.isArray(t.carte) ? t.carte : []).flatMap((c, k) => {
        if (!isObj(c) || !str(c.fronte) || !str(c.retro)) { errori.push(`${nome}, carta ${k + 1}: servono “fronte” e “retro”.`); return [] }
        return [{ fronte: str(c.fronte), retro: str(c.retro) }]
      })
      if (!cs.length) return err('servono delle “carte”.'), undefined
      return gioco({ tipo: 'flashcard', titolo: tit || 'Flashcard', carte: cs })
    }
    case 'trova':
    case 'etichette': return convertiGiocoCarta(tipo, t, classe, nome, err, avvisi)
    default:
      return err(`tipo “${str(t.tipo)}” sconosciuto. Tipi ammessi: lezione, carta, quiz, vf, abbina, completa, ordina, flashcard, trova, etichette.`), undefined
  }
}

function leggiDomande(x: unknown, nome: string, errori: string[], avvisi: string[]): DomandaQuiz[] | undefined {
  if (!Array.isArray(x)) return undefined
  const out: DomandaQuiz[] = []
  x.forEach((d, k) => {
    const e = `${nome}, domanda ${k + 1}`
    if (!isObj(d) || !str(d.domanda)) return void errori.push(`${e}: manca il testo “domanda”.`)
    const opzioni = (Array.isArray(d.opzioni) ? d.opzioni : []).map(str)
    if (opzioni.length < 2 || opzioni.length > 6 || opzioni.some((o) => !o)) return void errori.push(`${e}: servono da 2 a 6 “opzioni” non vuote.`)
    if (new Set(opzioni).size !== opzioni.length) return void errori.push(`${e}: le “opzioni” devono essere tutte diverse.`)
    // si accetta anche "corretta": 1
    const grezze = Array.isArray(d.corrette) ? d.corrette : d.corretta !== undefined ? [d.corretta] : []
    const corrette = grezze.map(Number)
    if (!corrette.length || corrette.some((n) => !Number.isInteger(n) || n < 0 || n >= opzioni.length)) {
      return void errori.push(`${e}: “corrette” deve elencare le posizioni delle risposte giuste, partendo da 0 (le opzioni sono ${opzioni.length}).`)
    }
    if (corrette.length === opzioni.length) avvisi.push(`${e}: tutte le opzioni sono corrette.`)
    out.push({ domanda: str(d.domanda), opzioni, corrette: [...new Set(corrette)].sort((a, b) => a - b) })
  })
  return out
}

/** Legge area, tipo di carta, livello e zoom di una tappa con una carta */
async function leggiCarta(t: Dati, def: Area, err: (m: string) => void) {
  const area = leggiArea(t.area, def)
  const tipo = tipoCarta(t.carta ?? t.mappa)
  const c = await carte(area)
  let focus: GeoFeature | undefined
  if (str(t.zoom)) {
    focus = cercaZoom(c, str(t.zoom))
    if (!focus) err(`zoom “${str(t.zoom)}” non trovato tra regioni, Stati e continenti di ${area}.`)
  }
  return { area, tipo, c, geo: tipo === 'fisica' ? c.fis : c.pol, focus }
}

const AREA_DEFAULT = (classe: Classe): Area => CLASSI[classe].area

async function convertiCarta(t: Dati, colore: string, nome: string, err: (m: string) => void, avvisi: string[]): Promise<Tappa | undefined> {
  const tit = str(t.titolo)
  if (!tit) return err('manca il “titolo”.'), undefined
  const antiErr = [] as string[]
  const { area, tipo, geo, focus } = await leggiCarta(t, 'italia', (m) => antiErr.push(m))
  antiErr.forEach(err)
  if (antiErr.length) return undefined
  let cfg = M(area, tipo)
  const extra = new Set<string>()
  // livelli richiesti a mano (nome di livello valido per questa carta)
  for (const l of Array.isArray(t.livelli) ? t.livelli.map(str) : []) {
    if (geo.perLivello.has(l)) extra.add(l)
    else avvisi.push(`${nome}: il livello “${l}” non esiste su questa carta, lo ignoro.`)
  }
  // schede: testo che appare cliccando un luogo
  const contenuti: Record<string, ContenutoArea> = {}
  if (isObj(t.schede)) {
    for (const [luogo, tx] of Object.entries(t.schede)) {
      const f = cerca(geo, luogo)
      if (!f || !str(tx)) { avvisi.push(`${nome}: scheda “${luogo}” non collegabile a un luogo della carta, la ignoro.`); continue }
      contenuti[f.properties.id!] = { testo: str(tx) }
      extra.add(f.properties.livello)
    }
  }
  cfg = { ...cfg, livelli: [...new Set([...livelliPredefiniti(area, tipo), ...extra])] }
  if (focus) cfg = conFocus(cfg, focus.properties.id)
  const nomeFocus = focus?.properties.nome
  const titoloTappa = nomeFocus && !tit.includes(nomeFocus) ? `${tit}: ${nomeFocus}` : tit
  const els: Elemento[] = [
    titolo(titoloTappa, colore),
    testo(str(t.testo) || 'Clicca sulla carta per esplorare.', 40, 120, 360, 560, { size: str(t.testo).length > 450 ? 18 : 22 }),
    mappa(cfg, 420, 110, 820, 590, contenuti),
  ]
  return tappa(titoloTappa, '#ffffff', els)
}

async function convertiGiocoCarta(tipo: 'trova' | 'etichette', t: Dati, classe: Classe, nome: string, err: (m: string) => void, avvisi: string[]): Promise<Tappa | undefined> {
  const antiErr = [] as string[]
  const { area, tipo: tipoMappa, geo, focus } = await leggiCarta(t, AREA_DEFAULT(classe), (m) => antiErr.push(m))
  antiErr.forEach(err)
  if (antiErr.length) return undefined
  const luoghi = (Array.isArray(t.luoghi) ? t.luoghi : []).map(str).filter(Boolean)
  if (luoghi.length < 2) return err('servono almeno 2 “luoghi”.'), undefined
  const livelloDato = str(t.livello)
  if (livelloDato && !geo.perLivello.has(livelloDato)) avvisi.push(`${nome}: livello “${livelloDato}” inesistente su questa carta, cerco i luoghi ovunque.`)
  const trovati: GeoFeature[] = []
  const mancanti: string[] = []
  for (const l of luoghi) {
    const f = cerca(geo, l, livelloDato)
    if (f && !trovati.includes(f)) trovati.push(f)
    else if (!f) mancanti.push(l)
  }
  if (mancanti.length) avvisi.push(`${nome}: luoghi non trovati sulla carta ${area}/${tipoMappa} e quindi scartati: ${mancanti.join(', ')}.`)
  if (trovati.length < 2) return err(`meno di 2 luoghi trovati sulla carta ${area}/${tipoMappa} (non trovati: ${mancanti.join(', ') || 'nessuno'}). Usa i nomi dell’elenco o cambia “area”/“carta”.`), undefined
  // livello che deve essere acceso: quello dei luoghi (se misti, quello del primo, gli altri restano nella carta di base)
  const livelli = [...new Set(trovati.map((f) => f.properties.livello))]
  const base = mappaGioco({ area, tipo: tipoMappa, livello: livelli[0], focus: focus?.properties.id })
  const cfg = { ...base, livelli: [...new Set([...(base.livelli ?? []), ...livelli])] }
  const nomeFocus = focus?.properties.nome
  const tit = str(t.titolo) || (tipo === 'trova' ? 'Trova sulla carta' : 'Dai il nome ai luoghi')
  return tappa(tit, '#ffffff', [attivita({ tipo, titolo: tit + (nomeFocus && !tit.includes(nomeFocus) ? ` – ${nomeFocus}` : ''), mappa: cfg, obiettivi: trovati.map((f) => f.properties.id!) }, true)])
}
