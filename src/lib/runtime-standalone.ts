import type { Topology } from 'topojson-specification'
import type { Percorso } from '../types'
import type { Runtime } from './runtime'

export interface DatiStandalone {
  percorso: Percorso
  assets: Record<string, { url: string; nome: string; mime: string }>
  pdf: Record<string, string[]>
  geo: Record<string, Topology>
  flags: Record<string, string>
}

declare global {
  interface Window {
    __GEOPERCORSO__?: DatiStandalone
  }
}

export function standaloneRuntime(d: DatiStandalone): Runtime {
  return {
    assetUrl: async (id) => d.assets[id]?.url,
    assetInfo: async (id) => d.assets[id] && { nome: d.assets[id].nome, mime: d.assets[id].mime },
    pdfPagine: async (id) => d.pdf[id],
    loadGeo: async (area, tipo) => {
      const t = d.geo[`${area}/${tipo}`]
      if (!t) throw new Error('Mappa non inclusa nel file')
      return t
    },
    flagUrl: (code) => d.flags[code] ?? '',
  }
}
