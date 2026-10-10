// Funzioni di supporto per i dati di dettaglio: appartenenza geografica (in quale regione/Stato
// si trova un elemento), confini tra aree, conteggi.
import { geoArea, geoBounds, geoCentroid, geoContains, geoLength } from 'd3-geo'
import { neighbors } from 'topojson-client'
import mapshaper from 'mapshaper'

/** Copia della feature con gli anelli nel verso che vuole d3-geo */
function rewound(f) {
  const g = structuredClone(f.geometry)
  const ff = { type: 'Feature', geometry: g, properties: {} }
  if ((g.type === 'Polygon' || g.type === 'MultiPolygon') && geoArea(ff) > 2 * Math.PI) {
    if (g.type === 'Polygon') g.coordinates.forEach((r) => r.reverse())
    else g.coordinates.forEach((p) => p.forEach((r) => r.reverse()))
  }
  return ff
}

/** Semplifica (per velocità) le aree contenitore e prepara gli indici */
export async function contenitori(features, idFn) {
  const out = JSON.parse((await mapshaper.applyCommands('-i in.json -simplify 4% keep-shapes -o out.json format=geojson', {
    'in.json': { type: 'FeatureCollection', features: features.map((f) => ({ type: 'Feature', geometry: f.geometry, properties: { _id: idFn(f) } })) },
  }))['out.json'])
  return out.features.filter((f) => f.geometry).map((f) => {
    const r = rewound(f)
    const b = geoBounds(r)
    return { id: f.properties._id, f: r, b }
  })
}

// se l'area attraversa il meridiano di 180° (Russia, USA, Fiji…) il riquadro ha la longitudine "rovesciata"
const dentroBox = (p, b) => (b[0][0] <= b[1][0] ? p[0] >= b[0][0] && p[0] <= b[1][0] : p[0] >= b[0][0] || p[0] <= b[1][0]) && p[1] >= b[0][1] && p[1] <= b[1][1]

/** Punti campione di una geometria: vertici per le linee, griglia interna per i poligoni */
function campioni(f) {
  const g = f.geometry
  // un punto vicino a un confine (es. una vetta) conta per tutte le aree entro ~3 km
  if (g.type === 'Point') {
    const [x, y] = g.coordinates
    const d = 0.03
    return [[x, y], [x + d, y], [x - d, y], [x, y + d], [x, y - d]]
  }
  if (g.type === 'MultiPoint') return g.coordinates
  if (g.type === 'LineString' || g.type === 'MultiLineString') {
    const tutti = g.type === 'LineString' ? g.coordinates : g.coordinates.flat()
    const passo = Math.max(1, Math.floor(tutti.length / 120))
    return tutti.filter((_, i) => i % passo === 0)
  }
  const r = rewound(f)
  const [[x0, y0], [x1, y1]] = geoBounds(r)
  const pts = []
  const n = 12
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
    const p = [x0 + ((x1 - x0) * (i + 0.5)) / (n + 1), y0 + ((y1 - y0) * (j + 0.5)) / (n + 1)]
    if (geoContains(r, p)) pts.push(p)
  }
  if (!pts.length) pts.push(geoCentroid(r))
  return pts
}

/** Id delle aree che contengono una parte significativa della feature */
export function appartenenza(f, conts, minFrac) {
  const pts = campioni(f)
  // per i fiumi basta un breve tratto (es. il delta del Po in Veneto)
  minFrac ??= /Line/.test(f.geometry.type) ? 0.015 : 0.04
  const conta = new Map()
  for (const p of pts) {
    for (const c of conts) {
      if (!dentroBox(p, c.b)) continue
      if (geoContains(c.f, p)) { conta.set(c.id, (conta.get(c.id) ?? 0) + 1); break }
    }
  }
  const min = Math.max(/Line/.test(f.geometry.type) ? 2 : 1, Math.ceil(pts.length * minFrac))
  return [...conta.entries()].filter(([, n]) => n >= min).sort((a, b) => b[1] - a[1]).map(([id]) => id)
}

/** Lunghezza approssimata (km) di una linea */
export const lunghezzaKm = (f) => geoLength(f) * 6371

/**
 * Aggiunge alle aree di uno o più oggetti TopoJSON l'elenco dei vicini (che condividono un confine).
 * oggetti: nomi degli oggetti da considerare insieme; target: oggetto da arricchire.
 */
export function vicini(topo, oggetti, target) {
  const geoms = oggetti.flatMap((o) => (topo.objects[o]?.geometries ?? []).map((g) => ({ g, o })))
  const nb = neighbors(geoms.map((x) => x.g))
  const out = new Map()
  geoms.forEach((x, i) => {
    if (x.o !== target || !x.g.properties?.id) return
    const nomi = [...new Set(nb[i].map((j) => geoms[j].g.properties?.nome).filter(Boolean))]
    const ids = [...new Set(nb[i].map((j) => geoms[j].g.properties?.id).filter(Boolean))]
    out.set(x.g.properties.id, { g: x.g, nomi, ids })
  })
  return out
}
