import { useEffect, useState } from 'react'

/** Avvisi brevi in basso, con un'azione facoltativa (es. "Annulla") al posto dei confirm() */
interface Avviso {
  id: number
  testo: string
  tipo: 'info' | 'errore'
  azione?: { etichetta: string; fn: () => void }
}

let prossimo = 1
let avvisi: Avviso[] = []
const ascoltatori = new Set<(a: Avviso[]) => void>()
const notifica = () => ascoltatori.forEach((f) => f(avvisi))

export function chiudiToast(id: number) {
  avvisi = avvisi.filter((a) => a.id !== id)
  notifica()
}

export function toast(testo: string, opz: { azione?: Avviso['azione']; errore?: boolean; durata?: number } = {}) {
  const id = prossimo++
  // al massimo tre avvisi insieme
  avvisi = [...avvisi.slice(-2), { id, testo, tipo: opz.errore ? 'errore' : 'info', azione: opz.azione }]
  notifica()
  setTimeout(() => chiudiToast(id), opz.durata ?? (opz.azione ? 8000 : 4000))
  return id
}

export function Toasts() {
  const [lista, setLista] = useState(avvisi)
  useEffect(() => {
    ascoltatori.add(setLista)
    return () => { ascoltatori.delete(setLista) }
  }, [])
  if (!lista.length) return null
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center gap-2 w-[min(36rem,calc(100%-2rem))] print:hidden" role="status" aria-live="polite">
      {lista.map((a) => (
        <div key={a.id} className={'w-full flex items-center gap-3 rounded-xl shadow-xl px-4 py-3 text-sm font-semibold ' + (a.tipo === 'errore' ? 'bg-rose-700 text-white' : 'bg-slate-900 text-white')}>
          <span className="flex-1">{a.testo}</span>
          {a.azione && (
            <button className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 font-bold" onClick={() => { a.azione!.fn(); chiudiToast(a.id) }}>
              {a.azione.etichetta}
            </button>
          )}
          <button className="w-8 h-8 rounded-lg hover:bg-white/15 text-white/70" aria-label="Chiudi avviso" onClick={() => chiudiToast(a.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}
