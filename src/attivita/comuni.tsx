import type { ReactNode } from 'react'
import type { Risultato } from './correzione'
import { NOMI_ATTIVITA } from '../lib/fabbrica'
import type { TipoAttivita } from '../types'

export interface PropsAttivita<T> {
  att: T
  onRisultato?: (r: Risultato) => void
  /** anteprima nell'editor: niente interazione */
  statico?: boolean
}

export function Cornice({ tipo, titolo, risultato, children, piede, sottotitolo }: {
  tipo: TipoAttivita
  titolo: string
  risultato?: Risultato | null
  children: ReactNode
  piede?: ReactNode
  sottotitolo?: string
}) {
  const info = NOMI_ATTIVITA[tipo]
  return (
    <div className="w-full h-full flex flex-col bg-white rounded-2xl shadow-lg border-2 border-indigo-100 overflow-hidden text-slate-800">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border-b border-indigo-100">
        <span className="text-2xl">{info.icona}</span>
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-lg leading-tight truncate">{titolo}</div>
          {sottotitolo && <div className="text-xs text-indigo-700/70">{sottotitolo}</div>}
        </div>
        {risultato && <Punteggio r={risultato} />}
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-4">{children}</div>
      {piede && <div className="flex items-center gap-2 px-4 py-2.5 border-t border-slate-100 bg-slate-50">{piede}</div>}
    </div>
  )
}

export function Punteggio({ r }: { r: Risultato }) {
  const perc = r.max ? r.punti / r.max : 0
  const colore = perc >= 0.8 ? 'bg-emerald-500' : perc >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'
  const emoji = perc === 1 ? '🏆' : perc >= 0.8 ? '🎉' : perc >= 0.5 ? '👍' : '💪'
  return (
    <span className={'px-3 py-1 rounded-full text-white font-bold text-sm shadow ' + colore}>
      {emoji} {r.punti}/{r.max}
    </span>
  )
}

export function BottoneVerifica({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return <button className="btn bg-emerald-600 text-white hover:bg-emerald-700 text-base px-5 py-2" onClick={onClick} disabled={disabled}>✔ Verifica</button>
}

export function BottoneRiprova({ onClick }: { onClick: () => void }) {
  return <button className="btn-secondario text-base px-4 py-2" onClick={onClick}>↻ Riprova</button>
}

export const classeEsito = (esito: boolean | null | undefined) =>
  esito === true ? 'border-emerald-500 bg-emerald-50' : esito === false ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'
