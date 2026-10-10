import { useEffect, useState } from 'react'
import { geoArea } from 'd3-geo'
import { feature, neighbors } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import { getRuntime } from '../lib/runtime'
import type { Area, TipoMappa } from '../types'

export interface GeoProps {
  id?: string
  nome?: string
  livello: string
  tipo?: string
  val?: number
  desc?: string
  cap?: string
  flag?: string
  cont?: string
  /** indice colore (colorazione dei vicini) */
  _c?: number
  [k: string]: unknown
}
export type GeoFeature = GeoJSON.Feature<GeoJSON.Geometry, GeoProps>

export interface GeoData {
  area: Area
  tipo: TipoMappa
  features: GeoFeature[]
  byId: Map<string, GeoFeature>
  perLivello: Map<string, GeoFeature[]>
}

/** d3-geo vuole gli anelli esterni in senso orario: se un poligono risulta "più grande di mezzo globo" lo giriamo */
function rewind(f: GeoFeature) {
  const g = f.geometry
  if (g.type !== 'Polygon' && g.type !== 'MultiPolygon') return
  if (geoArea(f) <= 2 * Math.PI) return
  if (g.type === 'Polygon') g.coordinates.forEach((r) => r.reverse())
  else g.coordinates.forEach((p) => p.forEach((r) => r.reverse()))
}

const cache = new Map<string, Promise<GeoData>>()

export function caricaGeo(area: Area, tipo: TipoMappa): Promise<GeoData> {
  const key = area + '/' + tipo
  if (!cache.has(key)) {
    cache.set(
      key,
      getRuntime()
        .loadGeo(area, tipo)
        .then((topo) => costruisci(area, tipo, topo))
        .catch((e) => {
          cache.delete(key)
          throw e
        }),
    )
  }
  return cache.get(key)!
}

function costruisci(area: Area, tipo: TipoMappa, topo: Topology): GeoData {
  const features: GeoFeature[] = []
  for (const [nome, obj] of Object.entries(topo.objects)) {
    const coll = obj as GeometryCollection<GeoProps>
    // colorazione "a 4 colori" (greedy) per regioni e stati
    let colori: number[] | null = null
    if (['regioni', 'stati', 'province', 'suddivisioni'].includes(nome)) {
      const nb = neighbors(coll.geometries as never)
      colori = []
      coll.geometries.forEach((_, i) => {
        const usati = new Set(nb[i].map((j) => colori![j]).filter((c) => c !== undefined))
        let c = 0
        while (usati.has(c)) c++
        colori![i] = c
      })
    }
    const fc = feature(topo, coll) as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoProps>
    fc.features.forEach((f, i) => {
      if (!f.geometry) return
      f.properties = { ...f.properties, livello: f.properties?.livello ?? nome }
      if (colori) f.properties._c = colori[i]
      rewind(f)
      features.push(f)
    })
  }
  const byId = new Map<string, GeoFeature>()
  const perLivello = new Map<string, GeoFeature[]>()
  for (const f of features) {
    if (f.properties.id) byId.set(f.properties.id, f)
    const l = f.properties.livello
    if (!perLivello.has(l)) perLivello.set(l, [])
    perLivello.get(l)!.push(f)
  }
  return { area, tipo, features, byId, perLivello }
}

export function useGeo(area: Area, tipo: TipoMappa) {
  const [data, setData] = useState<GeoData | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  useEffect(() => {
    let vivo = true
    setData(null)
    caricaGeo(area, tipo)
      .then((d) => vivo && setData(d))
      .catch((e) => vivo && setErrore(String(e.message ?? e)))
    return () => {
      vivo = false
    }
  }, [area, tipo])
  return { data, errore }
}

/** Righe informative "i_Chiave" → [["Chiave", valore]] */
export function infoRighe(p: GeoProps): [string, string][] {
  return Object.entries(p)
    .filter(([k, v]) => k.startsWith('i_') && v !== undefined && v !== '')
    .map(([k, v]) => [k.slice(2).replace(/_/g, ' '), String(v)])
}
