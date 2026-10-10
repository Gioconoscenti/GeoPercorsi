import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, salvaPercorso } from '../data/db'
import { seedSeServe } from '../data/seed'
import { clonaPercorso, nuovoPercorso } from '../lib/fabbrica'
import { scaricaPacchetto, importaPacchetto } from '../export/pacchetto'
import { esportaPerAlunni } from '../export/standalone'
import { CLASSI, type Classe, type Percorso } from '../types'
import { IconaClasse } from '../ui/IconaClasse'

export function Home() {
  const nav = useNavigate()
  const percorsi = useLiveQuery(() => db.percorsi.orderBy('aggiornato').reverse().toArray(), [])
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    seedSeServe()
  }, [])

  const crea = async (c: Classe) => {
    const p = nuovoPercorso(c)
    await salvaPercorso(p)
    nav('/modifica/' + p.id)
  }

  const importa = async (files: FileList | null) => {
    if (!files?.length) return
    try {
      for (const f of Array.from(files)) {
        const p = await importaPacchetto(f)
        setMsg(`Importato “${p.titolo}”`)
      }
    } catch (e) {
      setMsg('Importazione non riuscita: ' + (e as Error).message)
    }
  }

  return (
    <div className="min-h-full">
      <header className="bg-gradient-to-r from-emerald-600 via-sky-600 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-wrap items-center gap-4">
          <div className="text-5xl">🧭</div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">GeoPercorsi</h1>
            <p className="opacity-90">Lezioni di geografia interattive per la scuola media</p>
          </div>
          <div className="ml-auto flex gap-2">
            <a className="btn bg-white/15 hover:bg-white/25 text-white" href="./manuale.html" target="_blank" rel="noopener">📘 Guida</a>
            <button className="btn bg-white/15 hover:bg-white/25 text-white" onClick={() => fileRef.current?.click()}>⬆ Importa percorso</button>
            <input ref={fileRef} type="file" accept=".geopercorso,.zip" multiple hidden onChange={(e) => { importa(e.target.files); e.target.value = '' }} />
          </div>
        </div>
      </header>

      {msg && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 px-4 py-2 flex">
            {msg}
            <button className="ml-auto" onClick={() => setMsg(null)}>✕</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-3">
        {([1, 2, 3] as Classe[]).map((c) => {
          const cl = CLASSI[c]
          const lista = (percorsi ?? []).filter((p) => p.classe === c)
          return (
            <section key={c} className="card overflow-hidden flex flex-col">
              <div className="p-5" style={{ background: cl.chiaro }}>
                <div className="flex items-center gap-3">
                  <IconaClasse classe={c} size={48} />
                  <div>
                    <div className="text-sm font-bold uppercase tracking-wide" style={{ color: cl.colore }}>{cl.nome}</div>
                    <h2 className="text-2xl font-extrabold">{cl.tema}</h2>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="btn text-white shadow-sm" style={{ background: cl.colore }} onClick={() => crea(c)}>＋ Nuovo percorso</button>
                  <Link className="btn-secondario" to={'/atlante/' + cl.area}>🗺️ Atlante</Link>
                </div>
              </div>
              <div className="p-3 flex flex-col gap-2 flex-1">
                {percorsi && lista.length === 0 && <p className="text-sm text-slate-500 p-3">Nessun percorso. Creane uno nuovo!</p>}
                {lista.map((p) => <SchedaPercorso key={p.id} p={p} colore={cl.colore} onMsg={setMsg} />)}
              </div>
            </section>
          )
        })}
      </main>
      <footer className="text-center text-xs text-slate-400 pb-6">
        I percorsi sono salvati in questo browser. Usa “Esporta” per farne una copia di sicurezza o condividerli.
        Dati cartografici: Natural Earth, ISTAT/openpolis, fiumi italiani © OpenStreetMap contributors (ODbL).
      </footer>
    </div>
  )
}

function SchedaPercorso({ p, colore, onMsg }: { p: Percorso; colore: string; onMsg: (m: string) => void }) {
  const [menu, setMenu] = useState(false)
  const [lavoro, setLavoro] = useState(false)
  const azione = async (fn: () => Promise<unknown>, ok?: string) => {
    setMenu(false)
    setLavoro(true)
    try {
      await fn()
      if (ok) onMsg(ok)
    } catch (e) {
      onMsg('Errore: ' + (e as Error).message)
    } finally {
      setLavoro(false)
    }
  }
  return (
    <div className="rounded-xl border border-slate-200 p-3 hover:shadow-sm transition bg-white relative" style={{ borderLeft: `5px solid ${colore}` }}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <Link to={'/modifica/' + p.id} className="font-bold text-slate-900 hover:underline block truncate">{p.titolo}</Link>
          <div className="text-xs text-slate-500">{p.tappe.length} tappe · modificato il {new Date(p.aggiornato).toLocaleDateString('it-IT')}</div>
          {p.descrizione && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{p.descrizione}</p>}
        </div>
        <button className="btn-ghost px-2" onClick={() => setMenu(!menu)} aria-label="Altre azioni">⋯</button>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <Link className="btn-secondario py-1" to={'/modifica/' + p.id}>✏️ Modifica</Link>
        <Link className="btn-secondario py-1" to={'/presenta/' + p.id}>📺 Presenta</Link>
        <Link className="btn-secondario py-1" to={'/gioca/' + p.id}>🎒 Alunno</Link>
      </div>
      {lavoro && <div className="text-xs text-indigo-700 mt-2">Preparazione in corso…</div>}
      {menu && (
        <div className="absolute right-2 top-10 z-20 bg-white rounded-xl shadow-xl border border-slate-200 py-1 w-64">
          <MenuVoce onClick={() => azione(() => esportaPerAlunni(p), 'File per gli alunni scaricato')}>🎒 Scarica file per gli alunni (HTML)</MenuVoce>
          <MenuVoce onClick={() => azione(() => scaricaPacchetto(p))}>💾 Esporta pacchetto (.geopercorso)</MenuVoce>
          <MenuVoce onClick={() => azione(() => salvaPercorso(clonaPercorso(p)), 'Percorso duplicato')}>📄 Duplica</MenuVoce>
          <MenuVoce pericolo onClick={() => { if (confirm(`Eliminare “${p.titolo}”?`)) azione(() => db.percorsi.delete(p.id)) }}>🗑️ Elimina</MenuVoce>
        </div>
      )}
    </div>
  )
}

function MenuVoce({ children, onClick, pericolo }: { children: React.ReactNode; onClick: () => void; pericolo?: boolean }) {
  return (
    <button onClick={onClick} className={'w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ' + (pericolo ? 'text-red-600' : '')}>
      {children}
    </button>
  )
}
