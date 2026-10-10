import { Fragment, memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { geoArea, geoBounds, geoPath, type GeoPath, type GeoProjection } from 'd3-geo'
import { createPortal } from 'react-dom'
import { select } from 'd3-selection'
import 'd3-transition'
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom'
import type { ContenutoArea, MappaConfig } from '../types'
import { LIVELLI, ORDINE, PALETTE_POLITICA, SFONDO, SIMBOLI, STILE_ETICHETTA, livelliPredefiniti, proiezione, stile } from './aree'
import { infoRighe, useGeo, type GeoData, type GeoFeature } from './useGeo'
import { getRuntime, useAssetUrl } from '../lib/runtime'
import { GradiBordo, Reticolato, RosaDeiVenti, Scala, coordinate, passoReticolato } from './Strumenti'

export interface MapViewProps {
  config: MappaConfig
  onConfigChange?: (c: MappaConfig) => void
  /** mostra i controlli (Politica/Fisica, livelli, nomi) */
  controlli?: boolean
  /** permette di cambiare Politica/Fisica dai controlli */
  cambioTipo?: boolean
  onFeatureClick?: (f: GeoFeature) => void
  /** quali elementi rispondono a click/hover (predefinito: tutti quelli non di sfondo) */
  selezionabile?: (f: GeoFeature) => boolean
  /** colori che hanno la precedenza su tutto (giochi, selezioni) */
  evidenzia?: Record<string, string>
  /** nasconde nomi, etichette e suggerimenti (per i giochi) */
  nascondiNomi?: boolean
  /** etichette mostrate comunque, per id */
  etichetteFisse?: Record<string, { testo: string; colore?: string }>
  /** apre la scheda informativa al click */
  scheda?: boolean
  contenuti?: Record<string, ContenutoArea>
  zoomAbilitato?: boolean
  overlay?: ReactNode
  className?: string
  /** clic su un punto qualsiasi della carta (longitudine, latitudine) */
  onMapClick?: (lonlat: [number, number]) => void
  /** segnaposti da disegnare (es. nel gioco delle coordinate) */
  segnaposti?: { coord: [number, number]; colore: string; testo?: string }[]
  /** mostra sempre reticolato, scala e rosa dei venti */
  strumenti?: boolean
}

interface Disegno {
  f: GeoFeature
  d?: string
  p?: [number, number]
  label?: [number, number]
  larghezza: number
  linea: boolean
}

function puntoEtichetta(f: GeoFeature, path: GeoPath, proj: GeoProjection): [number, number] | undefined {
  const g = f.geometry
  // i fusi orari si etichettano in alto, al centro dello spicchio
  if (f.properties.livello === 'fusi') return proj([Math.max(-172, Math.min(172, (f.properties.val ?? 0) * 15)), 62]) ?? undefined
  if (g.type === 'Point') return proj(g.coordinates as [number, number]) ?? undefined
  if (g.type === 'LineString' || g.type === 'MultiLineString') {
    const lines = g.type === 'LineString' ? [g.coordinates] : g.coordinates
    const longest = lines.reduce((a, b) => (b.length > a.length ? b : a), lines[0])
    return proj(longest[Math.floor(longest.length / 2)] as [number, number]) ?? undefined
  }
  if (g.type === 'MultiPolygon') {
    let best = g.coordinates[0]
    let max = -1
    for (const poly of g.coordinates) {
      const a = geoArea({ type: 'Polygon', coordinates: poly })
      if (a > max) { max = a; best = poly }
    }
    const c = path.centroid({ type: 'Polygon', coordinates: best })
    return isNaN(c[0]) ? undefined : c
  }
  const c = path.centroid(f)
  return isNaN(c[0]) ? undefined : c
}

export function MapView(props: MapViewProps) {
  const { config } = props
  const { data, errore } = useGeo(config.area, config.tipo)
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      if (width > 10 && height > 10) setSize({ w: Math.round(width), h: Math.round(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={box} className={'relative overflow-hidden select-none ' + (props.className ?? 'w-full h-full')} style={{ background: config.tipo === 'fisica' ? '#9fd0f2' : '#cfe8f7' }}>
      {errore && <div className="absolute inset-0 grid place-items-center text-red-700 text-sm p-4">{errore}</div>}
      {!data && !errore && <div className="absolute inset-0 grid place-items-center text-slate-500 text-sm">Caricamento mappa…</div>}
      {data && size && <MappaInterna {...props} data={data} w={size.w} h={size.h} />}
    </div>
  )
}

function MappaInterna(props: MapViewProps & { data: GeoData; w: number; h: number }) {
  const { data, w, h, config, nascondiNomi } = props
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [t, setT] = useState<ZoomTransform>(zoomIdentity)
  const [hover, setHover] = useState<{ f: GeoFeature; x: number; y: number } | null>(null)
  const [aperta, setAperta] = useState<GeoFeature | null>(null)
  const [cursore, setCursore] = useState<[number, number] | null>(null)
  const zoomOn = props.zoomAbilitato !== false

  const livelli = useMemo(() => new Set([...(config.livelli ?? livelliPredefiniti(config.area, config.tipo)), ...SFONDO]), [config.livelli, config.area, config.tipo])
  // "confini" è uno sfondo ma si può spegnere
  const confiniVisibili = (config.livelli ?? livelliPredefiniti(config.area, config.tipo)).includes('confini') || !LIVELLI[config.tipo][config.area].some((l) => l.id === 'confini')

  // zoom su una regione / uno Stato
  const focus = config.focus
  const focusFeature = useMemo(() => (focus ? data.byId.get(focus) ?? data.features.find((f) => f.properties.ref === focus) : undefined), [data, focus])
  const inFocus = (f: GeoFeature) => !focus || f.properties.id === focus || f.properties.ref === focus || !!f.properties.in?.toString().split(',').includes(focus)
  /** elemento interattivo fuori dalla regione/Stato scelto */
  const fuori = (f: GeoFeature) => !!focus && !!f.properties.id && !inFocus(f)

  const { disegni, path, proj } = useMemo(() => {
    const { proj, fit } = proiezione(config.area)
    if (focusFeature) proj.fitExtent([[30, 30], [w - 30, h - 30]], focusFeature as never)
    else proj.fitExtent([[6, 6], [w - 6, h - 6]], fit as never)
    // ritaglia tutto ciò che sta fuori dall'inquadratura: con lo zoom su una regione i mari e gli Stati vicini
    // diventerebbero enormi e rallenterebbero moltissimo il disegno
    proj.clipExtent([[-20, -20], [w + 20, h + 20]])
    const path = geoPath(proj).digits(1)
    const out: Disegno[] = []
    for (const f of data.features) {
      const g = f.geometry
      const linea = g.type === 'LineString' || g.type === 'MultiLineString'
      if (g.type === 'Point') {
        const p = proj(g.coordinates as [number, number])
        if (p) out.push({ f, p, label: p, larghezza: 0, linea })
      } else {
        const d = path(f) ?? undefined
        const b = path.bounds(f)
        out.push({ f, d, label: SFONDO.has(f.properties.livello) ? undefined : puntoEtichetta(f, path, proj), larghezza: b[1][0] - b[0][0], linea })
      }
    }
    const rank = (l: string) => { const i = ORDINE.indexOf(l); return i < 0 ? 99 : i }
    out.sort((a, b) => rank(a.f.properties.livello) - rank(b.f.properties.livello))
    return { disegni: out, path, proj }
  }, [data, w, h, config.area, focusFeature])

  // strumenti del geografo
  const strumenti = props.strumenti || livelli.has('reticolato')
  const ampiezzaBase = useMemo(() => {
    if (focusFeature) {
      const [[x0, y0], [x1, y1]] = geoBounds(focusFeature)
      // l'inquadratura è più larga della regione/dello Stato
      return Math.max(x1 - x0, y1 - y0) * 1.6
    }
    return { italia: 30, europa: 80, mondo: 240 }[config.area]
  }, [focusFeature, config.area])
  const daSchermo = (e: React.MouseEvent): [number, number] | null => {
    const r = svgRef.current?.getBoundingClientRect()
    if (!r) return null
    // la carta può essere rimpicciolita (palco scalato): si riporta il punto alle dimensioni della carta
    const sx = ((e.clientX - r.left) / r.width) * w
    const sy = ((e.clientY - r.top) / r.height) * h
    const ll = proj.invert?.(t.invert([sx, sy]) as [number, number])
    return ll && isFinite(ll[0]) && isFinite(ll[1]) ? (ll as [number, number]) : null
  }

  // zoom e trascinamento
  useEffect(() => {
    const svg = svgRef.current
    if (!svg || !zoomOn) return
    const z = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 16])
      .translateExtent([[0, 0], [w, h]])
      .extent([[0, 0], [w, h]])
      .on('zoom', (e) => setT(e.transform))
    zoomRef.current = z
    select(svg).call(z).on('dblclick.zoom', null)
    return () => {
      select(svg).on('.zoom', null)
    }
  }, [w, h, zoomOn])

  const zoomBy = (k: number) => svgRef.current && zoomRef.current && select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy as never, k)
  const zoomReset = () => svgRef.current && zoomRef.current && select(svgRef.current).transition().duration(250).call(zoomRef.current.transform as never, zoomIdentity)

  const visibile = (f: GeoFeature) => {
    const p = f.properties
    const l = p.livello
    // i contorni dei gruppi (regioni d'Europa, continenti…) servono solo per lo zoom
    if (l === 'confini') return p.gruppo ? p.ref === focus : confiniVisibili || p.ref === focus
    if (!livelli.has(l)) return false
    // gli elementi minori compaiono solo da vicino
    if (p.minore && !(focus && inFocus(f)) && t.k < 2.5) return false
    // capoluoghi di provincia che sono anche capoluoghi di regione: non disegnarli due volte
    if (p.dup && livelli.has('citta')) return false
    // fuori dalla zona scelta i punti si nascondono
    if (f.geometry.type === 'Point' && fuori(f)) return false
    return true
  }
  const cliccabile = (f: GeoFeature) => !SFONDO.has(f.properties.livello) && !!f.properties.id && !fuori(f) && (props.selezionabile ? props.selezionabile(f) : true)

  const colore = (f: GeoFeature): string | undefined => {
    const id = f.properties.id
    if (!id) return
    return props.evidenzia?.[id] ?? config.colori?.[id]
  }

  const onClick = (f: GeoFeature) => {
    if (!cliccabile(f)) return
    props.onFeatureClick?.(f)
    if (props.scheda) setAperta(f)
  }

  const k = t.k
  const hoverId = hover?.f.properties.id

  return (
    <>
      <svg
        ref={svgRef}
        width={w}
        height={h}
        className="block touch-none"
        style={{ cursor: props.onMapClick ? 'crosshair' : zoomOn ? 'grab' : 'default' }}
        onMouseLeave={() => { setHover(null); setCursore(null) }}
        onMouseMove={strumenti ? (e) => setCursore(daSchermo(e)) : undefined}
        onClick={props.onMapClick ? (e) => { const ll = daSchermo(e); if (ll) props.onMapClick!(ll) } : undefined}
      >
        <g transform={t.toString()}>
          <Forme disegni={disegni} visibile={visibile} tipo={config.tipo} colore={colore} cliccabile={cliccabile} hoverId={hoverId} fuori={fuori} focus={focus}
            onHover={(f, e) => setHover(f ? { f, x: e!.clientX, y: e!.clientY } : null)} onClick={onClick}
            statiTrasparenti={livelli.has('macroregioni') || livelli.has('macroaree')} />
          {strumenti && <Reticolato path={path} passo={passoReticolato(ampiezzaBase / t.k)} />}
          {/* punti */}
          {disegni.filter((d) => d.p && visibile(d.f)).map((d, i) => {
            const s = SIMBOLI[d.f.properties.livello] ?? SIMBOLI.citta
            const c = colore(d.f)
            const isCap = d.f.properties.tipo === 'capitale' || d.f.properties.tipo?.startsWith('capoluogo')
            return (
              <g key={'p' + i} transform={`translate(${d.p![0]},${d.p![1]}) scale(${1 / Math.sqrt(k)})`}
                className={cliccabile(d.f) ? 'cursor-pointer' : ''}
                onClick={() => onClick(d.f)}
                onMouseMove={(e) => cliccabile(d.f) && setHover({ f: d.f, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setHover(null)}>
                <circle r={12} fill="transparent" />
                <path d={isCap && d.f.properties.livello === 'citta' ? 'M-4,-4H4V4H-4Z' : s.path} fill={c ?? s.fill} stroke={s.stroke} strokeWidth={1.5}
                  transform={hoverId && hoverId === d.f.properties.id ? 'scale(1.5)' : undefined} />
              </g>
            )
          })}
          {/* etichette */}
          {(config.etichette && !nascondiNomi) && disegni.filter((d) => d.label && visibile(d.f) && d.f.properties.nome && d.f.properties.id && !fuori(d.f)).map((d, i) => {
            const l = d.f.properties.livello
            const st = STILE_ETICHETTA[l] ?? { size: 10, color: '#111' }
            const v = d.f.properties.val ?? 0
            const nome = l === 'fusi' ? (v > 0 ? '+' + v : v < 0 ? '−' + -v : '0') : d.f.properties.nome!
            if (!d.p && !d.linea && d.larghezza * k < nome.length * st.size * 0.42 && l !== 'mari' && l !== 'fasce') return null
            if (l === 'citta' && config.area === 'mondo' && k < 2.5 && !focus) return null
            if ((l === 'province' || l === 'suddivisioni' || l === 'capoluoghi' || l === 'grandi_citta') && k < 2 && !focus) return null
            // se si vedono i capoluoghi di provincia, il loro nome basta (evita “Pisa” scritto due volte)
            if (l === 'province' && livelli.has('capoluoghi')) return null
            // con lo zoom i nomi sono un po' più grandi
            const stF = focus ? { ...st, size: st.size * 1.25 } : st
            return <Etichetta key={'l' + i} x={d.label![0]} y={d.label![1]} k={k} testo={nome} st={stF} punto={!!d.p} />
          })}
          {props.etichetteFisse && disegni.filter((d) => d.label && d.f.properties.id && props.etichetteFisse![d.f.properties.id]).map((d, i) => {
            const e = props.etichetteFisse![d.f.properties.id!]
            return <Etichetta key={'f' + i} x={d.label![0]} y={d.label![1]} k={k} testo={e.testo} st={{ size: 12, color: e.colore ?? '#111', weight: 700 }} punto={!!d.p} box />
          })}
          {props.segnaposti?.map((sp, i) => {
            const p = proj(sp.coord)
            if (!p) return null
            return (
              <g key={'sp' + i} transform={`translate(${p[0]},${p[1]}) scale(${1 / k})`} style={{ pointerEvents: 'none' }}>
                <path d="M0,0 C-6,-10 -10,-14 -10,-20 a10,10 0 1,1 20,0 C10,-14 6,-10 0,0 Z" fill={sp.colore} stroke="#fff" strokeWidth={2} />
                <circle cy={-20} r={4} fill="#fff" />
                {sp.testo && <text x={14} y={-16} fontSize={13} fontWeight={800} fill="#111" paintOrder="stroke" stroke="#fff" strokeWidth={4}>{sp.testo}</text>}
              </g>
            )
          })}
        </g>
        {strumenti && <GradiBordo proj={proj} t={t} w={w} h={h} passo={passoReticolato(ampiezzaBase / t.k)} />}
      </svg>

      {strumenti && (
        <>
          <div className="absolute right-2 top-12 pointer-events-none"><RosaDeiVenti /></div>
          <div className="absolute left-2 bottom-2 flex flex-col items-start gap-1 pointer-events-none">
            {cursore && <div className="bg-slate-900/85 text-white rounded-lg px-2 py-1 text-xs font-bold tabular-nums">📍 {coordinate(cursore[0], cursore[1])}</div>}
            <Scala proj={proj} t={t} w={w} h={h} />
          </div>
        </>
      )}

      {hover && !nascondiNomi && hover.f.properties.nome && createPortal(
        <div className="fixed z-[200] pointer-events-none px-2 py-1 rounded-md bg-slate-900/90 text-white text-sm shadow" style={{ left: hover.x + 12, top: hover.y + 12 }}>
          {hover.f.properties.nome}
        </div>,
        document.body,
      )}

      {zoomOn && (
        <div className="absolute right-2 bottom-2 flex flex-col gap-1">
          <button className="map-btn" onClick={() => zoomBy(1.6)} title="Ingrandisci">＋</button>
          <button className="map-btn" onClick={() => zoomBy(1 / 1.6)} title="Riduci">－</button>
          <button className="map-btn text-xs" onClick={zoomReset} title="Vista intera">⤢</button>
        </div>
      )}

      {props.scheda && focusFeature?.properties.id && !aperta && (
        <button className="absolute right-14 bottom-2 btn bg-white shadow border border-slate-200 text-slate-800" onClick={() => setAperta(focusFeature)}>
          ℹ️ Scheda: {focusFeature.properties.nome}
        </button>
      )}

      {props.controlli && <Controlli config={config} onChange={props.onConfigChange} cambioTipo={props.cambioTipo !== false} />}

      {aperta && <SchedaArea f={aperta} contenuto={props.contenuti?.[aperta.properties.id!]} onClose={() => setAperta(null)} />}
      {props.overlay}
    </>
  )
}

const Forme = memo(function Forme(p: {
  disegni: Disegno[]
  visibile: (f: GeoFeature) => boolean
  tipo: MappaConfig['tipo']
  colore: (f: GeoFeature) => string | undefined
  cliccabile: (f: GeoFeature) => boolean
  hoverId?: string
  onHover: (f: GeoFeature | null, e?: React.MouseEvent) => void
  onClick: (f: GeoFeature) => void
  fuori: (f: GeoFeature) => boolean
  focus?: string
  /** con le regioni d'Europa / le aree geografiche visibili, gli Stati mostrano solo i confini */
  statiTrasparenti?: boolean
}) {
  return (
    <>
      {p.disegni.filter((d) => d.d && p.visibile(d.f)).map((d, i) => {
        const pr = d.f.properties
        const s = stile(pr.livello, p.tipo, pr)
        const c = p.colore(d.f)
        const click = p.cliccabile(d.f)
        const isHover = click && p.hoverId === pr.id
        const attenuato = p.fuori(d.f)
        const evidenziato = !!p.focus && (pr.id === p.focus || pr.ref === p.focus)
        // con lo zoom, province e regioni interne si colorano per distinguerle
        const colorata = !!p.focus && !attenuato && (pr.livello === 'province' || pr.livello === 'suddivisioni' || (pr.livello === 'stati' && !!pr.cont))
        const trasparente = p.statiTrasparenti && pr.livello === 'stati' && !colorata
        const fill = d.linea ? 'none' : c ?? (colorata ? PALETTE_POLITICA[(pr._c ?? 0) % PALETTE_POLITICA.length] : trasparente ? 'transparent' : s.fill)
        const stroke = d.linea && c ? c : isHover || evidenziato ? '#111827' : s.stroke
        return (
          <g key={i}>
            <path
              d={d.d}
              fill={fill}
              fillOpacity={c && !d.linea ? 0.9 : colorata ? 0.85 : s.op}
              opacity={attenuato ? 0.3 : undefined}
              stroke={stroke}
              strokeWidth={isHover ? s.sw + (d.linea ? 1.5 : 1.2) : evidenziato ? 2.5 : s.sw}
              strokeDasharray={evidenziato ? undefined : s.dash}
              vectorEffect="non-scaling-stroke"
              style={{ filter: isHover && !d.linea ? 'brightness(0.92)' : undefined, pointerEvents: click ? undefined : 'none' }}
              className={click ? 'cursor-pointer' : ''}
              onMouseMove={click && !d.linea ? (e) => p.onHover(d.f, e) : undefined}
              onMouseLeave={click ? () => p.onHover(null) : undefined}
              onClick={click ? () => p.onClick(d.f) : undefined}
            />
            {d.linea && click && (
              <path d={d.d} fill="none" stroke="transparent" strokeWidth={12} vectorEffect="non-scaling-stroke" className="cursor-pointer"
                onMouseMove={(e) => p.onHover(d.f, e)} onMouseLeave={() => p.onHover(null)} onClick={() => p.onClick(d.f)} />
            )}
          </g>
        )
      })}
    </>
  )
})

function Etichetta({ x, y, k, testo, st, punto, box }: { x: number; y: number; k: number; testo: string; st: { size: number; color: string; italic?: boolean; weight?: number }; punto: boolean; box?: boolean }) {
  const size = st.size / k
  return (
    <text
      x={punto ? x + 7 / k : x}
      y={punto ? y + 4 / k : y}
      fontSize={size}
      fill={st.color}
      fontStyle={st.italic ? 'italic' : undefined}
      fontWeight={st.weight}
      textAnchor={punto ? 'start' : 'middle'}
      dominantBaseline={punto ? undefined : 'middle'}
      paintOrder="stroke"
      stroke={box ? '#fff' : 'rgba(255,255,255,0.85)'}
      strokeWidth={(box ? 4 : 2.5) / k}
      strokeLinejoin="round"
      style={{ pointerEvents: 'none' }}
    >
      {testo}
    </text>
  )
}

function Controlli({ config, onChange, cambioTipo }: { config: MappaConfig; onChange?: (c: MappaConfig) => void; cambioTipo: boolean }) {
  const defs = LIVELLI[config.tipo][config.area]
  const attivi = config.livelli ?? livelliPredefiniti(config.area, config.tipo)
  const toggle = (id: string) => onChange?.({ ...config, livelli: attivi.includes(id) ? attivi.filter((x) => x !== id) : [...attivi, id] })
  return (
    <div className="absolute left-2 top-2 right-14 flex flex-wrap gap-1 items-center pointer-events-none">
      {cambioTipo && (
        <div className="pointer-events-auto flex rounded-full bg-white shadow overflow-hidden text-sm font-semibold mr-1">
          {(['politica', 'fisica'] as const).map((tp) => (
            <button key={tp} onClick={() => onChange?.({ ...config, tipo: tp, livelli: undefined, colori: {} })}
              className={'px-3 py-1 ' + (config.tipo === tp ? (tp === 'fisica' ? 'bg-amber-700 text-white' : 'bg-sky-600 text-white') : 'text-slate-700 hover:bg-slate-100')}>
              {tp === 'politica' ? 'Politica' : 'Fisica'}
            </button>
          ))}
        </div>
      )}
      {defs.map((l) => (
        <button key={l.id} onClick={() => toggle(l.id)}
          className={'pointer-events-auto px-2 py-0.5 rounded-full text-xs shadow border ' + (attivi.includes(l.id) ? 'bg-white border-slate-300 text-slate-800' : 'bg-white/60 border-transparent text-slate-400 line-through')}>
          {l.icona} {l.nome}
        </button>
      ))}
      <button onClick={() => onChange?.({ ...config, etichette: !config.etichette })}
        className={'pointer-events-auto px-2 py-0.5 rounded-full text-xs shadow border ' + (config.etichette ? 'bg-slate-800 text-white border-slate-800' : 'bg-white/60 text-slate-500 border-transparent')}>
        Aa Nomi
      </button>
    </div>
  )
}

export function SchedaArea({ f, contenuto, onClose }: { f: GeoFeature; contenuto?: ContenutoArea; onClose: () => void }) {
  const p = f.properties
  const img = useAssetUrl(contenuto?.assetId)
  return (
    <div className="absolute left-2 bottom-2 w-80 max-w-[calc(100%-4rem)] max-h-[85%] overflow-auto bg-white rounded-xl shadow-xl border border-slate-200 p-4 text-slate-800 z-10">
      <button onClick={onClose} className="absolute right-2 top-2 w-7 h-7 rounded-full hover:bg-slate-100 text-slate-500" aria-label="Chiudi">✕</button>
      <div className="flex items-center gap-2 pr-6">
        {p.flag && <img src={getRuntime().flagUrl(p.flag)} alt="" className="h-6 rounded-sm shadow-sm" />}
        <h3 className="text-xl font-bold leading-tight">{p.nome}</h3>
      </div>
      {p.tipo && <div className="text-xs uppercase tracking-wide text-slate-500 mt-0.5">{p.tipo}</div>}
      {infoRighe(p).length > 0 && (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          {infoRighe(p).map(([k, v]) => (
            <Fragment key={k}><dt className="text-slate-500">{k}</dt><dd className="font-medium">{v}</dd></Fragment>
          ))}
        </dl>
      )}
      {p.desc && <p className="mt-2 text-sm">{p.desc}</p>}
      {contenuto && (
        <div className="mt-3 border-t pt-2">
          {img && <img src={img} alt="" className="rounded-lg mb-2 max-h-48 w-full object-cover" />}
          <p className="text-sm whitespace-pre-wrap">{contenuto.testo}</p>
        </div>
      )}
    </div>
  )
}
