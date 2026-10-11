export type Classe = 1 | 2 | 3
export type Area = 'italia' | 'europa' | 'mondo'
export type TipoMappa = 'politica' | 'fisica'

/** Dimensioni di riferimento del "palco" di ogni tappa (16:9) */
export const STAGE_W = 1280
export const STAGE_H = 720

export interface MappaConfig {
  area: Area
  tipo: TipoMappa
  /** livelli visibili (se assente: quelli predefiniti) */
  livelli?: string[]
  etichette: boolean
  /** zoom su una regione o uno Stato (id), con i suoi dettagli */
  focus?: string
  /** colori personalizzati per id di elemento geografico */
  colori?: Record<string, string>
}

export interface ContenutoArea {
  testo: string
  assetId?: string
}

// ---------------- Attività ----------------
export interface DomandaQuiz {
  domanda: string
  opzioni: string[]
  corrette: number[]
  assetId?: string
  bandiera?: string
}
export interface PuntoCoordinate {
  lon: number
  lat: number
  nome?: string
}
/** Dati di un grafico o di una tabella (la forma dice come si disegnano) */
export type FormaGrafico = 'istogramma' | 'barre' | 'torta' | 'climogramma' | 'tabella'
export interface DatiGrafico {
  forma: FormaGrafico
  /** didascalia sopra il grafico (facoltativa) */
  titolo?: string
  /** una colonna per ogni serie di valori; nel climogramma la prima sono le precipitazioni e la seconda le temperature */
  colonne: { nome: string; unita: string }[]
  righe: { etichetta: string; valori: number[] }[]
}
export type Attivita =
  | { tipo: 'quiz'; titolo: string; domande: DomandaQuiz[] }
  | { tipo: 'vf'; titolo: string; affermazioni: { testo: string; vera: boolean }[] }
  | { tipo: 'abbina'; titolo: string; coppie: { a: string; b: string }[] }
  | { tipo: 'completa'; titolo: string; testo: string }
  | { tipo: 'trova'; titolo: string; mappa: MappaConfig; obiettivi: string[] }
  | { tipo: 'etichette'; titolo: string; mappa: MappaConfig; obiettivi: string[] }
  | { tipo: 'flashcard'; titolo: string; carte: { fronte: string; retro: string; assetId?: string }[] }
  | { tipo: 'ordina'; titolo: string; consegna: string; elementi: string[] }
  | { tipo: 'coordinate'; titolo: string; mappa: MappaConfig; punti: PuntoCoordinate[]; tolleranza: number }
  | { tipo: 'grafico'; titolo: string; grafico: DatiGrafico; domande: DomandaQuiz[] }

export type TipoAttivita = Attivita['tipo']

// ---------------- Elementi della tappa ----------------
interface Base {
  id: string
  x: number
  y: number
  w: number
  h: number
}
export type Elemento = Base &
  (
    | { tipo: 'testo'; testo: string; size: number; colore: string; sfondo: string; grassetto: boolean; allinea: 'left' | 'center' | 'right' }
    | { tipo: 'immagine'; assetId?: string; adatta: 'contain' | 'cover' }
    | { tipo: 'video'; youtube?: string; assetId?: string }
    | { tipo: 'audio'; assetId?: string; etichetta: string }
    | { tipo: 'pdf'; assetId?: string }
    | { tipo: 'hotspot'; titolo: string; testo: string; assetId?: string; colore: string; icona: string }
    | { tipo: 'pulsante'; etichetta: string; colore: string; vaiA?: string; url?: string }
    | { tipo: 'mappa'; mappa: MappaConfig; contenuti: Record<string, ContenutoArea> }
    | { tipo: 'attivita'; attivita: Attivita }
  )

export type TipoElemento = Elemento['tipo']

export interface Tappa {
  id: string
  titolo: string
  sfondo: string
  sfondoAssetId?: string
  elementi: Elemento[]
}

export interface Percorso {
  id: string
  titolo: string
  descrizione: string
  classe: Classe
  tappe: Tappa[]
  creato: number
  aggiornato: number
}

export interface Asset {
  id: string
  nome: string
  mime: string
  blob: Blob
}

export const CLASSI: Record<Classe, { nome: string; tema: string; area: Area; colore: string; chiaro: string; emoji: string }> = {
  1: { nome: '1ª Media', tema: 'Italia', area: 'italia', colore: '#16a34a', chiaro: '#dcfce7', emoji: '🗺️' },
  2: { nome: '2ª Media', tema: 'Europa', area: 'europa', colore: '#2563eb', chiaro: '#dbeafe', emoji: '🏰' },
  3: { nome: '3ª Media', tema: 'Continenti', area: 'mondo', colore: '#ea580c', chiaro: '#ffedd5', emoji: '🌍' },
}

export const NOMI_AREE: Record<Area, string> = { italia: 'Italia', europa: 'Europa', mondo: 'Mondo' }
