import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Finestra di dialogo piccola (condivisione, conferme), si chiude con Esc o cliccando fuori */
export function Dialogo({ titolo, children, onClose, piede, largo }: { titolo: ReactNode; children: ReactNode; onClose: () => void; piede?: ReactNode; largo?: boolean }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  return createPortal(
    <div className="fixed inset-0 z-[150] bg-slate-900/60 grid place-items-center p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" className={'bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-800 ' + (largo ? 'max-w-2xl' : 'max-w-lg')} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-200">
          <h2 className="text-lg font-extrabold flex-1">{titolo}</h2>
          <button className="w-10 h-10 rounded-full hover:bg-slate-100 text-xl" onClick={onClose} aria-label="Chiudi">✕</button>
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-5">{children}</div>
        {piede && <div className="px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2 bg-slate-50">{piede}</div>}
      </div>
    </div>,
    document.body,
  )
}
