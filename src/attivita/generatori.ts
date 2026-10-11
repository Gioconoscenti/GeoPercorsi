import { geoArea, geoDistance } from 'd3-geo'
import { coordinate } from '../geo/Strumenti'
import { TOLLERANZA } from '../lib/fabbrica'
import type { Area, Attivita, MappaConfig, TipoMappa } from '../types'
import { caricaGeo, type GeoData, type GeoFeature } from '../geo/useGeo'
import { livelliFocus, livelliPredefiniti, NOMI_LIVELLI, SFONDO } from '../geo/aree'
import { mescola } from './correzione'

export type TipoGeneratore = 'trova' | 'etichette' | 'capitali' | 'abbina-capitali' | 'bandiere' | 'record' | 'ordina' | 'cosa' | 'dove' | 'confini'
  | 'coordinate-quiz' | 'coordinate-clic' | 'direzione' | 'distanza' | 'fusi' | 'flashcard'

export interface OpzioniGeneratore {
  area: Area
  tipo: TipoMappa
  livello: string
  quanti: number
  continente?: string
  /** solo dentro una regione / uno Stato */
  focus?: string
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
  return out
}

const maiuscola = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function opzioniQuiz(giusta: string, altre: string[], n = 4) {
  const distrattori = mescola([...new Set(altre.filter((x) => x !== giusta))]).slice(0, n - 1)
  const opzioni = mescola([giusta, ...distrattori])
  return { opzioni, corrette: [opzioni.indexOf(giusta)] }
}

function mappaGioco(o: OpzioniGeneratore): MappaConfig {
  const livelli = [...new Set([...livelliPredefiniti(o.area, o.tipo), o.livello, ...(o.focus ? livelliFocus(o.area, o.tipo, o.focus) : [])])]
  return { area: o.area, tipo: o.tipo, livelli, etichette: false, colori: {}, ...(o.focus ? { focus: o.focus } : {}) }
}

/** Elementi di gioco di un'attività (domande, luoghi, coppie…) */
const elementiDi = (a: Attivita): unknown[] => {
  switch (a.tipo) {
    case 'quiz': return a.domande
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
  const tutti = pool(geo, o.livello, o.continente, o.focus)
  const scelti = mescola(tutti).slice(0, o.quanti)
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
