import { useEffect, useRef, useState, type ReactNode } from 'react'
import { STAGE_H, STAGE_W, type Tappa } from '../types'
import { useAssetUrl } from '../lib/runtime'
import { ElementoView, type Modo } from '../elementi/ElementoView'
import type { Risultato } from '../attivita/correzione'

export function useDimensioni<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [dim, setDim] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setDim({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { ref, ...dim }
}

/** Sfondo della tappa (colore + immagine) */
export function SfondoTappa({ tappa }: { tappa: Tappa }) {
  const img = useAssetUrl(tappa.sfondoAssetId)
  return <div className="absolute inset-0" style={{ background: tappa.sfondo, backgroundImage: img ? `url(${img})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }} />
}

/** Contenitore 16:9 scalato per riempire lo spazio disponibile */
export function Scalato({ children, className }: { children: (scala: number) => ReactNode; className?: string }) {
  const { ref, w, h } = useDimensioni<HTMLDivElement>()
  const scala = w && h ? Math.min(w / STAGE_W, h / STAGE_H) : 0
  return (
    <div ref={ref} className={'relative w-full h-full overflow-hidden ' + (className ?? '')}>
      {scala > 0 && (
        <div className="absolute" style={{ width: STAGE_W, height: STAGE_H, left: (w - STAGE_W * scala) / 2, top: (h - STAGE_H * scala) / 2, transform: `scale(${scala})`, transformOrigin: '0 0' }}>
          {children(scala)}
        </div>
      )}
    </div>
  )
}

interface PropsPalco {
  tappa: Tappa
  modo: Modo
  onVai?: (id: string) => void
  onRisultato?: (elId: string, r: Risultato) => void
}

export function Palco({ tappa, modo, onVai, onRisultato }: PropsPalco) {
  const { ref, w } = useDimensioni<HTMLDivElement>()
  const verticale = modo === 'alunno' && w > 0 && w < 720
  return (
    <div ref={ref} className="w-full h-full">
      {w > 0 && (verticale ? (
        <PalcoVerticale tappa={tappa} modo={modo} onVai={onVai} onRisultato={onRisultato} />
      ) : (
        <Scalato className="bg-slate-800">
          {() => (
            <div className="relative w-full h-full overflow-hidden shadow-2xl">
              <SfondoTappa tappa={tappa} />
              {tappa.elementi.map((el) => (
                <div key={el.id} className="absolute" style={{ left: el.x, top: el.y, width: el.w, height: el.h }}>
                  <ElementoView el={el} modo={modo} onVai={onVai} onRisultato={(r) => onRisultato?.(el.id, r)} />
                </div>
              ))}
            </div>
          )}
        </Scalato>
      ))}
    </div>
  )
}

/** Su schermi stretti (telefono) gli elementi vengono impilati uno sotto l'altro */
function PalcoVerticale({ tappa, modo, onVai, onRisultato }: PropsPalco) {
  const elementi = [...tappa.elementi].sort((a, b) => a.y - b.y || a.x - b.x)
  return (
    <div className="relative w-full h-full overflow-auto">
      <SfondoTappa tappa={tappa} />
      <div className="relative flex flex-col gap-3 p-3">
        {elementi.map((el) => {
          let style: React.CSSProperties
          if (el.tipo === 'testo') style = {}
          else if (el.tipo === 'attivita') style = { height: el.attivita.tipo === 'trova' || el.attivita.tipo === 'etichette' ? 520 : 460 }
          else if (el.tipo === 'mappa') style = { height: 420 }
          else if (el.tipo === 'hotspot') style = { width: 56, height: 56 }
          else if (el.tipo === 'pulsante') style = { height: 56 }
          else style = { aspectRatio: `${el.w} / ${el.h}` }
          const contenuto = el.tipo === 'testo' ? { ...el, size: Math.max(16, Math.min(el.size * 0.6, 34)) } : el
          return (
            <div key={el.id} className="relative w-full" style={style}>
              <ElementoView el={contenuto} modo={modo} onVai={onVai} onRisultato={(r) => onRisultato?.(el.id, r)} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
