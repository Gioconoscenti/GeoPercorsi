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
import { scaricaPacchetto } from '../export/pacchetto'
import { esportaPerAlunni } from '../export/standalone'
import { IconaClasse } from '../ui/IconaClasse'

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
  const [msg, setMsg] = useState<string | null>(null)
  const storia = useRef<{ passato: Percorso[]; futuro: Percorso[]; ultimo: number }>({ passato: [], futuro: [], ultimo: 0 })

  // salvataggio automatico
  const primo = useRef(true)
  useEffect(() => {
    if (primo.current) { primo.current = false; return }
    setSalvato(false)
    const t = setTimeout(() => salvaPercorso(percorso).then(() => setSalvato(true)), 500)
    return () => clearTimeout(t)
  }, [percorso])

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
    eliminaElemento: (id) => { aggiornaTappa((t) => ({ ...t, elementi: t.elementi.filter((e) => e.id !== id) })); setSelId(null) },
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
      const t = e.target as HTMLElement
      const inCampo = ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !inCampo) { e.preventDefault(); if (e.shiftKey) ripeti(); else annulla() }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && !inCampo) { e.preventDefault(); ripeti() }
      if (inCampo || !api?.selezionato) return
      const s = api.selezionato
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); api.eliminaElemento(s.id) }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); api.duplicaElemento(s.id) }
      const passo = e.shiftKey ? 20 : 2
      const mosse: Record<string, [number, number]> = { ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, -passo], ArrowDown: [0, passo] }
      if (mosse[e.key]) { e.preventDefault(); api.aggiornaElemento(s.id, { x: s.x + mosse[e.key][0], y: s.y + mosse[e.key][1] }) }
      if (e.key === 'Escape') api.seleziona(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const esporta = async (fn: () => Promise<unknown>, ok: string) => {
    setMsg('Preparazione in corso…')
    try { await salvaPercorso(percorso); await fn(); setMsg(ok) } catch (e) { setMsg('Errore: ' + (e as Error).message) }
  }

  const cl = CLASSI[percorso.classe]
  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center gap-2 px-3 py-2 bg-white border-b border-slate-200 shrink-0">
        <Link to="/" className="btn-ghost" title="Home">←</Link>
        <IconaClasse classe={percorso.classe} size={30} />
        <input value={percorso.titolo} onChange={(e) => aggiornaPercorso((p) => ({ ...p, titolo: e.target.value }))}
          className="text-lg font-extrabold bg-transparent rounded px-2 py-1 hover:bg-slate-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-0 w-72" />
        <select className="campo w-auto" value={percorso.classe} onChange={(e) => aggiornaPercorso((p) => ({ ...p, classe: Number(e.target.value) as Classe }))}>
          {([1, 2, 3] as Classe[]).map((c) => <option key={c} value={c}>{CLASSI[c].nome} · {CLASSI[c].tema}</option>)}
        </select>
        <span className="text-xs text-slate-400 w-20">{salvato ? '✓ Salvato' : 'Salvataggio…'}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button className="btn-ghost" onClick={annulla} title="Annulla (Ctrl+Z)">↶</button>
          <button className="btn-ghost" onClick={ripeti} title="Ripeti (Ctrl+Y)">↷</button>
          <Menu etichetta="⬇ Esporta">
            {(chiudi) => (
              <>
                <button className="menu-voce" onClick={() => { chiudi(); esporta(() => esportaPerAlunni(percorso), 'File per gli alunni scaricato: condividilo su Classroom, registro o Drive.') }}>🎒 File per gli alunni (HTML, funziona offline)</button>
                <button className="menu-voce" onClick={() => { chiudi(); esporta(() => scaricaPacchetto(percorso), 'Pacchetto scaricato.') }}>💾 Pacchetto modificabile (.geopercorso)</button>
              </>
            )}
          </Menu>
          <button className="btn-secondario" onClick={async () => { await salvaPercorso(percorso); nav('/gioca/' + percorso.id) }}>🎒 Prova come alunno</button>
          <button className="btn-primario" onClick={async () => { await salvaPercorso(percorso); nav('/presenta/' + percorso.id) }}>📺 Presenta</button>
        </div>
      </header>
      {msg && (
        <div className="bg-indigo-50 border-b border-indigo-200 text-indigo-900 text-sm px-4 py-1.5 flex">
          {msg}<button className="ml-auto" onClick={() => setMsg(null)}>✕</button>
        </div>
      )}
      {api && (
        <div className="flex-1 min-h-0 flex">
          <ListaTappe api={api} />
          <div className="flex-1 min-w-0 flex flex-col bg-slate-200">
            <BarraStrumenti api={api} />
            <div className="flex-1 min-h-0 p-4">
              <Tela api={api} />
            </div>
          </div>
          <PannelloProprieta api={api} />
        </div>
      )}
    </div>
  )
}

export function Menu({ etichetta, children, className, sinistra }: { etichetta: React.ReactNode; children: (chiudi: () => void) => React.ReactNode; className?: string; sinistra?: boolean }) {
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
      <button className={className ?? 'btn-secondario'} onClick={() => setAperto(!aperto)}>{etichetta}</button>
      {aperto && <div className={'absolute top-full ' + (sinistra ? 'left-0' : 'right-0') + ' mt-1 z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-1 min-w-64'}>{children(() => setAperto(false))}</div>}
    </div>
  )
}
