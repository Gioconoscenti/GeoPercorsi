import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db, salvaPercorso } from '../data/db'
import { CLASSI, type Classe, type Elemento, type Percorso, type Tappa } from '../types'
import { nuovaTappa } from '../lib/fabbrica'
import { nuovoId } from '../lib/id'
import { ListaTappe } from './ListaTappe'
import { Tela } from './Tela'
import { BarraStrumenti } from './BarraStrumenti'
import { PannelloProprieta } from './PannelloProprieta'
import { DialogoCondividi } from '../app/Home'
import { toast } from '../ui/Toast'
import { IconaClasse } from '../ui/IconaClasse'
import { Dialogo } from '../ui/Dialogo'

export interface EditorApi {
  percorso: Percorso
  tappa: Tappa
  selezionato: Elemento | null
  seleziona: (id: string | null) => void
  aggiornaPercorso: (fn: (p: Percorso) => Percorso) => void
  aggiornaTappa: (fn: (t: Tappa) => Tappa) => void
  aggiornaElemento: (id: string, patch: Partial<Elemento>) => void
  aggiungiElemento: (e: Elemento) => void
  eliminaElemento: (id: string) => void
  duplicaElemento: (id: string) => void
  spostaLivello: (id: string, verso: 'su' | 'giu') => void
  vaiATappa: (id: string) => void
  aggiungiTappa: (t?: Tappa) => void
}

export function Editor() {
  const { id } = useParams()
  const [percorso, setPercorso] = useState<Percorso | null>(null)
  useEffect(() => {
    db.percorsi.get(id ?? '').then((p) => setPercorso(p ?? null))
  }, [id])
  if (!percorso) return <div className="p-8 text-slate-500">Caricamento…</div>
  return <EditorInterno iniziale={percorso} />
}

function EditorInterno({ iniziale }: { iniziale: Percorso }) {
  const nav = useNavigate()
  const [percorso, setPercorso] = useState(iniziale)
  const [tappaId, setTappaId] = useState(iniziale.tappe[0]?.id)
  const [selId, setSelId] = useState<string | null>(null)
  const [salvato, setSalvato] = useState(true)
  const [condividi, setCondividi] = useState(false)
  const [impostazioni, setImpostazioni] = useState(false)
  // colonne richiudibili: sui portatili (1366 px) la tela ha bisogno di spazio
  const [layout, setLayout] = useState<{ tappe: boolean; proprieta: boolean }>(() => {
    try {
      const s = JSON.parse(localStorage.getItem('geopercorsi-editor-layout') ?? 'null')
      if (s) return s
    } catch { /* niente */ }
    return { tappe: window.innerWidth >= 1500, proprieta: true }
  })
  const cambiaLayout = (patch: Partial<typeof layout>) => {
    const nuovo = { ...layout, ...patch }
    setLayout(nuovo)
    try { localStorage.setItem('geopercorsi-editor-layout', JSON.stringify(nuovo)) } catch { /* niente */ }
  }
  const storia = useRef<{ passato: Percorso[]; futuro: Percorso[]; ultimo: number }>({ passato: [], futuro: [], ultimo: 0 })

  // salvataggio automatico
  const primo = useRef(true)
  const ultimo = useRef(percorso)
  const daSalvare = useRef(false)
  useEffect(() => {
    if (primo.current) { primo.current = false; return }
    ultimo.current = percorso
    daSalvare.current = true
    setSalvato(false)
    const t = setTimeout(() => {
      daSalvare.current = false
      salvaPercorso(percorso).then(() => setSalvato(true))
    }, 500)
    return () => clearTimeout(t)
  }, [percorso])

  // uscendo dall'editor (o chiudendo la pagina) prima dei 500 ms si salva subito
  useEffect(() => {
    const salvaSubito = () => {
      if (!daSalvare.current) return
      daSalvare.current = false
      salvaPercorso(ultimo.current)
    }
    window.addEventListener('pagehide', salvaSubito)
    return () => {
      window.removeEventListener('pagehide', salvaSubito)
      salvaSubito()
    }
  }, [])

  const aggiornaPercorso = useCallback((fn: (p: Percorso) => Percorso) => {
    setPercorso((p) => {
      const s = storia.current
      // raggruppa le modifiche ravvicinate (es. trascinamento, digitazione)
      if (Date.now() - s.ultimo > 600) {
        s.passato.push(p)
        if (s.passato.length > 60) s.passato.shift()
        s.futuro = []
      }
      s.ultimo = Date.now()
      return fn(p)
    })
  }, [])

  const annulla = () => {
    const s = storia.current
    const prec = s.passato.pop()
    if (!prec) return
    s.futuro.push(percorso)
    s.ultimo = 0
    setPercorso(prec)
  }
  const ripeti = () => {
    const s = storia.current
    const succ = s.futuro.pop()
    if (!succ) return
    s.passato.push(percorso)
    s.ultimo = 0
    setPercorso(succ)
  }

  const tappa = percorso.tappe.find((t) => t.id === tappaId) ?? percorso.tappe[0]
  const selezionato = tappa?.elementi.find((e) => e.id === selId) ?? null

  const aggiornaTappa = useCallback((fn: (t: Tappa) => Tappa) => {
    aggiornaPercorso((p) => ({ ...p, tappe: p.tappe.map((t) => (t.id === tappa?.id ? fn(t) : t)) }))
  }, [aggiornaPercorso, tappa?.id])

  const api: EditorApi | null = tappa ? {
    percorso,
    tappa,
    selezionato,
    seleziona: setSelId,
    aggiornaPercorso,
    aggiornaTappa,
    aggiornaElemento: (id, patch) => aggiornaTappa((t) => ({ ...t, elementi: t.elementi.map((e) => (e.id === id ? ({ ...e, ...patch } as Elemento) : e)) })),
    aggiungiElemento: (e) => { aggiornaTappa((t) => ({ ...t, elementi: [...t.elementi, e] })); setSelId(e.id) },
    eliminaElemento: (id) => {
      const i = tappa.elementi.findIndex((e) => e.id === id)
      const el = tappa.elementi[i]
      const tId = tappa.id
      aggiornaTappa((t) => ({ ...t, elementi: t.elementi.filter((e) => e.id !== id) }))
      setSelId(null)
      if (el) toast('Elemento eliminato', {
        azione: {
          etichetta: 'Annulla',
          fn: () => aggiornaPercorso((p) => ({ ...p, tappe: p.tappe.map((t) => (t.id === tId ? { ...t, elementi: [...t.elementi.slice(0, i), el, ...t.elementi.slice(i)] } : t)) })),
        },
      })
    },
    duplicaElemento: (id) => {
      const e = tappa.elementi.find((x) => x.id === id)
      if (!e) return
      const copia = { ...structuredClone(e), id: nuovoId(), x: e.x + 24, y: e.y + 24 }
      aggiornaTappa((t) => ({ ...t, elementi: [...t.elementi, copia] }))
      setSelId(copia.id)
    },
    spostaLivello: (id, verso) => aggiornaTappa((t) => {
      const el = t.elementi.filter((e) => e.id !== id)
      const e = t.elementi.find((x) => x.id === id)!
      return { ...t, elementi: verso === 'su' ? [...el, e] : [e, ...el] }
    }),
    vaiATappa: (id) => { setTappaId(id); setSelId(null) },
    aggiungiTappa: (t) => {
      const nuova = t ?? nuovaTappa(`Tappa ${percorso.tappe.length + 1}`)
      aggiornaPercorso((p) => {
        const i = p.tappe.findIndex((x) => x.id === tappa.id)
        const tappe = [...p.tappe]
        tappe.splice(i + 1, 0, nuova)
        return { ...p, tappe }
      })
      setTappaId(nuova.id)
      setSelId(null)
    },
  } : null

  // scorciatoie da tastiera
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // con una finestra aperta (genera, scegli i luoghi, condividi…) i tasti non agiscono sulla tela dietro
      if (document.querySelector('[role="dialog"]')) return
      const t = e.target as HTMLElement
      const inCampo = ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !inCampo) { e.preventDefault(); if (e.shiftKey) ripeti(); else annulla() }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && !inCampo) { e.preventDefault(); ripeti() }
      if (inCampo || !api?.selezionato) return
      const s = api.selezionato
      // solo Canc: Backspace premuto per sbaglio non deve cancellare nulla
      if (e.key === 'Delete') { e.preventDefault(); api.eliminaElemento(s.id) }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); api.duplicaElemento(s.id) }
      const passo = e.shiftKey ? 20 : 2
      const mosse: Record<string, [number, number]> = { ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, -passo], ArrowDown: [0, passo] }
      if (mosse[e.key]) { e.preventDefault(); api.aggiornaElemento(s.id, { x: s.x + mosse[e.key][0], y: s.y + mosse[e.key][1] }) }
      if (e.key === 'Escape') api.seleziona(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const cl = CLASSI[percorso.classe]
  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center gap-2 px-3 py-2 bg-white border-b border-slate-200 shrink-0">
        <Link to="/" className="btn-ghost" title="Home">←</Link>
        <IconaClasse classe={percorso.classe} size={30} />
        <input value={percorso.titolo} onChange={(e) => aggiornaPercorso((p) => ({ ...p, titolo: e.target.value }))} aria-label="Titolo del percorso"
          className="text-lg font-extrabold bg-transparent rounded px-2 py-1 hover:bg-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-0 w-40 xl:w-72" />
        <button className="btn-ghost" onClick={() => setImpostazioni(true)} title="Titolo, classe e descrizione del percorso">⚙️ <span className="hidden xl:inline">Impostazioni</span></button>
        <span className="text-xs text-slate-400 w-20 shrink-0">{salvato ? '✓ Salvato' : 'Salvataggio…'}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button className="btn-ghost text-lg" onClick={annulla} disabled={!storia.current.passato.length} title="Annulla (Ctrl+Z)" aria-label="Annulla">↶</button>
          <button className="btn-ghost text-lg" onClick={ripeti} disabled={!storia.current.futuro.length} title="Ripeti (Ctrl+Y)" aria-label="Ripeti">↷</button>
          <button className="btn-secondario" onClick={() => setCondividi(true)}>📤 Condividi</button>
          <button className="btn-secondario" onClick={async () => { await salvaPercorso(percorso); nav('/gioca/' + percorso.id) }} title="Prova come alunno">🎒 <span className="hidden xl:inline">Prova come alunno</span></button>
          <button className="btn-primario" onClick={async () => { await salvaPercorso(percorso); nav('/presenta/' + percorso.id) }}>📺 Presenta</button>
        </div>
      </header>
      {condividi && <DialogoCondividi p={percorso} prima={() => salvaPercorso(percorso)} onClose={() => setCondividi(false)} />}
      {impostazioni && (
        <Dialogo titolo="⚙️ Impostazioni del percorso" onClose={() => setImpostazioni(false)} piede={<button className="btn-primario" onClick={() => setImpostazioni(false)}>Fatto</button>}>
          <label className="block mb-4">
            <span className="etichetta">Titolo</span>
            <input className="campo text-base" value={percorso.titolo} onChange={(e) => aggiornaPercorso((p) => ({ ...p, titolo: e.target.value }))} />
          </label>
          <div className="mb-4">
            <span className="etichetta">Classe</span>
            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 3] as Classe[]).map((c) => (
                <button key={c} onClick={() => aggiornaPercorso((p) => ({ ...p, classe: c }))} aria-pressed={percorso.classe === c}
                  className={'rounded-xl border-2 p-3 flex flex-col items-center gap-1 ' + (percorso.classe === c ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300')}>
                  <IconaClasse classe={c} size={32} />
                  <span className="text-sm font-bold">{CLASSI[c].nome}</span>
                  <span className="text-xs text-slate-500">{CLASSI[c].tema}</span>
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="etichetta">Descrizione</span>
            <textarea className="campo text-base" rows={3} value={percorso.descrizione} placeholder="Cosa impareranno gli alunni in questo percorso?"
              onChange={(e) => aggiornaPercorso((p) => ({ ...p, descrizione: e.target.value }))} />
            <span className="text-xs text-slate-500">La leggono gli alunni nella pagina iniziale, prima di scrivere il nome.</span>
          </label>
        </Dialogo>
      )}
      {api && (
        <div className="flex-1 min-h-0 flex">
          <ListaTappe api={api} compatta={!layout.tappe} onCompatta={() => cambiaLayout({ tappe: !layout.tappe })} />
          <div className="flex-1 min-w-0 flex flex-col bg-slate-200">
            <BarraStrumenti api={api} />
            <div className="flex-1 min-h-0 p-4">
              <Tela api={api} />
            </div>
          </div>
          {layout.proprieta ? (
            <div className="relative flex shrink-0">
              <button className="absolute -left-4 top-2 z-10 w-8 h-8 rounded-full bg-white border border-slate-300 shadow text-slate-500 hover:text-slate-900" onClick={() => cambiaLayout({ proprieta: false })}
                title="Chiudi il pannello delle proprietà" aria-label="Chiudi il pannello delle proprietà">›</button>
              <PannelloProprieta api={api} />
            </div>
          ) : (
            <button className="w-10 shrink-0 bg-white border-l border-slate-200 flex flex-col items-center gap-2 pt-3 text-slate-600 hover:bg-slate-50" onClick={() => cambiaLayout({ proprieta: true })}
              title="Apri il pannello delle proprietà" aria-label="Apri il pannello delle proprietà">
              <span>‹</span>
              <span className="[writing-mode:vertical-rl] rotate-180 text-xs font-bold uppercase tracking-wider">
                {api.selezionato ? '● Proprietà elemento' : 'Proprietà'}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function Menu({ etichetta, children, className, sinistra, 'aria-label': ariaLabel }: { etichetta: React.ReactNode; children: (chiudi: () => void) => React.ReactNode; className?: string; sinistra?: boolean; 'aria-label'?: string }) {
  const [aperto, setAperto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!aperto) return
    const fuori = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setAperto(false) }
    document.addEventListener('mousedown', fuori)
    return () => document.removeEventListener('mousedown', fuori)
  }, [aperto])
  return (
    <div ref={ref} className="relative">
      <button className={className ?? 'btn-secondario'} onClick={() => setAperto(!aperto)} aria-label={ariaLabel} aria-expanded={aperto}>{etichetta}</button>
      {aperto && <div className={'absolute top-full ' + (sinistra ? 'left-0' : 'right-0') + ' mt-1 z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-1 min-w-64'}>{children(() => setAperto(false))}</div>}
    </div>
  )
}
