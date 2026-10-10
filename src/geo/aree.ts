import { geoConicConformal, geoNaturalEarth1, type GeoProjection } from 'd3-geo'
import type { Area, MappaConfig, TipoMappa } from '../types'

export interface LivelloDef {
  id: string
  nome: string
  icona: string
  predefinito: boolean
}

const L = (id: string, nome: string, icona: string, predefinito = true): LivelloDef => ({ id, nome, icona, predefinito })

/** Livelli che si possono accendere/spegnere, per tipo di mappa e area */
export const LIVELLI: Record<TipoMappa, Record<Area, LivelloDef[]>> = {
  politica: {
    italia: [L('regioni', 'Regioni', '🗺️'), L('province', 'Province', '🔲', false), L('citta', 'Capoluoghi di regione', '🏙️'), L('capoluoghi', 'Capoluoghi di provincia', '🏘️', false), L('mari', 'Mari', '🌊'), L('reticolato', 'Reticolato e scala', '🌐', false)],
    europa: [L('stati', 'Stati', '🗺️'), L('macroregioni', 'Regioni d’Europa', '🧩', false), L('suddivisioni', 'Regioni interne', '🔲', false), L('citta', 'Capitali', '🏙️'), L('grandi_citta', 'Altre città', '🏘️', false), L('mari', 'Mari', '🌊'), L('reticolato', 'Reticolato e scala', '🌐', false)],
    mondo: [L('continenti', 'Continenti', '🌍'), L('macroaree', 'Aree geografiche', '🧩', false), L('stati', 'Stati', '🗺️', false), L('suddivisioni', 'Stati federati e province', '🔲', false), L('citta', 'Capitali', '🏙️', false), L('grandi_citta', 'Altre città', '🏘️', false), L('mari', 'Oceani', '🌊'), L('paralleli', 'Paralleli e meridiani', '〰️', false), L('fusi', 'Fusi orari', '🕐', false), L('reticolato', 'Reticolato e scala', '🌐', false)],
  },
  fisica: {
    italia: [
      L('rilievi', 'Montagne', '⛰️'), L('vette', 'Vette', '🔺'), L('vulcani', 'Vulcani', '🌋'), L('pianure', 'Pianure', '🌾'),
      L('fiumi', 'Fiumi', '〰️'), L('laghi', 'Laghi', '💧'), L('mari', 'Mari', '🌊'), L('isole', 'Isole', '🏝️'), L('coste', 'Golfi e stretti', '⚓', false), L('confini', 'Confini regionali', '┄'), L('reticolato', 'Reticolato e scala', '🌐', false),
    ],
    europa: [
      L('rilievi', 'Montagne', '⛰️'), L('vette', 'Vette', '🔺'), L('vulcani', 'Vulcani', '🌋'), L('pianure', 'Pianure', '🌾'), L('penisole', 'Penisole', '🧭', false),
      L('fiumi', 'Fiumi', '〰️'), L('laghi', 'Laghi', '💧'), L('mari', 'Mari', '🌊'), L('isole', 'Isole', '🏝️', false), L('confini', 'Confini', '┄'), L('reticolato', 'Reticolato e scala', '🌐', false),
    ],
    mondo: [
      L('rilievi', 'Montagne', '⛰️'), L('vette', 'Vette', '🔺'), L('vulcani', 'Vulcani', '🌋', false), L('pianure', 'Pianure', '🌾'), L('altopiani', 'Altopiani', '🟫'),
      L('deserti', 'Deserti', '🏜️'), L('fiumi', 'Fiumi', '〰️'), L('laghi', 'Laghi', '💧'), L('mari', 'Mari e oceani', '🌊'), L('isole', 'Isole', '🏝️', false),
      L('penisole', 'Penisole', '🧭', false), L('fasce', 'Fasce climatiche', '🌡️', false), L('paralleli', 'Paralleli e meridiani', '〰️', false), L('confini', 'Confini', '┄', false), L('reticolato', 'Reticolato e scala', '🌐', false),
    ],
  },
}

/** Ordine di disegno (dal basso verso l'alto) */
export const ORDINE = ['mari', 'terra', 'contesto', 'continenti', 'macroaree', 'macroregioni', 'regioni', 'stati', 'province', 'suddivisioni', 'isole', 'penisole', 'pianure', 'altopiani', 'deserti', 'rilievi', 'fasce', 'fusi', 'confini', 'laghi', 'fiumi', 'paralleli', 'coste', 'vette', 'vulcani', 'grandi_citta', 'capoluoghi', 'citta']

/** Livelli sempre visibili e non cliccabili */
export const SFONDO = new Set(['terra', 'contesto', 'confini'])

/** Livelli con nomi utili per giochi e generatori */
export const NOMI_LIVELLI: Record<string, string> = {
  macroregioni: 'regione d’Europa', macroaree: 'area geografica', regioni: 'regione', province: 'provincia', capoluoghi: 'capoluogo di provincia', suddivisioni: 'regione interna', grandi_citta: 'città', stati: 'Stato', continenti: 'continente', citta: 'città', mari: 'mare',
  rilievi: 'catena montuosa', vette: 'vetta', vulcani: 'vulcano', pianure: 'pianura', altopiani: 'altopiano', deserti: 'deserto',
  fiumi: 'fiume', laghi: 'lago', isole: 'isola', penisole: 'penisola', coste: 'golfo/stretto', fasce: 'fascia climatica', paralleli: 'parallelo o meridiano', fusi: 'fuso orario',
}

/** Livelli da accendere quando si fa lo zoom su una regione, uno Stato, una regione d'Europa o un continente */
export function livelliFocus(area: Area, tipo: TipoMappa, focus?: string): string[] {
  if (tipo === 'fisica') return []
  if (area === 'italia') return ['province', 'capoluoghi']
  // su un gruppo di Stati bastano Stati e capitali; su un singolo Stato si vedono anche suddivisioni e città
  if (focus && !focus.startsWith('stato-')) return ['stati', 'citta']
  return ['stati', 'suddivisioni', 'grandi_citta', 'citta']
}

export function livelliPredefiniti(area: Area, tipo: TipoMappa) {
  return LIVELLI[tipo][area].filter((l) => l.predefinito).map((l) => l.id)
}

export function proiezione(area: Area): { proj: GeoProjection; fit: GeoJSON.GeoJsonObject } {
  const box = (x0: number, y0: number, x1: number, y1: number): GeoJSON.MultiPoint => {
    const pts: number[][] = []
    for (let i = 0; i <= 10; i++) {
      const x = x0 + ((x1 - x0) * i) / 10
      const y = y0 + ((y1 - y0) * i) / 10
      pts.push([x, y0], [x, y1], [x0, y], [x1, y])
    }
    return { type: 'MultiPoint', coordinates: pts }
  }
  switch (area) {
    case 'italia':
      return { proj: geoConicConformal().parallels([38, 46]).rotate([-12.5, 0]), fit: box(6.6, 36.0, 18.6, 47.1) }
    case 'europa':
      return { proj: geoConicConformal().parallels([40, 65]).rotate([-15, 0]), fit: box(-22, 35, 42, 70) }
    case 'mondo':
      return { proj: geoNaturalEarth1(), fit: { type: 'Sphere' } as unknown as GeoJSON.GeoJsonObject }
  }
}

// ---------------- stili ----------------
export const PALETTE_POLITICA = ['#fde68a', '#bbf7d0', '#bfdbfe', '#fecaca', '#ddd6fe', '#fed7aa', '#a5f3fc', '#f5d0fe']
/** Colori per le regioni d'Europa e le aree geografiche del mondo */
export const PALETTE_GRUPPI = ['#fca5a5', '#fdba74', '#fde047', '#86efac', '#67e8f9', '#93c5fd', '#c4b5fd', '#f9a8d4', '#d6d3d1', '#bef264', '#5eead4', '#fcd34d']
export const COLORI_CONTINENTI: Record<string, string> = {
  europa: '#93c5fd', asia: '#fcd34d', africa: '#fdba74', 'america-nord': '#86efac', 'america-sud': '#bef264', oceania: '#f9a8d4', antartide: '#e2e8f0',
}
export const COLORI_FASCE: Record<string, string> = {
  'fascia-torrida': '#ef4444', 'fascia-temperata-boreale': '#f59e0b', 'fascia-temperata-australe': '#f59e0b', 'fascia-glaciale-artica': '#38bdf8', 'fascia-glaciale-antartica': '#38bdf8',
}

export interface Stile {
  fill: string
  stroke: string
  sw: number
  op?: number
  dash?: string
}

export function stile(livello: string, tipo: TipoMappa, p: { id?: string; cont?: string; _c?: number }): Stile {
  switch (livello) {
    case 'mari': return { fill: tipo === 'fisica' ? '#9fd0f2' : '#cfe8f7', stroke: 'none', sw: 0 }
    case 'terra': return { fill: '#cfe3a6', stroke: '#7d9c5a', sw: 0.6 }
    case 'contesto': return { fill: '#efefe9', stroke: '#b9b9b0', sw: 0.6 }
    case 'regioni':
    case 'stati':
      if (livello === 'stati' && p.cont) return { fill: COLORI_CONTINENTI[p.cont] ?? '#ddd', stroke: '#fff', sw: 0.6 }
      return { fill: PALETTE_POLITICA[(p._c ?? 0) % PALETTE_POLITICA.length], stroke: '#6b7280', sw: 0.8 }
    case 'macroregioni':
    case 'macroaree': return { fill: PALETTE_GRUPPI[(p._c ?? 0) % PALETTE_GRUPPI.length], stroke: '#1e293b', sw: 1.2 }
    case 'province': return { fill: 'transparent', stroke: '#6b7280', sw: 0.4, dash: '2 2' }
    case 'suddivisioni': return { fill: 'transparent', stroke: '#475569', sw: 0.5, dash: '3 2' }
    case 'continenti': return { fill: COLORI_CONTINENTI[(p.id ?? '').replace('continente-', '')] ?? '#ddd', stroke: '#475569', sw: 0.8 }
    case 'confini': return { fill: 'none', stroke: '#6b6b6b', sw: 0.5, dash: '3 2', op: 0.7 }
    case 'pianure': return { fill: '#8bc34a', stroke: 'none', sw: 0, op: 0.75 }
    case 'altopiani': return { fill: '#d4b25f', stroke: 'none', sw: 0, op: 0.8 }
    case 'deserti': return { fill: '#f6d878', stroke: '#d9a92b', sw: 0.4, op: 0.9, dash: '1 2' }
    case 'rilievi': return { fill: '#a0714f', stroke: '#7a4f31', sw: 0.5, op: 0.85 }
    case 'penisole': return { fill: 'rgba(124,58,237,0.06)', stroke: '#7c3aed', sw: 1, dash: '5 3' }
    case 'isole': return { fill: 'rgba(13,148,136,0.05)', stroke: '#0f766e', sw: 0.8 }
    case 'laghi': return { fill: '#4fa3e3', stroke: '#1d6fb8', sw: 0.5 }
    case 'fiumi': return { fill: 'none', stroke: '#1e78d2', sw: 1.8 }
    case 'paralleli': return { fill: 'none', stroke: '#dc2626', sw: 1.2, dash: '6 4' }
    case 'fasce': return { fill: COLORI_FASCE[p.id ?? ''] ?? '#999', stroke: 'none', sw: 0, op: 0.22 }
    case 'fusi': return { fill: (p._c ?? 0) % 2 ? '#a78bfa' : '#fbbf24', stroke: '#6d28d9', sw: 0.5, op: 0.25 }
    default: return { fill: '#333', stroke: '#fff', sw: 1 }
  }
}

/** Simboli per i punti */
export const SIMBOLI: Record<string, { path: string; fill: string; stroke: string }> = {
  vette: { path: 'M0,-7L6,5H-6Z', fill: '#6d4c2f', stroke: '#fff' },
  vulcani: { path: 'M0,-7L6,5H-6Z', fill: '#dc2626', stroke: '#fff' },
  citta: { path: 'M-4,0a4,4 0 1,0 8,0a4,4 0 1,0 -8,0', fill: '#1f2937', stroke: '#fff' },
  capoluoghi: { path: 'M-3,0a3,3 0 1,0 6,0a3,3 0 1,0 -6,0', fill: '#7c3aed', stroke: '#fff' },
  grandi_citta: { path: 'M-3,0a3,3 0 1,0 6,0a3,3 0 1,0 -6,0', fill: '#475569', stroke: '#fff' },
  laghi: { path: 'M-4,0a4,4 0 1,0 8,0a4,4 0 1,0 -8,0', fill: '#3b82f6', stroke: '#fff' },
  isole: { path: 'M-4,0a4,4 0 1,0 8,0a4,4 0 1,0 -8,0', fill: '#0d9488', stroke: '#fff' },
  coste: { path: 'M0,-5L5,0L0,5L-5,0Z', fill: '#2563eb', stroke: '#fff' },
}

export const STILE_ETICHETTA: Record<string, { size: number; color: string; italic?: boolean; weight?: number }> = {
  mari: { size: 13, color: '#1d4ed8', italic: true },
  regioni: { size: 12, color: '#111827', weight: 600 },
  stati: { size: 11, color: '#111827', weight: 600 },
  continenti: { size: 16, color: '#0f172a', weight: 700 },
  macroregioni: { size: 14, color: '#0f172a', weight: 800 },
  macroaree: { size: 13, color: '#0f172a', weight: 800 },
  province: { size: 9, color: '#374151' },
  citta: { size: 11, color: '#111827' },
  capoluoghi: { size: 10, color: '#4c1d95' },
  grandi_citta: { size: 10, color: '#334155' },
  suddivisioni: { size: 10, color: '#334155' },
  fiumi: { size: 11, color: '#1e40af', italic: true },
  laghi: { size: 10, color: '#1e3a8a', italic: true },
  rilievi: { size: 12, color: '#5b3416', weight: 700 },
  vette: { size: 10, color: '#3f2a14' },
  vulcani: { size: 10, color: '#991b1b' },
  pianure: { size: 11, color: '#365314', weight: 600 },
  altopiani: { size: 11, color: '#713f12', weight: 600 },
  deserti: { size: 11, color: '#92400e', weight: 600 },
  isole: { size: 10, color: '#115e59' },
  penisole: { size: 11, color: '#5b21b6', italic: true },
  coste: { size: 10, color: '#1e3a8a' },
  fasce: { size: 12, color: '#7f1d1d', weight: 700 },
  fusi: { size: 10, color: '#4c1d95', weight: 700 },
  paralleli: { size: 10, color: '#b91c1c' },
}

/** Con lo zoom su una regione/uno Stato si accendono anche province, città, suddivisioni */
export function conFocus(config: MappaConfig, focus?: string): MappaConfig {
  const base = config.livelli ?? livelliPredefiniti(config.area, config.tipo)
  // si tolgono i livelli accesi dallo zoom precedente, poi si aggiungono quelli del nuovo
  const prima = config.focus ? livelliFocus(config.area, config.tipo, config.focus) : []
  const pulita = base.filter((l) => !prima.includes(l) || livelliPredefiniti(config.area, config.tipo).includes(l))
  const extra = focus ? livelliFocus(config.area, config.tipo, focus) : []
  return { ...config, focus, livelli: [...new Set([...pulita, ...extra])] }
}
