import { useEffect, useMemo, useRef, useState } from 'react'
import type { Attivita } from '../types'
import { MapView } from '../geo/MapView'
import { useGeo, type GeoFeature } from '../geo/useGeo'
import { NOMI_LIVELLI, livelliPredefiniti } from '../geo/aree'
import { BottoneRiprova, BottoneVerifica, Cornice, Punteggio, type PropsAttivita } from './comuni'
import { correggiCoordinate, correggiEtichette, correggiTrova, mescola, type Risultato } from './correzione'
import { geoDistance } from 'd3-geo'
import { coordinate } from '../geo/Strumenti'

type Att<T extends Attivita['tipo']> = Extract<Attivita, { tipo: T }>

const VERDE = '#22c55e'
const ROSSO = '#ef4444'
const GIALLO = '#facc15'

function useObiettivi(att: Att<'trova'> | Att<'etichette'>) {
  const { data } = useGeo(att.mappa.area, att.mappa.tipo)
  return useMemo(() => {
    if (!data) return null
    const lista = att.obiettivi.map((id) => data.byId.get(id)).filter((f): f is GeoFeature => !!f)
    const livelli = new Set(lista.map((f) => f.properties.livello))
    // i livelli degli obiettivi devono essere visibili
    // le città distraggono: si mostrano solo se il gioco riguarda proprio le città
    const base = (att.mappa.livelli ?? livelliPredefiniti(att.mappa.area, att.mappa.tipo)).filter((l) => l !== 'citta' || livelli.has('citta'))
    const visibili = [...new Set([...base, ...livelli])]
    return { lista, livelli, mappa: { ...att.mappa, livelli: visibili, etichette: false } }
  }, [data, att.obiettivi, att.mappa])
}

// ---------------- Trova sulla mappa ----------------
export function Trova({ att, onRisultato, statico }: PropsAttivita<Att<'trova'>>) {
  const ob = useObiettivi(att)
  // si giocano solo i luoghi che esistono davvero nella carta (un id sparito bloccherebbe il gioco)
  const validi = useMemo(() => ob?.lista.map((f) => f.properties.id!) ?? [], [ob])
  const [mescolati, setOrdine] = useState<string[] | null>(null)
  const ordine = mescolati ?? validi
  const [i, setI] = useState(0)
  const [esiti, setEsiti] = useState<boolean[]>([])
  const [errori, setErrori] = useState(0)
  const [flash, setFlash] = useState<Record<string, string>>({})
  const [rivela, setRivela] = useState(false)
  const [ris, setRis] = useState<Risultato | null>(null)
  const timer = useRef<{ flash?: number; rivela?: number }>({})
  useEffect(() => () => { clearTimeout(timer.current.flash); clearTimeout(timer.current.rivela) }, [])
  // l'ordine si mescola quando arrivano i dati della carta
  useEffect(() => { if (validi.length) setOrdine(mescola(validi)) }, [validi])

  if (!ob) return <Cornice tipo="trova" titolo={att.titolo}><p className="text-slate-500">Caricamento…</p></Cornice>
  if (!ob.lista.length) return <Cornice tipo="trova" titolo={att.titolo}><p className="text-slate-500">Scegli i luoghi da trovare nel pannello delle proprietà.</p></Cornice>

  const corrente = ob.lista.find((f) => f.properties.id === ordine[i])
  const trovati = Object.fromEntries(ordine.slice(0, i).map((id, k) => [id, esiti[k] ? VERDE : GIALLO]))

  const prossimo = (esito: boolean) => {
    const e = [...esiti, esito]
    setEsiti(e)
    setErrori(0)
    setRivela(false)
    if (i + 1 >= ordine.length) {
      const r = correggiTrova(e, ordine.length)
      setRis(r)
      onRisultato?.(r)
    }
    setI(i + 1)
  }

  const click = (f: GeoFeature) => {
    if (statico || ris || !corrente || rivela) return
    const id = f.properties.id!
    if (id === corrente.properties.id) {
      setFlash({})
      prossimo(errori === 0)
    } else {
      setFlash({ [id]: ROSSO })
      clearTimeout(timer.current.flash)
      timer.current.flash = window.setTimeout(() => setFlash({}), 700)
      if (errori + 1 >= 2) {
        setRivela(true)
        timer.current.rivela = window.setTimeout(() => prossimo(false), 1800)
      }
      setErrori(errori + 1)
    }
  }

  const reset = () => { clearTimeout(timer.current.rivela); setOrdine(mescola(validi)); setI(0); setEsiti([]); setErrori(0); setRis(null); setRivela(false) }
  const tipoNome = corrente ? NOMI_LIVELLI[corrente.properties.livello] ?? '' : ''

  return (
    <Cornice tipo="trova" titolo={att.titolo} risultato={ris}
      piede={ris ? <><span className="font-bold">Fine! Trovati al primo colpo: {ris.punti} su {ris.max}</span><div className="ml-auto"><BottoneRiprova onClick={reset} /></div></> : (
        <>
          <span className="text-lg">Trova {tipoNome && <span className="text-slate-500">({tipoNome})</span>}:</span>
          <span className="text-2xl font-extrabold text-indigo-700">{corrente?.properties.nome}</span>
          {errori > 0 && !rivela && <span className="text-rose-600 font-semibold">Riprova!</span>}
          {rivela && <span className="text-amber-600 font-semibold">Eccolo, è quello in giallo</span>}
          <span className="ml-auto text-sm text-slate-500">{i + 1} / {ordine.length}</span>
        </>
      )}>
      <div className="w-full h-full -m-4" style={{ width: 'calc(100% + 2rem)', height: 'calc(100% + 2rem)' }}>
        <MapView config={ob.mappa} nascondiNomi={!ris} zoomAbilitato={!statico}
          selezionabile={(f) => ob.livelli.has(f.properties.livello)}
          evidenzia={{ ...trovati, ...flash, ...(rivela && corrente ? { [corrente.properties.id!]: GIALLO } : {}) }}
          etichetteFisse={Object.fromEntries(ordine.slice(0, i).map((id) => [id, { testo: ob.lista.find((f) => f.properties.id === id)?.properties.nome ?? '' }]))}
          onFeatureClick={click} />
      </div>
    </Cornice>
  )
}

// ---------------- Etichette sulla mappa ----------------
export function Etichette({ att, onRisultato, statico }: PropsAttivita<Att<'etichette'>>) {
  const ob = useObiettivi(att)
  // solo i luoghi che esistono davvero nella carta
  const validi = useMemo(() => ob?.lista.map((f) => f.properties.id!) ?? [], [ob])
  const etichette = useMemo(() => mescola(validi), [validi])
  const [posti, setPosti] = useState<Record<string, string>>({}) // area → etichetta
  const [sel, setSel] = useState<string | null>(null)
  const [ris, setRis] = useState<Risultato | null>(null)

  if (!ob) return <Cornice tipo="etichette" titolo={att.titolo}><p className="text-slate-500">Caricamento…</p></Cornice>
  if (!ob.lista.length) return <Cornice tipo="etichette" titolo={att.titolo}><p className="text-slate-500">Scegli i luoghi da etichettare nel pannello delle proprietà.</p></Cornice>

  const nome = (id: string) => ob.lista.find((f) => f.properties.id === id)?.properties.nome ?? id
  const usate = new Set(Object.values(posti))
  const obiettivi = new Set(validi)

  const click = (f: GeoFeature) => {
    if (statico || ris) return
    const id = f.properties.id!
    if (!obiettivi.has(id)) return
    if (sel) {
      const nuovi = Object.fromEntries(Object.entries(posti).filter(([, v]) => v !== sel))
      nuovi[id] = sel
      setPosti(nuovi)
      setSel(null)
    } else if (posti[id]) {
      const { [id]: _, ...resto } = posti
      setPosti(resto)
    }
  }
  const verifica = () => { const r = correggiEtichette(validi, posti); setRis(r); onRisultato?.(r) }
  const reset = () => { setPosti({}); setRis(null); setSel(null) }

  const colori: Record<string, string> = {}
  for (const id of validi) {
    if (ris) colori[id] = posti[id] === id ? VERDE : ROSSO
    else colori[id] = posti[id] ? '#a5b4fc' : sel ? '#fde68a' : '#e0e7ff'
  }

  return (
    <Cornice tipo="etichette" titolo={att.titolo} risultato={ris}
      sottotitolo={ris ? 'In rosso le etichette sbagliate: vicino trovi il nome giusto' : 'Tocca un nome, poi tocca il posto giusto sulla mappa'}
      piede={<div className="ml-auto flex gap-2">{ris ? <BottoneRiprova onClick={reset} /> : <BottoneVerifica onClick={verifica} disabled={statico || Object.keys(posti).length === 0} />}</div>}>
      <div className="@container h-full -m-4" style={{ height: 'calc(100% + 2rem)', width: 'calc(100% + 2rem)' }}>
      <div className="flex gap-3 h-full @max-lg:flex-col @max-lg:gap-0">
        <div className="flex-1 min-w-0 min-h-0">
          <MapView config={ob.mappa} nascondiNomi zoomAbilitato={!statico}
            selezionabile={(f) => obiettivi.has(f.properties.id!)}
            evidenzia={colori}
            etichetteFisse={Object.fromEntries(Object.entries(posti).map(([area, et]) => [area, {
              testo: ris && et !== area ? `${nome(et)} ✗ (${nome(area)})` : nome(et),
              colore: ris ? (et === area ? '#166534' : '#991b1b') : '#312e81',
            }]))}
            onFeatureClick={click} />
        </div>
        <div className="w-44 shrink-0 overflow-auto py-3 pr-3 flex flex-col gap-1.5 @max-lg:w-full @max-lg:flex-row @max-lg:py-2 @max-lg:px-2 @max-lg:border-t @max-lg:border-slate-200 @max-lg:[&>*]:shrink-0">
          {ris && <div className="mb-2"><Punteggio r={ris} /></div>}
          {etichette.map((id) => (
            <button key={id} disabled={usate.has(id) || !!ris} onClick={() => setSel(sel === id ? null : id)}
              className={'rounded-lg border-2 px-2 py-1.5 text-sm font-bold text-left transition ' +
                (usate.has(id) ? 'border-slate-200 text-slate-300 line-through' : sel === id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-indigo-200 bg-white text-indigo-900 hover:border-indigo-400')}>
              🏷️ {nome(id)}
            </button>
          ))}
        </div>
      </div>
      </div>
    </Cornice>
  )
}

// ---------------- Clicca le coordinate ----------------
export function Coordinate({ att, onRisultato, statico }: PropsAttivita<Att<'coordinate'>>) {
  const [i, setI] = useState(0)
  const [distanze, setDistanze] = useState<number[]>([])
  const [clic, setClic] = useState<[number, number] | null>(null)
  const [ris, setRis] = useState<Risultato | null>(null)
  const p = att.punti[i]

  if (!att.punti.length) return <Cornice tipo="coordinate" titolo={att.titolo}><p className="text-slate-500">Aggiungi i punti da trovare nel pannello delle proprietà.</p></Cornice>

  const click = (ll: [number, number]) => {
    if (statico || ris || clic || !p) return
    setClic(ll)
    setDistanze([...distanze, geoDistance([p.lon, p.lat], ll) * 6371])
  }
  const avanti = () => {
    setClic(null)
    if (i + 1 >= att.punti.length) {
      const r = correggiCoordinate(distanze, att.tolleranza, att.punti.length)
      setRis(r)
      onRisultato?.(r)
    }
    setI(i + 1)
  }
  const reset = () => { setI(0); setDistanze([]); setClic(null); setRis(null) }
  const d = clic ? distanze[distanze.length - 1] : null
  const giusto = d !== null && d <= att.tolleranza

  const segnaposti = ris
    ? att.punti.map((q, k) => ({ coord: [q.lon, q.lat] as [number, number], colore: distanze[k] <= att.tolleranza ? VERDE : ROSSO, testo: q.nome }))
    : clic && p
      ? [{ coord: clic, colore: giusto ? VERDE : ROSSO }, { coord: [p.lon, p.lat] as [number, number], colore: '#2563eb', testo: p.nome ?? coordinateTesto(p.lon, p.lat) }]
      : []

  return (
    <Cornice tipo="coordinate" titolo={att.titolo} risultato={ris}
      piede={ris ? <><span className="font-bold">Punti trovati: {ris.punti} su {ris.max} (entro {att.tolleranza} km)</span><div className="ml-auto"><BottoneRiprova onClick={reset} /></div></> : (
        <>
          <span className="text-lg">Clicca il punto:</span>
          <span className="text-2xl font-extrabold text-indigo-700 tabular-nums">{p && coordinateTesto(p.lon, p.lat)}</span>
          {d !== null && (
            <span className={'font-bold ' + (giusto ? 'text-emerald-700' : 'text-rose-700')}>
              {giusto ? '✅' : '❌'} sei a {Math.round(d).toLocaleString('it-IT')} km{p?.nome ? ` · è ${p.nome}` : ''}
            </span>
          )}
          <span className="ml-auto text-sm text-slate-500">{i + 1} / {att.punti.length}</span>
          {clic && <button className="btn-primario" onClick={avanti}>{i + 1 < att.punti.length ? 'Avanti ➜' : 'Risultato 🏁'}</button>}
        </>
      )}>
      <div className="w-full h-full -m-4" style={{ width: 'calc(100% + 2rem)', height: 'calc(100% + 2rem)' }}>
        <MapView config={att.mappa} strumenti zoomAbilitato={!statico} selezionabile={() => false} onMapClick={click} segnaposti={segnaposti} />
      </div>
    </Cornice>
  )
}

/** Coordinate in gradi interi (o con i minuti se servono) */
function coordinateTesto(lon: number, lat: number) {
  return coordinate(lon, lat, !Number.isInteger(lon) || !Number.isInteger(lat))
}
