import { useEffect, useRef, useState } from 'react'
import type { EditorApi } from './Editor'
import { Scalato, SfondoTappa } from '../player/Palco'
import { ElementoView } from '../elementi/ElementoView'
import { STAGE_H, STAGE_W, type Elemento } from '../types'
import { elementoDaFile } from './media'

type Maniglia = 'sposta' | 'nw' | 'ne' | 'sw' | 'se' | 'e' | 's'
const MIN = 24
const snap = (v: number) => Math.round(v / 4) * 4

export function Tela({ api }: { api: EditorApi }) {
  const apiRef = useRef(api)
  apiRef.current = api
  const scalaRef = useRef(1)
  const palcoRef = useRef<HTMLDivElement>(null)
  const [trascina, setTrascina] = useState<null | { id: string; m: Maniglia; px: number; py: number; e: Elemento }>(null)
  const [modificaTesto, setModificaTesto] = useState<string | null>(null)
  const [sopra, setSopra] = useState(false)

  useEffect(() => {
    if (!trascina) return
    const move = (ev: PointerEvent) => {
      const s = scalaRef.current
      const dx = (ev.clientX - trascina.px) / s
      const dy = (ev.clientY - trascina.py) / s
      const e = trascina.e
      let { x, y, w, h } = e
      if (trascina.m === 'sposta') { x = e.x + dx; y = e.y + dy }
      if (trascina.m.includes('e')) w = Math.max(MIN, e.w + dx)
      if (trascina.m.includes('s')) h = Math.max(MIN, e.h + dy)
      if (trascina.m.includes('w')) { w = Math.max(MIN, e.w - dx); x = e.x + e.w - w }
      if (trascina.m.includes('n') ) { h = Math.max(MIN, e.h - dy); y = e.y + e.h - h }
      // gli hotspot restano rotondi
      if (e.tipo === 'hotspot' && trascina.m !== 'sposta') { const l = Math.max(w, h); w = l; h = l }
      apiRef.current.aggiornaElemento(e.id, { x: snap(x), y: snap(y), w: snap(w), h: snap(h) })
    }
    const up = () => setTrascina(null)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [trascina])

  const inizia = (ev: React.PointerEvent, e: Elemento, m: Maniglia) => {
    if (ev.button !== 0) return
    ev.stopPropagation()
    api.seleziona(e.id)
    setTrascina({ id: e.id, m, px: ev.clientX, py: ev.clientY, e })
  }

  const drop = async (ev: React.DragEvent) => {
    ev.preventDefault()
    setSopra(false)
    const r = palcoRef.current?.getBoundingClientRect()
    if (!r) return
    const s = scalaRef.current
    let i = 0
    for (const f of Array.from(ev.dataTransfer.files)) {
      const el = await elementoDaFile(f, { x: (ev.clientX - r.left) / s + i * 30, y: (ev.clientY - r.top) / s + i * 30 })
      if (el) { api.aggiungiElemento(el); i++ }
    }
  }

  return (
    <div className="w-full h-full relative" onDragOver={(e) => { e.preventDefault(); setSopra(true) }} onDragLeave={() => setSopra(false)} onDrop={drop}>
      <Scalato>
        {(scala) => {
          scalaRef.current = scala
          return (
            <div ref={palcoRef} className="relative w-full h-full shadow-xl bg-white" style={{ width: STAGE_W, height: STAGE_H }}
              onPointerDown={() => { api.seleziona(null); setModificaTesto(null) }}>
              <SfondoTappa tappa={api.tappa} />
              {api.tappa.elementi.map((e) => {
                const sel = api.selezionato?.id === e.id
                const inModifica = modificaTesto === e.id && e.tipo === 'testo'
                return (
                  <div key={e.id} className="absolute" style={{ left: e.x, top: e.y, width: e.w, height: e.h }}>
                    {inModifica ? (
                      <textarea autoFocus value={e.testo} onPointerDown={(ev) => ev.stopPropagation()}
                        onChange={(ev) => api.aggiornaElemento(e.id, { testo: ev.target.value } as never)}
                        onBlur={() => setModificaTesto(null)}
                        className="w-full h-full resize-none outline-2 outline-indigo-500 rounded-xl leading-snug"
                        style={{ fontSize: e.size, color: e.colore, background: e.sfondo === 'transparent' ? 'rgba(255,255,255,0.7)' : e.sfondo, fontWeight: e.grassetto ? 800 : 400, textAlign: e.allinea }} />
                    ) : (
                      <>
                        <div className="w-full h-full pointer-events-none"><ElementoView el={e} modo="editor" /></div>
                        <div className={'absolute inset-0 cursor-move rounded ' + (sel ? 'outline-2 outline-indigo-500' : 'hover:outline-2 hover:outline-indigo-300 hover:outline-dashed')}
                          style={{ outlineWidth: 2 / scala }}
                          onPointerDown={(ev) => inizia(ev, e, 'sposta')}
                          onDoubleClick={() => e.tipo === 'testo' && setModificaTesto(e.id)} />
                      </>
                    )}
                    {sel && !inModifica && (['nw', 'ne', 'sw', 'se', 'e', 's'] as Maniglia[]).map((m) => (
                      <div key={m} onPointerDown={(ev) => inizia(ev, e, m)}
                        className="absolute bg-white border-2 border-indigo-500 rounded-sm"
                        style={{
                          width: 12 / scala, height: 12 / scala,
                          left: m.includes('w') ? -6 / scala : m.includes('e') ? `calc(100% - ${6 / scala}px)` : `calc(50% - ${6 / scala}px)`,
                          top: m.includes('n') ? -6 / scala : m.includes('s') ? `calc(100% - ${6 / scala}px)` : `calc(50% - ${6 / scala}px)`,
                          cursor: { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', e: 'ew-resize', s: 'ns-resize', sposta: 'move' }[m],
                        }} />
                    ))}
                  </div>
                )
              })}
              {api.tappa.elementi.length === 0 && (
                <div className="absolute inset-0 grid place-items-center pointer-events-none text-slate-400 text-center">
                  <div>
                    <div className="text-6xl">✨</div>
                    <div className="text-2xl font-bold mt-2">Tappa vuota</div>
                    <div className="text-lg">Aggiungi elementi dalla barra in alto, trascina qui immagini, PDF, audio e video,<br />oppure usa “Genera dalla mappa”.</div>
                  </div>
                </div>
              )}
            </div>
          )
        }}
      </Scalato>
      {sopra && <div className="absolute inset-0 border-4 border-dashed border-indigo-500 bg-indigo-500/10 rounded-xl grid place-items-center text-indigo-800 text-xl font-bold pointer-events-none">Rilascia qui i file</div>}
    </div>
  )
}
