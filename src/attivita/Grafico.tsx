import { useMemo } from 'react'
import type { Attivita, DatiGrafico } from '../types'
import type { PropsAttivita } from './comuni'
import { Quiz } from './Quiz'
import { conUnita, formatta } from '../lib/numeri'

type Att = Extract<Attivita, { tipo: 'grafico' }>

const COLORI = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9', '#a855f7', '#84cc16', '#f97316', '#14b8a6', '#ec4899', '#64748b', '#eab308']
const INCHIOSTRO = '#334155'
const GRIGLIA = '#e2e8f0'

/** Estremo "tondo" dell'asse e passo delle tacche (1, 2, 5 o 10 per una potenza di dieci) */
export function scalaAsse(max: number, tacche = 5): { max: number; passo: number } {
  if (!(max > 0)) return { max: 1, passo: 0.2 }
  const grezzo = max / tacche
  const p = 10 ** Math.floor(Math.log10(grezzo))
  const f = grezzo / p
  const passo = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p
  return { max: Math.ceil(max / passo - 1e-9) * passo, passo }
}

const W = 520
const H = 340

/** Il testo che descrive il grafico a chi usa un lettore di schermo */
export function descrizioneGrafico(d: DatiGrafico): string {
  const c = d.colonne[0]
  const righe = d.righe.map((r) => `${r.etichetta}: ${r.valori.map((v, i) => conUnita(v, d.colonne[i]?.unita ?? '')).join(', ')}`).join('; ')
  return `${d.titolo ?? 'Grafico'}${c ? ` (${c.nome})` : ''}. ${righe}`
}

function Tacche({ x0, x1, y, valore, formato }: { x0: number; x1: number; y: number; valore: number; formato?: (v: number) => string }) {
  return (
    <g>
      <line x1={x0} x2={x1} y1={y} y2={y} stroke={GRIGLIA} />
      <text x={x0 - 6} y={y + 4} fontSize={12} textAnchor="end" fill={INCHIOSTRO}>{(formato ?? formatta)(valore)}</text>
    </g>
  )
}

function Istogramma({ d }: { d: DatiGrafico }) {
  const valori = d.righe.map((r) => r.valori[0] ?? 0)
  const { max, passo } = scalaAsse(Math.max(...valori, 0))
  const lungo = d.righe.length > 6 || d.righe.some((r) => r.etichetta.length > 9)
  const m = { l: 52, r: 12, t: 26, b: lungo ? 78 : 44 }
  const pw = W - m.l - m.r
  const ph = H - m.t - m.b
  const y = (v: number) => m.t + ph - (v / max) * ph
  const banda = pw / Math.max(1, d.righe.length)
  const tacche = Array.from({ length: Math.round(max / passo) + 1 }, (_, i) => i * passo)
  return (
    <>
      {tacche.map((t) => <Tacche key={t} x0={m.l} x1={W - m.r} y={y(t)} valore={t} />)}
      <text x={m.l - 40} y={m.t - 10} fontSize={12} fill={INCHIOSTRO} fontWeight={700}>{d.colonne[0]?.nome}{d.colonne[0]?.unita ? ` (${d.colonne[0].unita})` : ''}</text>
      {d.righe.map((r, i) => {
        const v = valori[i]
        const cx = m.l + banda * (i + 0.5)
        const bw = Math.min(54, banda * 0.66)
        return (
          <g key={i}>
            <rect x={cx - bw / 2} y={y(v)} width={bw} height={Math.max(0, y(0) - y(v))} fill={COLORI[i % COLORI.length]} rx={3} />
            <text x={cx} y={y(v) - 5} fontSize={12} fontWeight={700} textAnchor="middle" fill={INCHIOSTRO}>{formatta(v)}</text>
            <text x={cx} y={H - m.b + 16} fontSize={12} fill={INCHIOSTRO} textAnchor={lungo ? 'end' : 'middle'}
              transform={lungo ? `rotate(-35 ${cx} ${H - m.b + 16})` : undefined}>{r.etichetta}</text>
          </g>
        )
      })}
      <line x1={m.l} x2={W - m.r} y1={y(0)} y2={y(0)} stroke={INCHIOSTRO} />
    </>
  )
}

function Barre({ d }: { d: DatiGrafico }) {
  const valori = d.righe.map((r) => r.valori[0] ?? 0)
  const { max, passo } = scalaAsse(Math.max(...valori, 0))
  const etMax = Math.max(...d.righe.map((r) => r.etichetta.length), 4)
  const m = { l: Math.min(170, etMax * 7 + 14), r: 56, t: 30, b: 34 }
  const pw = W - m.l - m.r
  const ph = H - m.t - m.b
  const x = (v: number) => m.l + (v / max) * pw
  const banda = ph / Math.max(1, d.righe.length)
  const tacche = Array.from({ length: Math.round(max / passo) + 1 }, (_, i) => i * passo)
  return (
    <>
      <text x={m.l} y={16} fontSize={12} fill={INCHIOSTRO} fontWeight={700}>{d.colonne[0]?.nome}{d.colonne[0]?.unita ? ` (${d.colonne[0].unita})` : ''}</text>
      {tacche.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={m.t} y2={H - m.b} stroke={GRIGLIA} />
          <text x={x(t)} y={H - m.b + 16} fontSize={12} textAnchor="middle" fill={INCHIOSTRO}>{formatta(t)}</text>
        </g>
      ))}
      {d.righe.map((r, i) => {
        const cy = m.t + banda * (i + 0.5)
        const bh = Math.min(30, banda * 0.7)
        return (
          <g key={i}>
            <text x={m.l - 8} y={cy + 4} fontSize={12} textAnchor="end" fill={INCHIOSTRO}>{r.etichetta}</text>
            <rect x={m.l} y={cy - bh / 2} width={Math.max(0, x(valori[i]) - m.l)} height={bh} fill={COLORI[i % COLORI.length]} rx={3} />
            <text x={x(valori[i]) + 5} y={cy + 4} fontSize={12} fontWeight={700} fill={INCHIOSTRO}>{formatta(valori[i])}</text>
          </g>
        )
      })}
      <line x1={m.l} x2={m.l} y1={m.t} y2={H - m.b} stroke={INCHIOSTRO} />
    </>
  )
}

function Torta({ d }: { d: DatiGrafico }) {
  const valori = d.righe.map((r) => Math.max(0, r.valori[0] ?? 0))
  const tot = valori.reduce((a, b) => a + b, 0) || 1
  const cx = 150
  const cy = H / 2
  const R = 118
  let a0 = -Math.PI / 2
  const punto = (a: number, r: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  const unita = d.colonne[0]?.unita ?? ''
  return (
    <>
      {valori.map((v, i) => {
        const a1 = a0 + (v / tot) * Math.PI * 2
        const [x0, y0] = punto(a0, R)
        const [x1, y1] = punto(a1, R)
        const grande = a1 - a0 > Math.PI ? 1 : 0
        const [tx, ty] = punto((a0 + a1) / 2, R * 0.62)
        const p = Math.round((v / tot) * 100)
        const fetta = valori.length === 1 || v / tot > 0.9999
          ? <circle cx={cx} cy={cy} r={R} fill={COLORI[i % COLORI.length]} />
          : <path d={`M${cx} ${cy} L${x0} ${y0} A${R} ${R} 0 ${grande} 1 ${x1} ${y1} Z`} fill={COLORI[i % COLORI.length]} stroke="#fff" strokeWidth={2} />
        a0 = a1
        return (
          <g key={i}>
            {fetta}
            {p >= 6 && <text x={tx} y={ty + 5} fontSize={14} fontWeight={800} textAnchor="middle" fill="#fff" stroke="#0f172a55" strokeWidth={0.5}>{p}%</text>}
          </g>
        )
      })}
      {d.righe.map((r, i) => (
        <g key={i} transform={`translate(300 ${46 + i * 26})`}>
          <rect width={16} height={16} rx={3} fill={COLORI[i % COLORI.length]} />
          <text x={24} y={13} fontSize={13} fill={INCHIOSTRO}>{r.etichetta}: <tspan fontWeight={700}>{conUnita(valori[i], unita)}</tspan></text>
        </g>
      ))}
    </>
  )
}

/** Diagramma di Walter-Lieth: precipitazioni (barre, 2 mm per ogni °C) e temperature (linea) mese per mese */
function Climogramma({ d }: { d: DatiGrafico }) {
  const prec = d.righe.map((r) => r.valori[0] ?? 0)
  const temp = d.righe.map((r) => r.valori[1] ?? 0)
  const passo = 5
  const alto = Math.max(Math.ceil(Math.max(...temp, ...prec.map((p) => p / 2)) / passo) * passo, passo)
  const basso = Math.min(0, Math.floor(Math.min(...temp) / passo) * passo)
  const m = { l: 46, r: 52, t: 34, b: 34 }
  const pw = W - m.l - m.r
  const ph = H - m.t - m.b
  const y = (t: number) => m.t + ph - ((t - basso) / (alto - basso)) * ph
  const banda = pw / Math.max(1, d.righe.length)
  const cx = (i: number) => m.l + banda * (i + 0.5)
  const tacche = Array.from({ length: (alto - basso) / passo + 1 }, (_, i) => basso + i * passo)
  const linea = temp.map((t, i) => `${i ? 'L' : 'M'}${cx(i)} ${y(t)}`).join(' ')
  return (
    <>
      <text x={m.l - 40} y={m.t - 16} fontSize={12} fontWeight={700} fill="#dc2626">{d.colonne[1]?.unita ?? '°C'}</text>
      <text x={W - m.r + 8} y={m.t - 16} fontSize={12} fontWeight={700} fill="#2563eb">{d.colonne[0]?.unita ?? 'mm'}</text>
      {tacche.map((t) => (
        <g key={t}>
          <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? INCHIOSTRO : GRIGLIA} />
          <text x={m.l - 6} y={y(t) + 4} fontSize={12} textAnchor="end" fill="#dc2626">{t}</text>
          <text x={W - m.r + 6} y={y(t) + 4} fontSize={12} fill="#2563eb">{t * 2}</text>
        </g>
      ))}
      {d.righe.map((r, i) => {
        const bw = banda * 0.6
        const alt = Math.max(0, y(0) - y(prec[i] / 2))
        return (
          <g key={i}>
            <rect x={cx(i) - bw / 2} y={y(0) - alt} width={bw} height={alt} fill="#60a5fa" opacity={0.85} />
            <text x={cx(i)} y={H - m.b + 16} fontSize={12} textAnchor="middle" fill={INCHIOSTRO}>{r.etichetta}</text>
          </g>
        )
      })}
      <path d={linea} fill="none" stroke="#dc2626" strokeWidth={3} strokeLinejoin="round" />
      {temp.map((t, i) => <circle key={i} cx={cx(i)} cy={y(t)} r={3.5} fill="#dc2626" />)}
    </>
  )
}

function Tabella({ d }: { d: DatiGrafico }) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-indigo-50 text-indigo-900">
          <th className="text-left px-2 py-1.5 border border-indigo-100" />
          {d.colonne.map((c, k) => <th key={k} className="px-2 py-1.5 border border-indigo-100 text-right">{c.nome}{c.unita ? <span className="font-normal"> ({c.unita})</span> : null}</th>)}
        </tr>
      </thead>
      <tbody>
        {d.righe.map((r, i) => (
          <tr key={i} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
            <th className="text-left px-2 py-1.5 border border-slate-200 font-semibold">{r.etichetta}</th>
            {d.colonne.map((_, k) => <td key={k} className="px-2 py-1.5 border border-slate-200 text-right tabular-nums">{r.valori[k] === undefined ? '' : formatta(r.valori[k])}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Il grafico (o la tabella) con la sua didascalia */
export function GraficoVista({ dati }: { dati: DatiGrafico }) {
  const vuoto = !dati.righe.length
  return (
    <figure className="m-0 rounded-xl border border-slate-200 bg-white p-2">
      {dati.titolo && <figcaption className="text-center font-bold text-slate-700 mb-1">{dati.titolo}</figcaption>}
      {vuoto ? <p className="text-slate-500 p-4">Aggiungi i dati nel pannello delle proprietà.</p>
        : dati.forma === 'tabella' ? <Tabella d={dati} />
          : (
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={descrizioneGrafico(dati)}>
              {dati.forma === 'istogramma' && <Istogramma d={dati} />}
              {dati.forma === 'barre' && <Barre d={dati} />}
              {dati.forma === 'torta' && <Torta d={dati} />}
              {dati.forma === 'climogramma' && <Climogramma d={dati} />}
            </svg>
          )}
      {dati.forma === 'climogramma' && !vuoto && (
        <div className="flex justify-center gap-4 text-xs text-slate-600 mt-1">
          <span><span className="inline-block w-3 h-3 align-middle mr-1 bg-blue-400" />Precipitazioni (mm)</span>
          <span><span className="inline-block w-4 h-0.5 align-middle mr-1 bg-red-600" />Temperatura (°C)</span>
        </div>
      )}
    </figure>
  )
}

export function Grafico({ att, onRisultato, statico }: PropsAttivita<Att>) {
  const quiz = useMemo(() => ({ tipo: 'quiz' as const, titolo: att.titolo, domande: att.domande }), [att.titolo, att.domande])
  return <Quiz att={quiz} onRisultato={onRisultato} statico={statico} tipoCornice="grafico" sopra={<GraficoVista dati={att.grafico} />} />
}
