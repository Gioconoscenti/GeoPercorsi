import { geoArea, geoDistance } from 'd3-geo'
import { coordinate } from '../geo/Strumenti'
import { TOLLERANZA } from '../lib/fabbrica'
import { conUnita } from '../lib/numeri'
import type { Area, Attivita, DatiGrafico, DomandaQuiz, FormaGrafico, MappaConfig, TipoMappa } from '../types'
import { caricaGeo, type GeoData, type GeoFeature } from '../geo/useGeo'
import { livelliFocus, livelliPredefiniti, NOMI_LIVELLI, SFONDO } from '../geo/aree'
import { mescola } from './correzione'

export type TipoGeneratore = 'trova' | 'etichette' | 'capitali' | 'abbina-capitali' | 'bandiere' | 'record' | 'ordina' | 'cosa' | 'dove' | 'confini'
  | 'coordinate-quiz' | 'coordinate-clic' | 'direzione' | 'distanza' | 'fusi' | 'flashcard' | 'grafico' | 'carta-muta'

export interface OpzioniGeneratore {
  area: Area
  tipo: TipoMappa
  livello: string
  quanti: number
  continente?: string
  /** solo dentro una regione / uno Stato */
  focus?: string
  /** solo questi elementi (per nome), nell'ordine dato */
  nomi?: string[]
  /** carta muta: i livelli da mescolare (se manca si scelgono in automatico) */
  livelli?: string[]
  /** grafico: come disegnarlo (se manca si sceglie in automatico) */
  forma?: FormaGrafico
}

export const GENERATORI: Record<TipoGeneratore, { nome: string; icona: string; descr: string }> = {
  trova: { nome: 'Trova sulla mappa', icona: '📍', descr: 'Clicca il luogo richiesto' },
  etichette: { nome: 'Etichette', icona: '🏷️', descr: 'Metti i nomi sulla mappa' },
  capitali: { nome: 'Quiz capitali / capoluoghi', icona: '🏛️', descr: 'Qual è la capitale?' },
  'abbina-capitali': { nome: 'Abbina le capitali', icona: '🔗', descr: 'Collega ogni luogo al capoluogo' },
  bandiere: { nome: 'Quiz bandiere', icona: '🚩', descr: 'Di chi è questa bandiera?' },
  record: { nome: 'Quiz dei record', icona: '🥇', descr: 'Il più alto, lungo, grande…' },
  ordina: { nome: 'Metti in ordine', icona: '🔢', descr: 'Dal più grande al più piccolo' },
  cosa: { nome: 'Che cos’è?', icona: '🤔', descr: 'Fiume, lago, vulcano…?' },
  dove: { nome: 'Dove si trova?', icona: '🧭', descr: 'In quale regione / Stato?' },
  confini: { nome: 'Chi confina con chi?', icona: '🤝', descr: 'Quali aree sono vicine' },
  'coordinate-quiz': { nome: 'Quiz sulle coordinate', icona: '🌐', descr: 'Latitudine e longitudine di un luogo' },
  'coordinate-clic': { nome: 'Clicca le coordinate', icona: '🎯', descr: 'Trova il punto sul reticolato' },
  direzione: { nome: 'Punti cardinali', icona: '🧭', descr: 'In che direzione si trova…?' },
  distanza: { nome: 'Distanze', icona: '📏', descr: 'Quanti km in linea d’aria?' },
  fusi: { nome: 'Fusi orari', icona: '🕐', descr: 'Che ore sono a…?' },
  flashcard: { nome: 'Flashcard di ripasso', icona: '🃏', descr: 'Nome e informazioni' },
  grafico: { nome: 'Leggi il grafico', icona: '📊', descr: 'Istogramma o barre con domande' },
  'carta-muta': { nome: 'Carta muta', icona: '🗺️', descr: 'Capoluoghi, fiumi e monti della zona da etichettare' },
}

/** Come si trasformano i valori di un livello in un grafico */
export interface TipoDatiGrafico {
  titolo: string
  colonna: string
  unita: string
  /** i valori delle carte si dividono per questo numero (es. abitanti → milioni) */
  div: number
  decimali: number
  /** si escludono gli elementi con un valore più piccolo (nei milioni sarebbe 0,0) */
  minimo?: number
  max: string
  min: string
  valore: (nome: string) => string
}
const GRAFICO_LIVELLI: Record<string, TipoDatiGrafico> = {
  vette: { titolo: 'Altezza delle vette', colonna: 'Altezza', unita: 'm', div: 1, decimali: 0, max: 'Quale vetta è la più alta?', min: 'Quale vetta è la più bassa?', valore: (n) => `Quanto è alta la vetta “${n}”?` },
  vulcani: { titolo: 'Altezza dei vulcani', colonna: 'Altezza', unita: 'm', div: 1, decimali: 0, max: 'Quale vulcano è il più alto?', min: 'Quale vulcano è il più basso?', valore: (n) => `Quanto è alto il vulcano “${n}”?` },
  fiumi: { titolo: 'Lunghezza dei fiumi', colonna: 'Lunghezza', unita: 'km', div: 1, decimali: 0, max: 'Quale fiume è il più lungo?', min: 'Quale fiume è il più corto?', valore: (n) => `Quanto è lungo il fiume “${n}”?` },
  laghi: { titolo: 'Superficie dei laghi', colonna: 'Superficie', unita: 'km²', div: 1, decimali: 0, minimo: 5, max: 'Quale lago è il più esteso?', min: 'Quale lago è il meno esteso?', valore: (n) => `Qual è la superficie del lago “${n}”?` },
  regioni: { titolo: 'Superficie delle regioni', colonna: 'Superficie', unita: 'km²', div: 1, decimali: 0, max: 'Quale regione è la più estesa?', min: 'Quale regione è la meno estesa?', valore: (n) => `Qual è la superficie della regione “${n}”?` },
  isole: { titolo: 'Superficie delle isole', colonna: 'Superficie', unita: 'km²', div: 1, decimali: 0, minimo: 5, max: 'Quale isola è la più estesa?', min: 'Quale isola è la meno estesa?', valore: (n) => `Qual è la superficie dell’isola “${n}”?` },
  pianure: { titolo: 'Superficie delle pianure', colonna: 'Superficie', unita: 'km²', div: 1, decimali: 0, max: 'Quale pianura è la più estesa?', min: 'Quale pianura è la meno estesa?', valore: (n) => `Qual è la superficie della pianura “${n}”?` },
  continenti: { titolo: 'Superficie dei continenti', colonna: 'Superficie', unita: 'milioni di km²', div: 1e6, decimali: 1, max: 'Quale continente è il più esteso?', min: 'Quale continente è il meno esteso?', valore: (n) => `Qual è la superficie di “${n}”?` },
  stati: { titolo: 'Abitanti degli Stati', colonna: 'Abitanti', unita: 'milioni', div: 1e6, decimali: 1, minimo: 5e5, max: 'Quale Stato è il più popoloso?', min: 'Quale Stato è il meno popoloso?', valore: (n) => `Quanti abitanti ha “${n}”?` },
  grandi_citta: { titolo: 'Abitanti delle città', colonna: 'Abitanti', unita: 'milioni', div: 1e6, decimali: 1, minimo: 5e5, max: 'Quale città è la più popolosa?', min: 'Quale città è la meno popolosa?', valore: (n) => `Quanti abitanti ha “${n}”?` },
}

/** Livelli mescolati in una carta muta, nell'ordine in cui si pescano */
const LIVELLI_MUTA: Record<string, string[]> = {
  'italia/politica': ['capoluoghi'],
  'italia/fisica': ['fiumi', 'laghi', 'vette', 'vulcani', 'isole', 'pianure'],
  'europa/politica': ['citta', 'grandi_citta', 'suddivisioni'],
  'europa/fisica': ['fiumi', 'laghi', 'vette', 'rilievi', 'isole', 'pianure'],
  'mondo/politica': ['stati'],
  'mondo/fisica': ['fiumi', 'laghi', 'rilievi', 'deserti', 'vette'],
}

/** Frasi per i confronti numerici, per livello */
const RECORD: Record<string, { domanda: string; ordina: string }> = {
  vette: { domanda: 'Quale di queste vette è la più alta?', ordina: 'Ordina le vette dalla più alta alla più bassa' },
  vulcani: { domanda: 'Quale di questi vulcani è il più alto?', ordina: 'Ordina i vulcani dal più alto al più basso' },
  fiumi: { domanda: 'Quale di questi fiumi è il più lungo?', ordina: 'Ordina i fiumi dal più lungo al più corto' },
  laghi: { domanda: 'Quale di questi laghi è il più grande?', ordina: 'Ordina i laghi dal più grande al più piccolo' },
  regioni: { domanda: 'Quale di queste regioni è la più grande?', ordina: 'Ordina le regioni dalla più grande alla più piccola' },
  stati: { domanda: 'Quale di questi Stati ha più abitanti?', ordina: 'Ordina gli Stati dal più popoloso al meno popoloso' },
  continenti: { domanda: 'Quale di questi continenti è il più grande?', ordina: 'Ordina i continenti dal più grande al più piccolo' },
  isole: { domanda: 'Quale di queste isole è la più grande?', ordina: 'Ordina le isole dalla più grande alla più piccola' },
  pianure: { domanda: 'Quale di queste pianure è la più grande?', ordina: 'Ordina le pianure dalla più grande alla più piccola' },
  grandi_citta: { domanda: 'Quale di queste città ha più abitanti?', ordina: 'Ordina le città dalla più popolosa alla meno popolosa' },
}

const PLURALI: Record<string, string> = {
  regioni: 'regioni', province: 'province', capoluoghi: 'capoluoghi di provincia', stati: 'Stati', suddivisioni: 'regioni interne', continenti: 'continenti',
  citta: 'città', grandi_citta: 'città', mari: 'mari', rilievi: 'montagne', vette: 'vette', vulcani: 'vulcani', pianure: 'pianure', altopiani: 'altopiani',
  deserti: 'deserti', fiumi: 'fiumi', laghi: 'laghi', isole: 'isole', penisole: 'penisole', coste: 'golfi e stretti', fasce: 'fasce climatiche', paralleli: 'paralleli',
}

const dentro = (f: GeoFeature, focus: string) => !!f.properties.in?.toString().split(',').includes(focus)

/** Elementi utilizzabili di un livello (eventualmente solo dentro una regione/uno Stato) */
export function pool(geo: GeoData, livello: string, continente?: string, focus?: string): GeoFeature[] {
  let lista = (geo.perLivello.get(livello) ?? []).filter((f) => f.properties.id && f.properties.nome)
  if (focus) lista = lista.filter((f) => dentro(f, focus))
  // gli elementi minori (fiumi, laghi, vette secondarie d'Europa) solo nei giochi su un singolo Stato
  else lista = lista.filter((f) => !f.properties.minore)
  if (continente && livello === 'stati') lista = lista.filter((f) => f.properties.cont === continente)
  if (continente && livello === 'citta') {
    const stati = new Set((geo.perLivello.get('stati') ?? []).filter((f) => f.properties.cont === continente).map((f) => f.properties.id!.replace('stato-', '')))
    lista = lista.filter((f) => stati.has(f.properties.id!.replace('capitale-', '')))
  }
  // nel mondo si escludono gli Stati minuscoli, difficili da cliccare
  if (geo.area === 'mondo' && livello === 'stati') lista = lista.filter((f) => geoArea(f) > 1.5e-4)
  // un nome deve comparire una sola volta
  const visti = new Set<string>()
  return lista.filter((f) => !visti.has(f.properties.nome!) && visti.add(f.properties.nome!))
}

/** Livelli con abbastanza elementi per un gioco */
export function livelliDisponibili(geo: GeoData, focus?: string) {
  return [...geo.perLivello.keys()].filter((l) => !SFONDO.has(l) && pool(geo, l, undefined, focus).length >= 3)
}

export function generatoriPossibili(geo: GeoData, livello: string, focus?: string): TipoGeneratore[] {
  const lista = pool(geo, livello, undefined, focus)
  const out: TipoGeneratore[] = ['trova', 'etichette']
  if (lista.some((f) => f.properties.cap)) out.push('capitali', 'abbina-capitali')
  if (lista.filter((f) => f.properties.flag).length >= 4) out.push('bandiere')
  if (RECORD[livello] && lista.filter((f) => typeof f.properties.val === 'number').length >= 4) out.push('record', 'ordina')
  if (geo.tipo === 'fisica') out.push('cosa')
  // "dove si trova": province e città in quale regione/Stato, fiumi e monti in quali aree
  if ((!focus || geo.tipo === 'fisica') && lista.filter((f) => f.properties.in).length >= 3) out.push('dove')
  if (!focus && lista.filter((f) => f.properties.vicini).length >= 3) out.push('confini')
  // strumenti del geografo: servono luoghi puntiformi (città, vette…)
  if (lista.filter((f) => f.geometry.type === 'Point').length >= 4) {
    out.push('coordinate-quiz', 'coordinate-clic', 'direzione', 'distanza')
    if (geo.area === 'mondo') out.push('fusi')
  }
  out.push('flashcard')
  if (eligibiliGrafico(lista, livello).length >= 4) out.push('grafico')
  if (focus && elementiMuta(geo, focus, undefined, 12).length >= 3) out.push('carta-muta')
  return out
}

const eligibiliGrafico = (lista: GeoFeature[], livello: string) => {
  const t = GRAFICO_LIVELLI[livello]
  return t ? lista.filter((f) => typeof f.properties.val === 'number' && f.properties.val >= (t.minimo ?? 0)) : []
}

/** I luoghi di una carta muta: si pesca a turno da ogni livello, dal più grande (altezza, lunghezza, superficie) al più piccolo */
export function elementiMuta(geo: GeoData, focus: string | undefined, livelli: string[] | undefined, quanti: number): GeoFeature[] {
  const nomi = livelli ?? LIVELLI_MUTA[`${geo.area}/${geo.tipo}`] ?? []
  const liste = nomi.map((l) => [...pool(geo, l, undefined, focus)].sort((a, b) => (b.properties.val ?? 0) - (a.properties.val ?? 0)))
  const out: GeoFeature[] = []
  const visti = new Set<string>()
  for (let i = 0; out.length < quanti; i++) {
    let preso = false
    for (const l of liste) {
      const f = l[i]
      if (!f) continue
      preso = true
      if (visti.has(f.properties.nome!)) continue
      visti.add(f.properties.nome!)
      out.push(f)
      if (out.length >= quanti) break
    }
    if (!preso) break
  }
  return out
}

const maiuscola = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function opzioniQuiz(giusta: string, altre: string[], n = 4) {
  const distrattori = mescola([...new Set(altre.filter((x) => x !== giusta))]).slice(0, n - 1)
  const opzioni = mescola([giusta, ...distrattori])
  return { opzioni, corrette: [opzioni.indexOf(giusta)] }
}

export function mappaGioco(o: Pick<OpzioniGeneratore, 'area' | 'tipo' | 'livello' | 'focus'>): MappaConfig {
  const livelli = [...new Set([...livelliPredefiniti(o.area, o.tipo), o.livello, ...(o.focus ? livelliFocus(o.area, o.tipo, o.focus) : [])])]
  return { area: o.area, tipo: o.tipo, livelli, etichette: false, colori: {}, ...(o.focus ? { focus: o.focus } : {}) }
}

/** Elementi di gioco di un'attività (domande, luoghi, coppie…) */
const elementiDi = (a: Attivita): unknown[] => {
  switch (a.tipo) {
    case 'quiz':
    case 'grafico': return a.domande
    case 'vf': return a.affermazioni
    case 'abbina': return a.coppie
    case 'completa': return [a.testo]
    case 'trova':
    case 'etichette': return a.obiettivi
    case 'flashcard': return a.carte
    case 'ordina': return a.elementi
    case 'coordinate': return a.punti
  }
}

export async function genera(gen: TipoGeneratore, o: OpzioniGeneratore): Promise<Attivita> {
  const a = await generaInterno(gen, o)
  if (!elementiDi(a).length) throw new Error('Con queste scelte non si riesce a creare nessuna domanda: prova un altro tipo di gioco o un’altra zona.')
  return a
}

async function generaInterno(gen: TipoGeneratore, o: OpzioniGeneratore): Promise<Attivita> {
  const geo = await caricaGeo(o.area, o.tipo)
  // regioni, Stati e continenti stanno sempre nella carta politica
  const pol = o.tipo === 'politica' ? geo : await caricaGeo(o.area, 'politica')
  const base = pool(geo, o.livello, o.continente, o.focus)
  // con "nomi" si usano solo quegli elementi, nell'ordine dato
  const tutti = o.nomi ? o.nomi.map((n) => base.find((f) => f.properties.nome === n)).filter((f): f is GeoFeature => !!f) : base
  const scelti = (o.nomi ? tutti : mescola(tutti)).slice(0, o.quanti)
  const nomeLiv = NOMI_LIVELLI[o.livello] ?? o.livello
  const plurale = PLURALI[o.livello] ?? o.livello
  const nomeFocus = o.focus ? pol.byId.get(o.focus)?.properties.nome : undefined
  const dove = nomeFocus ? ` – ${nomeFocus}` : ''
  const capLabel = o.area === 'italia' ? 'capoluogo' : 'capitale'
  const contenitore = o.area === 'italia' ? 'regione' : 'Stato'
  const nomeDi = (id: string) => pol.byId.get(id)?.properties.nome

  switch (gen) {
    case 'trova':
      return { tipo: 'trova', titolo: `Trova: ${plurale}${dove}`, mappa: mappaGioco(o), obiettivi: scelti.map((f) => f.properties.id!) }
    case 'etichette':
      return { tipo: 'etichette', titolo: `Dai il nome: ${plurale}${dove}`, mappa: mappaGioco(o), obiettivi: scelti.map((f) => f.properties.id!) }
    case 'capitali': {
      const conCap = mescola(tutti.filter((f) => f.properties.cap)).slice(0, o.quanti)
      // i distrattori vengono da tutta l'area, così anche nelle regioni piccole ci sono 4 risposte
      const caps = pool(geo, o.livello).map((f) => f.properties.cap).filter((c): c is string => !!c)
      const titolo = o.livello === 'province' ? 'i capoluoghi di provincia' : capLabel === 'capoluogo' ? 'i capoluoghi' : 'le capitali'
      return {
        tipo: 'quiz', titolo: `Quiz: ${titolo}${dove}`,
        domande: conCap.map((f) => ({ domanda: `${f.properties.nome}: qual è ${capLabel === 'capoluogo' ? 'il capoluogo' : 'la capitale'}?`, ...opzioniQuiz(f.properties.cap!, caps) })),
      }
    }
    case 'abbina-capitali': {
      const conCap = mescola(tutti.filter((f) => f.properties.cap && f.properties.cap !== f.properties.nome)).slice(0, Math.min(o.quanti, 8))
      return { tipo: 'abbina', titolo: `Abbina ogni ${nomeLiv} al suo ${capLabel}${dove}`, coppie: conCap.map((f) => ({ a: f.properties.nome!, b: f.properties.cap! })) }
    }
    case 'bandiere': {
      const conFlag = mescola(tutti.filter((f) => f.properties.flag)).slice(0, o.quanti)
      const nomi = tutti.map((f) => f.properties.nome!)
      return { tipo: 'quiz', titolo: 'Quiz: le bandiere', domande: conFlag.map((f) => ({ domanda: 'Di quale Stato è questa bandiera?', bandiera: f.properties.flag, ...opzioniQuiz(f.properties.nome!, nomi) })) }
    }
    case 'record': {
      const conVal = tutti.filter((f) => typeof f.properties.val === 'number')
      const domande = Array.from({ length: Math.min(o.quanti, 8) }, () => {
        const gruppo = mescola(conVal).slice(0, 4)
        const max = gruppo.reduce((a, b) => (b.properties.val! > a.properties.val! ? b : a))
        const opzioni = gruppo.map((f) => f.properties.nome!)
        return { domanda: RECORD[o.livello].domanda, opzioni, corrette: [opzioni.indexOf(max.properties.nome!)] }
      })
      return { tipo: 'quiz', titolo: `Quiz dei record: ${plurale}${dove}`, domande }
    }
    case 'ordina': {
      const gruppo = mescola(tutti.filter((f) => typeof f.properties.val === 'number')).slice(0, Math.min(o.quanti, 7))
      gruppo.sort((a, b) => b.properties.val! - a.properties.val!)
      return { tipo: 'ordina', titolo: `In ordine: ${plurale}${dove}`, consegna: RECORD[o.livello].ordina, elementi: gruppo.map((f) => f.properties.nome!) }
    }
    case 'cosa': {
      const tipi = [...new Set(geo.features.map((f) => f.properties.tipo).filter((t): t is string => !!t && !!t.trim()))]
      return {
        tipo: 'quiz', titolo: `Che cos’è?${dove}`,
        domande: scelti.map((f) => ({ domanda: `Che cos’è “${f.properties.nome}”?`, ...opzioniQuiz(maiuscola(f.properties.tipo ?? nomeLiv), tipi.map(maiuscola)) })),
      }
    }
    case 'dove': {
      // in che cosa si cerca: regioni (Italia), regioni d'Europa o continenti (per gli Stati), altrimenti Stati
      const cont = o.area === 'italia' ? { liv: 'regioni', una: 'regione', queste: 'queste regioni', attraversata: 'attraversata' }
        : o.livello === 'stati' && o.area === 'europa' ? { liv: 'macroregioni', una: 'regione d’Europa', queste: 'queste regioni d’Europa', attraversata: 'attraversata' }
          : o.livello === 'stati' ? { liv: 'continenti', una: 'continente', queste: 'questi continenti', attraversata: 'attraversato' }
            : { liv: 'stati', una: 'Stato', queste: 'questi Stati', attraversata: 'attraversato' }
      const tuttiCont = (pol.perLivello.get(cont.liv) ?? []).map((f) => f.properties.id!)
      const domande = []
      for (const f of mescola(tutti.filter((x) => x.properties.in))) {
        if (domande.length >= o.quanti) break
        const ids = f.properties.in!.toString().split(',').filter((id) => tuttiCont.includes(id))
        if (!ids.length) continue
        const giusta = nomeDi(mescola(ids)[0])
        if (!giusta) continue
        const altri = tuttiCont.filter((id) => !ids.includes(id)).map(nomeDi).filter((n): n is string => !!n)
        const domanda = ids.length === 1
          ? `In quale ${cont.una} si trova “${f.properties.nome}”?`
          : o.livello === 'fiumi'
            ? `Quale di ${cont.queste} è ${cont.attraversata} dal fiume ${f.properties.nome}?`
            : `In quale di ${cont.queste} si trova (almeno in parte) “${f.properties.nome}”?`
        domande.push({ domanda, ...opzioniQuiz(giusta, altri) })
      }
      return { tipo: 'quiz', titolo: `Dove si trova?${dove}`, domande }
    }
    case 'confini': {
      const stessi = pool(geo, o.livello)
      const domande = []
      for (const f of mescola(tutti.filter((x) => x.properties.vicini))) {
        if (domande.length >= o.quanti) break
        const vicini = f.properties.vicini!.toString().split(',').filter((id) => stessi.some((s) => s.properties.id === id))
        if (!vicini.length) continue
        const giusta = nomeDi(mescola(vicini)[0])!
        const altri = stessi.filter((s) => s.properties.id !== f.properties.id && !vicini.includes(s.properties.id!)).map((s) => s.properties.nome!)
        domande.push({ domanda: `Quale di ${o.livello === 'regioni' ? 'queste regioni' : 'questi Stati'} confina con ${f.properties.nome}?`, ...opzioniQuiz(giusta, altri) })
      }
      return { tipo: 'quiz', titolo: `Chi confina con chi? (${plurale})`, domande }
    }
    case 'coordinate-quiz':
    case 'coordinate-clic':
    case 'direzione':
    case 'distanza':
    case 'fusi':
      return strumenti(gen, o, tutti.filter((f) => f.geometry.type === 'Point'), dove)
    case 'grafico':
      return grafico(o, tutti, dove)
    case 'carta-muta': {
      const luoghi = elementiMuta(geo, o.focus, o.livelli, o.quanti)
      if (luoghi.length < 3) throw new Error('In questa zona ci sono troppo pochi luoghi per una carta muta.')
      const usati = [...new Set(luoghi.map((f) => f.properties.livello))]
      const livelli = [...new Set([...livelliPredefiniti(o.area, o.tipo), ...usati, ...(o.focus ? livelliFocus(o.area, o.tipo, o.focus) : [])])]
      return {
        tipo: 'etichette', titolo: `Carta muta ${o.tipo}${dove}`,
        mappa: { area: o.area, tipo: o.tipo, livelli, etichette: false, colori: {}, ...(o.focus ? { focus: o.focus } : {}) },
        obiettivi: luoghi.map((f) => f.properties.id!),
      }
    }
    case 'flashcard':
      return {
        tipo: 'flashcard', titolo: `Ripasso: ${plurale}${dove}`,
        carte: scelti.map((f) => {
          const info = Object.entries(f.properties).filter(([k]) => k.startsWith('i_')).map(([k, v]) => `${k.slice(2).replace(/_/g, ' ')}: ${v}`)
          return { fronte: f.properties.nome!, retro: [maiuscola(f.properties.tipo ?? nomeLiv), ...info, f.properties.desc ?? ''].filter(Boolean).join('\n') }
        }),
      }
  }
}

// ---------------- grafici ----------------
const SENZA_PARENTESI = (n: string) => n.replace(/\s*\(.*\)\s*$/, '')

function grafico(o: OpzioniGeneratore, tutti: GeoFeature[], dove: string): Attivita {
  const t = GRAFICO_LIVELLI[o.livello]
  if (!t) throw new Error('Per questo livello non si può creare un grafico: scegli altezze, lunghezze, superfici o abitanti.')
  const arrotonda = (v: number) => Math.round((v / t.div) * 10 ** t.decimali) / 10 ** t.decimali
  const adatti = (o.nomi ? tutti : mescola(tutti)).filter((f) => typeof f.properties.val === 'number' && f.properties.val >= (t.minimo ?? 0))
  // due barre con lo stesso valore renderebbero ambigue le domande sul più alto e sul più basso
  const visti = new Set<number>()
  const gruppo = adatti.filter((f) => !visti.has(arrotonda(f.properties.val as number)) && visti.add(arrotonda(f.properties.val as number))).slice(0, Math.max(3, Math.min(o.quanti, 8)))
  if (gruppo.length < 3) throw new Error('Non ci sono abbastanza elementi con un valore noto per fare un grafico.')
  const righe = gruppo.map((f) => ({ etichetta: SENZA_PARENTESI(f.properties.nome!), valori: [arrotonda(f.properties.val as number)] }))
  const forma = o.forma ?? (righe.length <= 6 && Math.max(...righe.map((r) => r.etichetta.length)) <= 10 ? 'istogramma' : 'barre')
  const dati: DatiGrafico = { forma, titolo: `${t.titolo}${dove}`, colonne: [{ nome: t.colonna, unita: t.unita }], righe }
  return { tipo: 'grafico', titolo: `Leggi il grafico: ${t.titolo.charAt(0).toLowerCase()}${t.titolo.slice(1)}${dove}`, grafico: dati, domande: domandeGrafico(dati, t) }
}

/** Domande sul grafico: il più grande, il più piccolo, un valore, una differenza, chi supera una soglia */
export function domandeGrafico(dati: DatiGrafico, frasi: Pick<TipoDatiGrafico, 'max' | 'min' | 'valore'>): DomandaQuiz[] {
  const u = dati.colonne[0]?.unita ?? ''
  const righe = dati.righe.map((r) => ({ nome: r.etichetta, v: r.valori[0] }))
  const ordinate = [...righe].sort((a, b) => b.v - a.v)
  const nomi = righe.map((r) => r.nome)
  const out: DomandaQuiz[] = []

  const chi = (domanda: string, giusta: string) => {
    const altri = mescola(nomi.filter((n) => n !== giusta)).slice(0, 3)
    const opzioni = mescola([giusta, ...altri])
    out.push({ domanda, opzioni, corrette: [opzioni.indexOf(giusta)] })
  }
  if (ordinate[0].v > ordinate[1].v) chi(frasi.max, ordinate[0].nome)
  if (ordinate.at(-1)!.v < ordinate.at(-2)!.v) chi(frasi.min, ordinate.at(-1)!.nome)

  // numeri vicini a quello giusto, senza ripetizioni e senza valori negativi o nulli
  const numeri = (giusto: number, altri: number[]) => {
    const dec = giusto >= 100 ? 0 : giusto >= 10 ? 1 : 2
    const arr = (x: number) => Math.round(x * 10 ** dec) / 10 ** dec
    const candidati = [0.5, 0.7, 0.85, 1.2, 1.5, 2, ...altri.map((x) => x / giusto)].map((k) => arr(giusto * k)).filter((x) => x > 0 && x !== giusto)
    return [...new Set(candidati)].map((x) => conUnita(x, u))
  }
  const x = mescola(righe)[0]
  out.push({ domanda: frasi.valore(x.nome), ...opzioniQuiz(conUnita(x.v, u), numeri(x.v, righe.map((r) => r.v))) })

  const [a, b] = ordinate.length > 3 ? [ordinate[0], ordinate[2]] : [ordinate[0], ordinate[1]]
  const diff = Math.round((a.v - b.v) * 100) / 100
  out.push({ domanda: `Qual è la differenza tra ${a.nome} e ${b.nome}?`, ...opzioniQuiz(conUnita(diff, u), numeri(diff, [])) })

  // soglia a metà tra due valori vicini alla mediana: almeno uno sopra e uno sotto
  if (righe.length >= 4) {
    const m = Math.floor(ordinate.length / 2)
    const grezza = (ordinate[m - 1].v + ordinate[m].v) / 2
    const dec = grezza >= 100 ? 0 : 1
    const soglia = Math.round(grezza * 10 ** dec) / 10 ** dec
    const sopra = ordinate.filter((r) => r.v > soglia).map((r) => r.nome)
    if (sopra.length && sopra.length < ordinate.length) {
      const opzioni = mescola(nomi).slice(0, 5)
      const corrette = opzioni.map((n, i) => (sopra.includes(n) ? i : -1)).filter((i) => i >= 0)
      if (corrette.length && corrette.length < opzioni.length) out.push({ domanda: `Quali di questi superano ${conUnita(soglia, u)}?`, opzioni, corrette })
    }
  }
  return out
}

// ---------------- strumenti del geografo ----------------
const xy = (f: GeoFeature) => (f.geometry as GeoJSON.Point).coordinates as [number, number]
const DIREZIONI = ['Nord', 'Nord-Est', 'Est', 'Sud-Est', 'Sud', 'Sud-Ovest', 'Ovest', 'Nord-Ovest']

/** Direzione (8 punti cardinali) per andare da a a b, come la si legge sulla carta */
export function direzione(a: [number, number], b: [number, number]) {
  const dx = (b[0] - a[0]) * Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180)
  const dy = b[1] - a[1]
  const angolo = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360
  return DIREZIONI[Math.round(angolo / 45) % 8]
}

const kmTra = (a: [number, number], b: [number, number]) => geoDistance(a, b) * 6371
const arrotondaKm = (km: number) => (km < 100 ? Math.round(km / 5) * 5 : km < 1000 ? Math.round(km / 10) * 10 : Math.round(km / 50) * 50)
/** Fuso orario teorico (spicchi di 15°) */
export const fusoTeorico = (lon: number) => Math.round(lon / 15)

function strumenti(gen: TipoGeneratore, o: OpzioniGeneratore, punti: GeoFeature[], dove: string): Attivita {
  const n = Math.min(o.quanti, 10)
  const scelti = mescola(punti).slice(0, n)
  const coppia = () => { const [a, b] = mescola(punti); return [a, b] as const }
  const passo = o.area === 'italia' || o.focus ? 1 : o.area === 'europa' ? 3 : 12
  switch (gen) {
    case 'coordinate-quiz':
      return {
        tipo: 'quiz', titolo: `Quiz sulle coordinate${dove}`,
        domande: scelti.map((f) => {
          const [lon, lat] = xy(f).map(Math.round) as [number, number]
          const giusta = coordinate(lon, lat, false)
          const altre = [1, 2, 3, -1, -2, -3].flatMap((k) => [coordinate(lon + k * passo, lat, false), coordinate(lon, lat + k * passo, false), coordinate(lon - k * passo, lat + k * passo, false)])
          return { domanda: `Quali sono le coordinate (arrotondate al grado) di ${f.properties.nome}?`, ...opzioniQuiz(giusta, altre) }
        }),
      }
    case 'coordinate-clic': {
      const r = o.area === 'italia' || o.focus ? 2 : 1
      const livelli = [...new Set([...livelliPredefiniti(o.area, 'politica'), ...(o.focus ? livelliFocus(o.area, 'politica', o.focus) : [])])]
        .filter((l) => !['citta', 'capoluoghi', 'grandi_citta'].includes(l))
      return {
        tipo: 'coordinate', titolo: `Clicca le coordinate${dove}`, tolleranza: TOLLERANZA[o.area],
        mappa: { area: o.area, tipo: 'politica', livelli: [...livelli, 'reticolato'], etichette: true, colori: {}, ...(o.focus ? { focus: o.focus } : {}) },
        punti: scelti.map((f) => { const [lon, lat] = xy(f); return { lon: Math.round(lon * r) / r, lat: Math.round(lat * r) / r, nome: f.properties.nome } }),
      }
    }
    case 'direzione':
      return {
        tipo: 'quiz', titolo: `Punti cardinali${dove}`,
        domande: Array.from({ length: n }, () => {
          const [a, b] = coppia()
          const giusta = direzione(xy(a), xy(b))
          const i = DIREZIONI.indexOf(giusta)
          // si escludono le direzioni vicine, per evitare risposte ambigue
          const lontane = DIREZIONI.filter((_, k) => Math.min((k - i + 8) % 8, (i - k + 8) % 8) >= 2)
          return { domanda: `Rispetto a ${a.properties.nome}, in quale direzione si trova ${b.properties.nome}?`, ...opzioniQuiz(giusta, lontane) }
        }),
      }
    case 'distanza':
      return {
        tipo: 'quiz', titolo: `Le distanze${dove}`,
        domande: Array.from({ length: n }, () => {
          const [a, b] = coppia()
          const km = Math.max(5, arrotondaKm(kmTra(xy(a), xy(b))))
          const fmtKm = (v: number) => `circa ${Math.max(5, arrotondaKm(v)).toLocaleString('it-IT')} km`
          return { domanda: `Quanti km ci sono in linea d’aria tra ${a.properties.nome} e ${b.properties.nome}?`, ...opzioniQuiz(fmtKm(km), [0.4, 0.6, 1.7, 2.5, 3.5].map((x) => fmtKm(km * x))) }
        }),
      }
    case 'fusi': {
      const roma = punti.find((f) => f.properties.nome === 'Roma')
      const rif = roma ?? scelti[0]
      const orario = (diff: number) => {
        const h = 12 + diff
        return `${String(((h % 24) + 24) % 24).padStart(2, '0')}:00${h >= 24 ? ' del giorno dopo' : h < 0 ? ' del giorno prima' : ''}`
      }
      return {
        tipo: 'quiz', titolo: 'I fusi orari',
        domande: scelti.filter((f) => f !== rif).slice(0, n).map((f) => {
          const diff = fusoTeorico(xy(f)[0]) - fusoTeorico(xy(rif)[0])
          return {
            domanda: `Secondo i fusi orari teorici, quando a ${rif.properties.nome} è mezzogiorno, che ore sono a ${f.properties.nome}?`,
            ...opzioniQuiz(orario(diff), [-6, -4, -3, -2, 2, 3, 4, 6].map((d) => orario(diff + d))),
          }
        }),
      }
    }
    default:
      throw new Error('generatore sconosciuto')
  }
}
