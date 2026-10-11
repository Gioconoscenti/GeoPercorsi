import { useEffect, useRef, useState } from 'react'

/** Penna ed evidenziatore sopra la tappa, per la LIM. Il disegno si cancella cambiando tappa. */
interface Tratto { colore: string; spessore: number; alfa: number; punti: [number, number][] }

const STRUMENTI = [
  { id: 'rosso', nome: 'Penna rossa', colore: '#dc2626', spessore: 4, alfa: 1 },
  { id: 'blu', nome: 'Penna blu', colore: '#2563eb', spessore: 4, alfa: 1 },
  { id: 'nero', nome: 'Penna nera', colore: '#0f172a', spessore: 4, alfa: 1 },
  { id: 'evid', nome: 'Evidenziatore', colore: '#facc15', spessore: 22, alfa: 0.4 },
] as const

export function Lavagna({ onChiudi }: { onChiudi: () => void }) {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const tratti = useRef<Tratto[]>([])
  const corrente = useRef<Tratto | null>(null)
  const [strumento, setStrumento] = useState<(typeof STRUMENTI)[number]>(STRUMENTI[0])
  const [quanti, setQuanti] = useState(0)

  const ridisegna = () => {
    const c = canvas.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    ctx.clearRect(0, 0, c.width, c.height)
    const s = window.devicePixelRatio || 1
    for (const t of [...tratti.current, ...(corrente.current ? [corrente.current] : [])]) {
      if (!t.punti.length) continue
      ctx.globalAlpha = t.alfa
      ctx.strokeStyle = t.colore
      ctx.lineWidth = t.spessore * s
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      // i punti sono in frazioni della larghezza/altezza: il disegno resta al suo posto se la finestra cambia
      t.punti.forEach(([x, y], k) => (k ? ctx.lineTo(x * c.width, y * c.height) : ctx.moveTo(x * c.width, y * c.height)))
      if (t.punti.length === 1) ctx.lineTo(t.punti[0][0] * c.width + 0.1, t.punti[0][1] * c.height)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const c = canvas.current
      if (!c) return
      const s = window.devicePixelRatio || 1
      c.width = Math.round(e.contentRect.width * s)
      c.height = Math.round(e.contentRect.height * s)
      ridisegna()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const punto = (e: React.PointerEvent): [number, number] => {
    const r = canvas.current!.getBoundingClientRect()
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]
  }

  return (
    <div ref={box} className="absolute inset-0 z-30">
      <canvas ref={canvas} className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          corrente.current = { colore: strumento.colore, spessore: strumento.spessore, alfa: strumento.alfa, punti: [punto(e)] }
          ridisegna()
        }}
        onPointerMove={(e) => {
          if (!corrente.current) return
          corrente.current.punti.push(punto(e))
          ridisegna()
        }}
        onPointerUp={() => {
          if (corrente.current) tratti.current.push(corrente.current)
          corrente.current = null
          setQuanti(tratti.current.length)
        }} />
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/95 rounded-2xl shadow-xl px-2 py-1.5">
        {STRUMENTI.map((s) => (
          <button key={s.id} onClick={() => setStrumento(s)} title={s.nome} aria-label={s.nome} aria-pressed={strumento.id === s.id}
            className={'w-11 h-11 rounded-xl grid place-items-center ' + (strumento.id === s.id ? 'ring-2 ring-slate-900 bg-slate-100' : 'hover:bg-slate-100')}>
            <span className="rounded-full" style={{ background: s.colore, opacity: s.alfa < 1 ? 0.7 : 1, width: s.id === 'evid' ? 26 : 18, height: s.id === 'evid' ? 12 : 18 }} />
          </button>
        ))}
        <div className="w-px h-8 bg-slate-200 mx-1" />
        <button className="btn-ghost h-11" disabled={!quanti} onClick={() => { tratti.current.pop(); setQuanti(tratti.current.length); ridisegna() }} aria-label="Togli l’ultimo segno">↶</button>
        <button className="btn-ghost h-11" disabled={!quanti} onClick={() => { tratti.current = []; setQuanti(0); ridisegna() }}>🧽 Cancella</button>
        <button className="btn-primario h-11" onClick={onChiudi}>✓ Fine</button>
      </div>
    </div>
  )
}
