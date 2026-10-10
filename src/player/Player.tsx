import { useCallback, useEffect, useMemo, useState } from 'react'
import { CLASSI, type Percorso } from '../types'
import { Palco } from './Palco'
import { puntiMassimi, type Risultato } from '../attivita/correzione'
import { Punteggio } from '../attivita/comuni'
import { conPunteggio } from '../attivita/AttivitaView'
import { IconaClasse } from '../ui/IconaClasse'

export type ModoPlayer = 'lim' | 'alunno'

export function Player({ percorso, modo, onEsci }: { percorso: Percorso; modo: ModoPlayer; onEsci?: () => void }) {
  const [i, setI] = useState(0)
  const [risultati, setRisultati] = useState<Record<string, Risultato>>({})
  const [nome, setNome] = useState('')
  const [fase, setFase] = useState<'inizio' | 'percorso' | 'fine'>(modo === 'alunno' ? 'inizio' : 'percorso')
  const tappa = percorso.tappe[i]
  const n = percorso.tappe.length
  const cl = CLASSI[percorso.classe]

  const vai = useCallback((k: number) => setI(Math.max(0, Math.min(n - 1, k))), [n])
  const vaiA = (id: string) => {
    const k = percorso.tappe.findIndex((t) => t.id === id)
    if (k >= 0) setI(k)
  }

  useEffect(() => {
    if (fase !== 'percorso') return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowRight' || e.key === 'PageDown') vai(i + 1)
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') vai(i - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [i, vai, fase])

  // attività con punteggio, nell'ordine del percorso
  const attivita = useMemo(
    () => percorso.tappe.flatMap((t) => t.elementi.filter((e) => e.tipo === 'attivita' && conPunteggio(e.attivita)).map((e) => ({ tappa: t, el: e as Extract<typeof e, { tipo: 'attivita' }> }))),
    [percorso],
  )
  const totale = attivita.reduce((s, a) => {
    const r = risultati[a.el.id]
    return { punti: s.punti + (r?.punti ?? 0), max: s.max + (r?.max ?? puntiMassimi(a.el.attivita)) }
  }, { punti: 0, max: 0 })

  if (fase === 'inizio') {
    return (
      <div className="h-full grid place-items-center p-4" style={{ background: `linear-gradient(135deg, ${cl.chiaro}, #fff)` }}>
        <div className="card p-8 max-w-md w-full text-center">
          <div className="flex justify-center"><IconaClasse classe={percorso.classe} size={84} /></div>
          <div className="text-sm font-bold uppercase tracking-wide mt-2" style={{ color: cl.colore }}>{cl.nome} · {cl.tema}</div>
          <h1 className="text-3xl font-extrabold mt-1">{percorso.titolo}</h1>
          {percorso.descrizione && <p className="text-slate-600 mt-2">{percorso.descrizione}</p>}
          <form className="mt-6 flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); setFase('percorso') }}>
            <input className="campo text-lg text-center py-2.5" placeholder="Scrivi il tuo nome e cognome" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
            <button className="btn text-white text-lg justify-center py-3" style={{ background: cl.colore }} disabled={!nome.trim()}>Inizia il percorso ➜</button>
          </form>
          {onEsci && <button className="btn-ghost mt-3" onClick={onEsci}>← Torna indietro</button>}
        </div>
      </div>
    )
  }

  if (fase === 'fine') {
    return <Riepilogo percorso={percorso} nome={nome} attivita={attivita} risultati={risultati} totale={totale} onRivedi={() => setFase('percorso')} onEsci={onEsci} />
  }

  return (
    <div className="h-full flex flex-col bg-slate-800">
      <div className="flex-1 min-h-0">
        {tappa ? (
          <Palco key={tappa.id} tappa={tappa} modo={modo} onVai={vaiA} onRisultato={(id, r) => setRisultati((x) => ({ ...x, [id]: r }))} />
        ) : (
          <div className="h-full grid place-items-center text-white">Questo percorso non ha tappe.</div>
        )}
      </div>
      <nav className="print:hidden flex items-center gap-2 px-3 py-2 bg-slate-900 text-white">
        {onEsci && <button className="btn text-slate-300 hover:bg-white/10" onClick={onEsci} title="Esci">✕</button>}
        <div className="min-w-0 hidden sm:block">
          <div className="text-xs text-slate-400 truncate">{percorso.titolo}</div>
          <div className="font-bold truncate">{tappa?.titolo}</div>
        </div>
        <div className="mx-auto flex items-center gap-2">
          <button className="btn bg-white/10 hover:bg-white/20 text-lg px-4" disabled={i === 0} onClick={() => vai(i - 1)}>◀</button>
          <Pallini n={n} i={i} onVai={vai} />
          {i < n - 1 ? (
            <button className="btn bg-white/10 hover:bg-white/20 text-lg px-4" onClick={() => vai(i + 1)}>▶</button>
          ) : modo === 'alunno' ? (
            <button className="btn bg-emerald-600 hover:bg-emerald-500 px-4" onClick={() => setFase('fine')}>Fine 🏁</button>
          ) : (
            <span className="w-12" />
          )}
        </div>
        {modo === 'alunno' && Object.keys(risultati).length > 0 && <Punteggio r={totale} />}
        {modo === 'lim' && <Timer />}
        <button className="btn text-slate-300 hover:bg-white/10" title="Schermo intero" onClick={schermoIntero}>⛶</button>
      </nav>
    </div>
  )
}

function schermoIntero() {
  if (document.fullscreenElement) document.exitFullscreen()
  else document.documentElement.requestFullscreen?.()
}

function Pallini({ n, i, onVai }: { n: number; i: number; onVai: (k: number) => void }) {
  if (n > 14) return <span className="text-sm tabular-nums px-2">{i + 1} / {n}</span>
  return (
    <div className="flex gap-1.5 px-1">
      {Array.from({ length: n }, (_, k) => (
        <button key={k} onClick={() => onVai(k)} title={`Tappa ${k + 1}`}
          className={'w-3 h-3 rounded-full transition ' + (k === i ? 'bg-white scale-125' : k < i ? 'bg-white/60' : 'bg-white/25 hover:bg-white/50')} />
      ))}
    </div>
  )
}

/** Timer per la LIM (conto alla rovescia) */
function Timer() {
  const [sec, setSec] = useState<number | null>(null)
  const [aperto, setAperto] = useState(false)
  useEffect(() => {
    if (sec === null || sec <= 0) return
    const t = setTimeout(() => setSec(sec - 1), 1000)
    return () => clearTimeout(t)
  }, [sec])
  const mm = sec !== null ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : ''
  return (
    <div className="relative">
      <button className={'btn ' + (sec === 0 ? 'bg-rose-600 animate-pulse' : sec ? 'bg-amber-500 text-slate-900' : 'text-slate-300 hover:bg-white/10')} onClick={() => (sec !== null ? setSec(null) : setAperto(!aperto))} title="Timer">
        ⏱ {sec !== null ? (sec === 0 ? 'Tempo!' : mm) : ''}
      </button>
      {aperto && (
        <div className="absolute bottom-12 right-0 bg-white text-slate-800 rounded-xl shadow-xl p-2 flex gap-1 z-50">
          {[1, 2, 3, 5, 10].map((m) => (
            <button key={m} className="btn-secondario" onClick={() => { setSec(m * 60); setAperto(false) }}>{m}′</button>
          ))}
        </div>
      )}
    </div>
  )
}

function Riepilogo({ percorso, nome, attivita, risultati, totale, onRivedi, onEsci }: {
  percorso: Percorso
  nome: string
  attivita: { tappa: Percorso['tappe'][number]; el: { id: string; attivita: { titolo: string } } }[]
  risultati: Record<string, Risultato>
  totale: Risultato
  onRivedi: () => void
  onEsci?: () => void
}) {
  const perc = totale.max ? Math.round((totale.punti / totale.max) * 100) : 0
  const svolte = attivita.filter((a) => risultati[a.el.id]).length
  return (
    <div className="h-full overflow-auto bg-slate-50 p-4">
      <div className="card max-w-2xl mx-auto p-6 print:shadow-none print:border-0">
        <div className="text-center">
          <div className="text-6xl">{perc >= 80 ? '🏆' : perc >= 50 ? '🎉' : '💪'}</div>
          <h1 className="text-3xl font-extrabold mt-2">Percorso completato!</h1>
          <p className="text-slate-600">{percorso.titolo}</p>
          <p className="text-xl font-bold mt-3">{nome}</p>
          <p className="text-sm text-slate-500">{new Date().toLocaleString('it-IT')}</p>
          <div className="text-5xl font-extrabold mt-4" style={{ color: perc >= 80 ? '#059669' : perc >= 50 ? '#d97706' : '#e11d48' }}>{perc}%</div>
          <div className="text-slate-600">{totale.punti} punti su {totale.max} · {svolte} attività svolte su {attivita.length}</div>
        </div>
        <table className="w-full mt-6 text-sm">
          <thead><tr className="text-left text-slate-500 border-b"><th className="py-1">Tappa</th><th>Attività</th><th className="text-right">Punti</th></tr></thead>
          <tbody>
            {attivita.map((a) => {
              const r = risultati[a.el.id]
              return (
                <tr key={a.el.id} className="border-b border-slate-100">
                  <td className="py-1.5">{a.tappa.titolo}</td>
                  <td>{a.el.attivita.titolo}</td>
                  <td className="text-right font-bold">{r ? `${r.punti}/${r.max}` : <span className="text-slate-400 font-normal">non svolta</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="flex flex-wrap gap-2 justify-center mt-6 print:hidden">
          <button className="btn-primario" onClick={() => window.print()}>🖨️ Stampa / salva PDF</button>
          <button className="btn-secondario" onClick={onRivedi}>↩ Torna al percorso</button>
          {onEsci && <button className="btn-ghost" onClick={onEsci}>Esci</button>}
        </div>
      </div>
    </div>
  )
}
