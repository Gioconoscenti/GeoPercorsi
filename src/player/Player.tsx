import { useCallback, useEffect, useMemo, useState } from 'react'
import { CLASSI, type Percorso } from '../types'
import { Palco } from './Palco'
import { Lavagna } from './Lavagna'
import { puntiMassimi, registraTentativo, type Esito, type Risultato } from '../attivita/correzione'
import { Punteggio } from '../attivita/comuni'
import { conPunteggio } from '../attivita/AttivitaView'
import { IconaClasse } from '../ui/IconaClasse'
import { Dialogo } from '../ui/Dialogo'

export type ModoPlayer = 'lim' | 'alunno'

type Fase = 'inizio' | 'percorso' | 'fine'
interface Sessione { nome: string; i: number; esiti: Record<string, Esito>; fase: Fase; quando: number }

// la sessione dell'alunno si salva nel browser: ricaricando la pagina si riprende da dove si era rimasti.
// La chiave cambia se il docente modifica il percorso (i vecchi risultati non varrebbero più)
const chiaveSessione = (p: Percorso) => `geopercorso:${p.id}:${p.aggiornato}`
function leggiSessione(p: Percorso): Sessione | null {
  try {
    const s = JSON.parse(localStorage.getItem(chiaveSessione(p)) ?? 'null') as Sessione | null
    return s && s.nome && s.fase !== 'inizio' ? s : null
  } catch { return null }
}
function scriviSessione(p: Percorso, s: Sessione | null) {
  try {
    if (s) localStorage.setItem(chiaveSessione(p), JSON.stringify(s))
    else localStorage.removeItem(chiaveSessione(p))
  } catch { /* archiviazione non disponibile (es. navigazione privata): si va avanti senza */ }
}

export function Player({ percorso, modo, onEsci }: { percorso: Percorso; modo: ModoPlayer; onEsci?: () => void }) {
  const [i, setI] = useState(0)
  // per ogni attività: primo tentativo (conta per il voto), migliore e numero di tentativi
  const [esiti, setEsiti] = useState<Record<string, Esito>>({})
  const [nome, setNome] = useState('')
  const [fase, setFase] = useState<Fase>(modo === 'alunno' ? 'inizio' : 'percorso')
  const [salvata] = useState(() => (modo === 'alunno' ? leggiSessione(percorso) : null))
  const [mancanti, setMancanti] = useState(false)
  const [indice, setIndice] = useState(false)
  const [penna, setPenna] = useState(false)
  // alla LIM si propone lo schermo intero (il browser lo concede solo dopo un tocco)
  const [proponiSchermo, setProponiSchermo] = useState(() => modo === 'lim' && !document.fullscreenElement && !!document.documentElement.requestFullscreen)
  const tappa = percorso.tappe[i]
  const n = percorso.tappe.length
  const cl = CLASSI[percorso.classe]
  const [visitate, setVisitate] = useState<Set<string>>(() => new Set())
  if (tappa && !visitate.has(tappa.id)) setVisitate(new Set(visitate).add(tappa.id))

  const vai = useCallback((k: number) => { setI(Math.max(0, Math.min(n - 1, k))); setPenna(false) }, [n])
  const vaiA = (id: string) => {
    const k = percorso.tappe.findIndex((t) => t.id === id)
    if (k >= 0) vai(k)
  }

  useEffect(() => {
    if (fase !== 'percorso') return
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return
      const t = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable) return
      // PagGiù/PagSu (anche i telecomandi da presentazione) funzionano sempre;
      // le frecce no, se si sta usando un'attività o una carta
      const dentro = !!t.closest?.('[data-interattivo]')
      if (e.key === 'PageDown' || (e.key === 'ArrowRight' && !dentro)) vai(i + 1)
      if (e.key === 'PageUp' || (e.key === 'ArrowLeft' && !dentro)) vai(i - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [i, vai, fase])

  useEffect(() => {
    if (modo === 'alunno' && fase !== 'inizio' && nome) scriviSessione(percorso, { nome, i, esiti, fase, quando: Date.now() })
  }, [modo, percorso, nome, i, esiti, fase])

  // attività con punteggio, nell'ordine del percorso
  const attivita = useMemo(
    () => percorso.tappe.flatMap((t) => t.elementi.filter((e) => e.tipo === 'attivita' && conPunteggio(e.attivita)).map((e) => ({ tappa: t, el: e as Extract<typeof e, { tipo: 'attivita' }> }))),
    [percorso],
  )
  const somma = (quale: 'primo' | 'migliore') => attivita.reduce((s, a) => {
    const r = esiti[a.el.id]?.[quale]
    return { punti: s.punti + (r?.punti ?? 0), max: s.max + (r?.max ?? puntiMassimi(a.el.attivita)) }
  }, { punti: 0, max: 0 })
  // nel voto conta il primo tentativo: "Riprova" serve per esercitarsi
  const totale = somma('primo')
  const daFare = attivita.filter((a) => !esiti[a.el.id])
  const concludi = () => (daFare.length ? setMancanti(true) : setFase('fine'))

  if (fase === 'inizio') {
    const riprendi = () => {
      if (!salvata) return
      setNome(salvata.nome)
      setEsiti(salvata.esiti)
      setI(Math.min(salvata.i, n - 1))
      setFase(salvata.fase)
    }
    return (
      <div className="h-full grid place-items-center p-4 overflow-auto" style={{ background: `linear-gradient(135deg, ${cl.chiaro}, #fff)` }}>
        <div className="card p-8 max-w-md w-full text-center">
          <div className="flex justify-center"><IconaClasse classe={percorso.classe} size={84} /></div>
          <div className="text-sm font-bold uppercase tracking-wide mt-2" style={{ color: cl.colore }}>{cl.nome} · {cl.tema}</div>
          <h1 className="text-3xl font-extrabold mt-1">{percorso.titolo}</h1>
          {percorso.descrizione && <p className="text-slate-600 mt-2">{percorso.descrizione}</p>}
          {salvata && (
            <div className="mt-6 rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4">
              <div className="text-sm text-indigo-900">Hai già iniziato questo percorso come <b>{salvata.nome}</b> ({new Date(salvata.quando).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}).</div>
              <button className="btn-primario justify-center w-full text-lg py-3 mt-3" onClick={riprendi}>↻ Riprendi da dove eri rimasto</button>
            </div>
          )}
          <form className="mt-6 flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); scriviSessione(percorso, null); setFase('percorso') }}>
            {salvata && <div className="text-sm text-slate-500">oppure ricomincia da capo:</div>}
            <input className="campo text-lg text-center py-2.5" placeholder="Scrivi il tuo nome e cognome" aria-label="Nome e cognome" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus={!salvata} />
            <button className="btn text-white text-lg justify-center py-3" style={{ background: cl.colore }} disabled={!nome.trim()}>Inizia il percorso ➜</button>
          </form>
          {onEsci && <button className="btn-ghost mt-3" onClick={onEsci}>← Torna indietro</button>}
        </div>
      </div>
    )
  }

  if (fase === 'fine') {
    return <Riepilogo percorso={percorso} nome={nome} attivita={attivita} esiti={esiti} totale={totale} migliore={somma('migliore')} onRivedi={() => setFase('percorso')} onEsci={onEsci} />
  }

  return (
    <div className="h-full flex flex-col bg-slate-800">
      <div className="flex-1 min-h-0 relative">
        {tappa ? (
          // le tappe già visitate restano montate (nascoste): tornando indietro le attività sono come le si era lasciate
          <div className="relative w-full h-full">
            {percorso.tappe.filter((t) => visitate.has(t.id)).map((t) => {
              const attiva = t.id === tappa.id
              return (
                <div key={t.id} className={'absolute inset-0 ' + (attiva ? '' : 'invisible pointer-events-none')} aria-hidden={!attiva}>
                  <Palco tappa={t} modo={modo} onVai={vaiA} attiva={attiva}
                    onRisultato={(id, r) => setEsiti((x) => ({ ...x, [id]: registraTentativo(x[id], r) }))} />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="h-full grid place-items-center text-white">Questo percorso non ha tappe.</div>
        )}
        {/* alla LIM: frecce grandi sui lati, comode da toccare stando vicino allo schermo */}
        {modo === 'lim' && !penna && n > 1 && (
          <>
            {i > 0 && <FrecciaLato verso="sx" onClick={() => vai(i - 1)} />}
            {i < n - 1 && <FrecciaLato verso="dx" onClick={() => vai(i + 1)} />}
          </>
        )}
        {penna && <Lavagna key={tappa?.id} onChiudi={() => setPenna(false)} />}
      </div>
      <nav className="print:hidden flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-900 text-white">
        {onEsci && <button className="btn text-slate-200 hover:bg-white/10 px-3 py-2.5" onClick={onEsci} aria-label="Esci">✕ <span className="hidden lg:inline">Esci</span></button>}
        <button className="min-w-0 hidden sm:block text-left rounded-lg px-2 py-1 hover:bg-white/10 max-w-72" onClick={() => setIndice(true)} title="Elenco delle tappe">
          <div className="text-xs text-slate-400 truncate">☰ {percorso.titolo}</div>
          <div className="font-bold truncate">{tappa?.titolo}</div>
        </button>
        <div className="mx-auto flex items-center gap-2">
          <button className="btn bg-white/10 hover:bg-white/20 text-xl px-6 py-2.5" disabled={i === 0} onClick={() => vai(i - 1)} aria-label="Tappa precedente">◀</button>
          <Pallini n={n} i={i} onVai={vai} onIndice={() => setIndice(true)} />
          {i < n - 1 ? (
            <button className="btn bg-white/10 hover:bg-white/20 text-xl px-6 py-2.5" onClick={() => vai(i + 1)} aria-label="Tappa successiva">▶</button>
          ) : modo === 'alunno' ? (
            <button className="btn bg-emerald-600 hover:bg-emerald-500 text-base px-5 py-2.5" onClick={concludi}>Fine 🏁</button>
          ) : (
            <span className="w-16" />
          )}
        </div>
        {modo === 'alunno' && Object.keys(esiti).length > 0 && <Punteggio r={totale} />}
        {modo === 'lim' && (
          <button className={'btn px-3 py-2.5 ' + (penna ? 'bg-amber-400 text-slate-900' : 'text-slate-200 hover:bg-white/10')} onClick={() => setPenna(!penna)} aria-pressed={penna} aria-label="Penna">
            ✏️ <span className="hidden lg:inline">Penna</span>
          </button>
        )}
        {modo === 'lim' && <Timer />}
        <button className="btn text-slate-200 hover:bg-white/10 px-3 py-2.5" title="Schermo intero" aria-label="Schermo intero" onClick={schermoIntero}>⛶ <span className="hidden lg:inline">Schermo intero</span></button>
      </nav>

      {proponiSchermo && (
        <div className="fixed inset-0 z-[120] bg-slate-900/70 grid place-items-center p-4" onClick={() => setProponiSchermo(false)}>
          <div role="dialog" aria-modal="true" className="card p-8 max-w-md w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-5xl" aria-hidden>📺</div>
            <h2 className="text-2xl font-extrabold mt-2">{percorso.titolo}</h2>
            <p className="text-slate-600 mt-1">Alla LIM conviene lo schermo intero.</p>
            <div className="flex flex-col gap-2 mt-6">
              <button className="btn-primario justify-center text-lg py-3" autoFocus onClick={() => { schermoIntero(); setProponiSchermo(false) }}>⛶ Schermo intero</button>
              <button className="btn-ghost justify-center py-3" onClick={() => setProponiSchermo(false)}>Continua nella finestra</button>
            </div>
          </div>
        </div>
      )}

      {indice && (
        <Dialogo titolo="Tappe del percorso" onClose={() => setIndice(false)}>
          <ol className="flex flex-col gap-1.5">
            {percorso.tappe.map((t, k) => (
              <li key={t.id}>
                <button className={'w-full text-left rounded-xl border-2 px-3 py-2.5 flex items-center gap-3 ' + (k === i ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300')}
                  onClick={() => { vai(k); setIndice(false) }} aria-current={k === i ? 'step' : undefined}>
                  <span className="w-8 h-8 shrink-0 rounded-lg bg-slate-100 grid place-items-center font-bold text-sm">{k + 1}</span>
                  <span className="flex-1 font-semibold">{t.titolo || 'Senza titolo'}</span>
                  {modo === 'alunno' && t.elementi.some((e) => e.tipo === 'attivita' && conPunteggio(e.attivita)) && (
                    t.elementi.every((e) => e.tipo !== 'attivita' || !conPunteggio(e.attivita) || esiti[e.id]) ? <span title="Attività svolte">✅</span> : <span title="Attività da svolgere">🎯</span>
                  )}
                </button>
              </li>
            ))}
          </ol>
        </Dialogo>
      )}

      {mancanti && (
        <Dialogo titolo="Hai finito?" onClose={() => setMancanti(false)}
          piede={<>
            <button className="btn-secondario py-2.5" onClick={() => setMancanti(false)}>Continua il percorso</button>
            <button className="btn bg-emerald-600 text-white hover:bg-emerald-700 py-2.5" onClick={() => { setMancanti(false); setFase('fine') }}>Concludi comunque 🏁</button>
          </>}>
          <p className="text-lg">{daFare.length === 1 ? 'Ti manca ancora un’attività:' : `Ti mancano ancora ${daFare.length} attività:`}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {daFare.map((a) => {
              const k = percorso.tappe.indexOf(a.tappa)
              return (
                <li key={a.el.id}>
                  <button className="w-full text-left rounded-xl border-2 border-slate-200 hover:border-indigo-400 px-4 py-3 flex items-center gap-3" onClick={() => { setMancanti(false); vai(k) }}>
                    <span className="w-8 h-8 shrink-0 rounded-lg bg-slate-100 grid place-items-center font-bold text-sm">{k + 1}</span>
                    <span className="flex-1"><b>{a.el.attivita.titolo}</b><span className="block text-sm text-slate-500">{a.tappa.titolo}</span></span>
                    <span className="text-indigo-700 font-semibold">Vai ➜</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Dialogo>
      )}
    </div>
  )
}

function schermoIntero() {
  if (document.fullscreenElement) document.exitFullscreen()
  else document.documentElement.requestFullscreen?.()
}

function FrecciaLato({ verso, onClick }: { verso: 'sx' | 'dx'; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={verso === 'sx' ? 'Tappa precedente' : 'Tappa successiva'}
      className={'absolute top-1/2 -translate-y-1/2 z-20 w-14 h-24 rounded-2xl bg-slate-900/25 hover:bg-slate-900/60 text-white text-3xl opacity-60 hover:opacity-100 transition print:hidden ' + (verso === 'sx' ? 'left-1' : 'right-1')}>
      {verso === 'sx' ? '◀' : '▶'}
    </button>
  )
}

function Pallini({ n, i, onVai, onIndice }: { n: number; i: number; onVai: (k: number) => void; onIndice: () => void }) {
  if (n > 14) return <button className="text-base font-bold tabular-nums px-3 py-2.5 rounded-lg hover:bg-white/10" onClick={onIndice} title="Elenco delle tappe">{i + 1} / {n} ☰</button>
  return (
    <div className="flex px-1">
      {/* il pallino è piccolo, ma l'area da toccare è grande */}
      {Array.from({ length: n }, (_, k) => (
        <button key={k} onClick={() => onVai(k)} title={`Tappa ${k + 1}`} aria-label={`Vai alla tappa ${k + 1}`} aria-current={k === i ? 'step' : undefined}
          className="w-8 h-10 grid place-items-center group">
          <span className={'w-3.5 h-3.5 rounded-full transition ' + (k === i ? 'bg-white scale-125' : k < i ? 'bg-white/60' : 'bg-white/25 group-hover:bg-white/50')} />
        </button>
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
  useEffect(() => { if (sec === 0) suono() }, [sec])
  const mm = sec !== null ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : ''
  return (
    <div className="relative">
      <button className={'btn px-3 py-2.5 ' + (sec === 0 ? 'bg-rose-600 animate-pulse' : sec ? 'bg-amber-500 text-slate-900' : 'text-slate-200 hover:bg-white/10')}
        onClick={() => (sec !== null ? setSec(null) : setAperto(!aperto))} aria-label={sec !== null ? 'Ferma il timer' : 'Timer'} title={sec !== null ? 'Ferma il timer' : 'Timer'}>
        ⏱ {sec !== null ? (sec === 0 ? 'Tempo!' : mm) : <span className="hidden lg:inline">Timer</span>}
      </button>
      {aperto && (
        <div className="absolute bottom-14 right-0 bg-white text-slate-800 rounded-xl shadow-xl p-2 flex gap-1.5 z-50">
          {[1, 2, 3, 5, 10].map((m) => (
            <button key={m} className="btn-secondario text-base px-4 py-2.5" onClick={() => { setSec(m * 60); setAperto(false) }}>{m}′</button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Tre note brevi alla fine del timer (generate dal browser, niente file audio) */
function suono() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    ;[0, 0.25, 0.5].forEach((t, k) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = [660, 660, 880][k]
      g.gain.setValueAtTime(0.25, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.22)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + 0.23)
    })
    setTimeout(() => ctx.close(), 1500)
  } catch { /* audio non disponibile */ }
}

function Riepilogo({ percorso, nome, attivita, esiti, totale, migliore, onRivedi, onEsci }: {
  percorso: Percorso
  nome: string
  attivita: { tappa: Percorso['tappe'][number]; el: { id: string; attivita: { titolo: string } } }[]
  esiti: Record<string, Esito>
  totale: Risultato
  migliore: Risultato
  onRivedi: () => void
  onEsci?: () => void
}) {
  const perc = totale.max ? Math.round((totale.punti / totale.max) * 100) : 0
  const percMigliore = migliore.max ? Math.round((migliore.punti / migliore.max) * 100) : 0
  const svolte = attivita.filter((a) => esiti[a.el.id]).length
  const ripassi = attivita.some((a) => (esiti[a.el.id]?.tentativi ?? 0) > 1)
  return (
    <div className="h-full overflow-auto bg-slate-50 p-4">
      <div className="card max-w-2xl mx-auto p-6 print:shadow-none print:border-0">
        <div className="text-center">
          <div className="text-6xl" aria-hidden>{perc >= 80 ? '🏆' : perc >= 50 ? '🎉' : '💪'}</div>
          <h1 className="text-3xl font-extrabold mt-2">Percorso completato!</h1>
          <p className="text-slate-600">{percorso.titolo}</p>
          <p className="text-xl font-bold mt-3">{nome}</p>
          <p className="text-sm text-slate-500">{new Date().toLocaleString('it-IT')}</p>
          <div className="text-5xl font-extrabold mt-4" style={{ color: perc >= 80 ? '#059669' : perc >= 50 ? '#d97706' : '#e11d48' }}>{perc}%</div>
          <div className="text-slate-600">{totale.punti} punti su {totale.max} al primo tentativo · {svolte} attività svolte su {attivita.length}</div>
          {ripassi && percMigliore > perc && <div className="text-sm text-slate-500 mt-1">Dopo i ripassi: {percMigliore}%</div>}
        </div>
        <table className="w-full mt-6 text-sm">
          <thead><tr className="text-left text-slate-500 border-b"><th className="py-1">Tappa</th><th>Attività</th><th className="text-right">1° tentativo</th><th className="text-right">Migliore</th></tr></thead>
          <tbody>
            {attivita.map((a) => {
              const r = esiti[a.el.id]
              return (
                <tr key={a.el.id} className="border-b border-slate-100">
                  <td className="py-1.5">{a.tappa.titolo}</td>
                  <td>{a.el.attivita.titolo}</td>
                  {r ? (
                    <>
                      <td className="text-right font-bold">{r.primo.punti}/{r.primo.max}</td>
                      <td className="text-right text-slate-600">{r.tentativi > 1 ? `${r.migliore.punti}/${r.migliore.max} (${r.tentativi} tentativi)` : '—'}</td>
                    </>
                  ) : <td colSpan={2} className="text-right text-slate-400">non svolta</td>}
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
