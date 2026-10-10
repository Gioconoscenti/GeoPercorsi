// Strumenti del geografo sulla carta: reticolato con i gradi, rosa dei venti, scala grafica, coordinate.
import { geoDistance, geoGraticule, type GeoPath, type GeoProjection } from 'd3-geo'
import type { ZoomTransform } from 'd3-zoom'

/** 45.5 → "45° 30′ N" */
export function gradi(v: number, tipo: 'lat' | 'lon', minuti = true) {
  const dir = tipo === 'lat' ? (v > 0 ? 'N' : v < 0 ? 'S' : '') : v > 0 ? 'E' : v < 0 ? 'O' : ''
  const a = Math.abs(v)
  let g = Math.floor(a)
  let m = Math.round((a - g) * 60)
  if (m === 60) { g++; m = 0 }
  return `${g}°${minuti && m ? ` ${String(m).padStart(2, '0')}′` : ''}${dir ? ' ' + dir : ''}`
}

export const coordinate = (lon: number, lat: number, minuti = true) => `${gradi(lat, 'lat', minuti)}, ${gradi(lon, 'lon', minuti)}`

const PASSI = [30, 15, 10, 5, 2, 1, 0.5, 0.25]

/** Passo del reticolato adatto all'estensione visibile (in gradi) */
export function passoReticolato(ampiezza: number) {
  // il passo più fitto che dà al massimo ~16 linee
  return [...PASSI].reverse().find((p) => ampiezza / p <= 16) ?? PASSI[0]
}

interface Etichetta { x: number; y: number; testo: string; asse: 'lat' | 'lon' }

/** Meridiani e paralleli (dentro il gruppo che zooma) */
export function Reticolato({ path, passo }: { path: GeoPath; passo: number }) {
  const d = path(geoGraticule().step([passo, passo]).precision(1)()) ?? ''
  return <path d={d} fill="none" stroke="#334155" strokeOpacity={0.45} strokeWidth={0.7} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" style={{ pointerEvents: 'none' }} />
}

/** Etichette dei gradi lungo i bordi (fuori dal gruppo che zooma, così restano leggibili) */
export function GradiBordo({ proj, t, w, h, passo }: { proj: GeoProjection; t: ZoomTransform; w: number; h: number; passo: number }) {
  const dentro = (p: [number, number] | null): p is [number, number] => !!p && p[0] >= 0 && p[0] <= w && p[1] >= 0 && p[1] <= h
  const scr = (lon: number, lat: number) => {
    const p = proj([lon, lat])
    return p ? (t.apply(p) as [number, number]) : null
  }
  // estensione geografica visibile (angoli e metà dei lati dello schermo)
  let lon0 = 180, lon1 = -180, lat0 = 90, lat1 = -90, valido = 0
  for (const [sx, sy] of [[0, 0], [w / 2, 0], [w, 0], [0, h / 2], [w, h / 2], [0, h], [w / 2, h], [w, h], [w / 2, h / 2]]) {
    const ll = proj.invert?.(t.invert([sx, sy]) as [number, number])
    if (!ll || !isFinite(ll[0]) || !isFinite(ll[1])) continue
    valido++
    lon0 = Math.min(lon0, ll[0]); lon1 = Math.max(lon1, ll[0]); lat0 = Math.min(lat0, ll[1]); lat1 = Math.max(lat1, ll[1])
  }
  if (valido < 5) { lon0 = -180; lon1 = 180; lat0 = -85; lat1 = 85 }
  lon0 = Math.max(-180, lon0 - passo); lon1 = Math.min(180, lon1 + passo); lat0 = Math.max(-85, lat0 - passo); lat1 = Math.min(85, lat1 + passo)
  const out: Etichetta[] = []
  const passoLon = (lon1 - lon0) / 150
  const passoLat = (lat1 - lat0) / 150
  // i paralleli si etichettano dove incrociano il meridiano centrale della carta (lì sono quasi orizzontali)
  const centro = proj.invert?.(t.invert([w / 2, h / 2]) as [number, number])
  const lonC = centro && isFinite(centro[0]) ? centro[0] : (lon0 + lon1) / 2
  for (let lat = Math.ceil(lat0 / passo) * passo; lat <= lat1; lat += passo) {
    if (Math.abs(lat) >= 90) continue
    const p = scr(lonC, lat)
    if (dentro(p)) out.push({ x: p[0] + 3, y: p[1] - 3, testo: gradi(lat, 'lat', passo < 1), asse: 'lat' })
  }
  for (let lon = Math.ceil(lon0 / passo) * passo; lon <= lon1; lon += passo) {
    if (lon >= 180) continue
    // il punto più in basso del meridiano dentro la carta
    let best: [number, number] | null = null
    for (let lat = lat0; lat <= lat1; lat += passoLat) {
      const p = scr(lon, lat)
      if (dentro(p) && (!best || p[1] > best[1])) best = p
    }
    // solo se il meridiano arriva davvero al bordo inferiore
    if (best && best[1] > h - 40) out.push({ x: best[0] + 3, y: best[1] - 4, testo: gradi(lon, 'lon', passo < 1), asse: 'lon' })
  }
  return (
    <g style={{ pointerEvents: 'none' }}>
      {out.map((e, i) => (
        <text key={i} x={e.x} y={e.y} fontSize={11} fontWeight={700} fill="#1e293b" paintOrder="stroke" stroke="#fff" strokeWidth={3} strokeLinejoin="round">
          {e.testo}
        </text>
      ))}
    </g>
  )
}

/** Rosa dei venti con i punti cardinali */
export function RosaDeiVenti() {
  return (
    <svg width={64} height={64} viewBox="-32 -32 64 64" className="drop-shadow pointer-events-none">
      <circle r={20} fill="rgba(255,255,255,0.85)" stroke="#334155" strokeWidth={1} />
      <path d="M0,-18 L4,0 L0,18 L-4,0 Z" fill="#334155" />
      <path d="M0,-18 L4,0 L-4,0 Z" fill="#dc2626" />
      <path d="M-18,0 L0,-3 L18,0 L0,3 Z" fill="#94a3b8" />
      {[['N', 0, -24], ['S', 0, 29], ['E', 27, 4], ['O', -27, 4]].map(([l, x, y]) => (
        <text key={l as string} x={x as number} y={y as number} textAnchor="middle" fontSize={11} fontWeight={800} fill={l === 'N' ? '#dc2626' : '#1e293b'}
          paintOrder="stroke" stroke="#fff" strokeWidth={3}>{l}</text>
      ))}
    </svg>
  )
}

/** Scala grafica: misura la distanza reale corrispondente a un tratto al centro della carta */
export function Scala({ proj, t, w, h }: { proj: GeoProjection; t: ZoomTransform; w: number; h: number }) {
  const a = proj.invert?.(t.invert([w / 2, h / 2]) as [number, number])
  const b = proj.invert?.(t.invert([w / 2 + 100, h / 2]) as [number, number])
  if (!a || !b) return null
  const kmPer100 = geoDistance(a, b) * 6371
  if (!isFinite(kmPer100) || kmPer100 <= 0) return null
  const obiettivo = kmPer100 * 1.3
  const pot = Math.pow(10, Math.floor(Math.log10(obiettivo)))
  const km = [5, 2, 1].map((m) => m * pot).find((v) => v <= obiettivo) ?? pot
  const px = (km / kmPer100) * 100
  const metà = px / 2
  return (
    <div className="bg-white/85 rounded-lg px-2 py-1 shadow text-[11px] font-bold text-slate-800">
      <svg width={px + 2} height={12}>
        <rect x={1} y={3} width={metà} height={6} fill="#1e293b" />
        <rect x={1 + metà} y={3} width={metà} height={6} fill="#fff" stroke="#1e293b" />
      </svg>
      <div className="flex justify-between" style={{ width: px + 2 }}>
        <span>0</span><span>{km.toLocaleString('it-IT')} km</span>
      </div>
    </div>
  )
}
