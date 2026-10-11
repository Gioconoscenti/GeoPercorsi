import { useEffect, useRef, useState } from 'react'
import { cercaPercorso } from '../lib/ricerca'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, pulisciAsset, salvaPercorso } from '../data/db'
import { seedSeServe } from '../data/seed'
import { clonaPercorso, nuovoPercorso } from '../lib/fabbrica'
import { scaricaPacchetto, importaFile, scaricaBackup } from '../export/pacchetto'
import { esportaPerAlunni } from '../export/standalone'
import { CLASSI, type Classe, type Percorso } from '../types'
import { IconaClasse } from '../ui/IconaClasse'
import { Menu } from '../editor/Editor'
import { toast } from '../ui/Toast'
import { Dialogo } from '../ui/Dialogo'
import { CreaConClaude } from '../scambio/CreaConClaude'

const GIORNO = 24 * 3600 * 1000
/** un percorso è stato toccato dal docente (gli esempi appena creati hanno aggiornato ≈ creato) */
const modificato = (p: Percorso) => p.aggiornato - p.creato > 5000

// i file che nessun percorso usa più (immagini sostituite, percorsi eliminati) si tolgono una volta per avvio:
// così “Annulla” dopo un’eliminazione trova ancora i file del percorso
let pulito = false
const pulisciUnaVolta = () => {
  if (pulito) return
  pulito = true
  pulisciAsset().catch((e) => console.error('Pulizia dei file non riuscita', e))
}

export function Home() {
  const nav = useNavigate()
  const percorsi = useLiveQuery(() => db.percorsi.orderBy('aggiornato').reverse().toArray(), [])
  const ultimoBackup = useLiveQuery(async () => ((await db.impostazioni.get('ultimo-backup'))?.valore as number | undefined) ?? 0, [], null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [evidenzia, setEvidenzia] = useState<string[]>([])
  const [bannerChiuso, setBannerChiuso] = useState(false)
  const [backupInCorso, setBackupInCorso] = useState(false)
  const [cerca, setCerca] = useState('')
  const cercaRef = useRef<HTMLInputElement>(null)
  const [creaClaude, setCreaClaude] = useState(false)

  useEffect(() => {
    seedSeServe().then(pulisciUnaVolta)
    // chiede al browser di non cancellare i dati da solo quando lo spazio scarseggia
    navigator.storage?.persist?.().catch(() => {})
  }, [])

  // il tasto / porta subito alla ricerca (se non si sta già scrivendo da qualche parte)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return
      e.preventDefault()
      cercaRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const crea = async (c: Classe) => {
    const p = nuovoPercorso(c)
    await salvaPercorso(p)
    nav('/modifica/' + p.id)
  }

  const importa = async (files: FileList | null) => {
    if (!files?.length) return
    try {
      const importati: Percorso[] = []
      for (const f of Array.from(files)) importati.push(...(await importaFile(f)))
      setEvidenzia(importati.map((p) => p.id))
      setTimeout(() => setEvidenzia([]), 6000)
      toast(importati.length === 1 ? `Importato “${importati[0].titolo}”` : `Importati ${importati.length} percorsi`)
    } catch (e) {
      toast('Importazione non riuscita: ' + (e as Error).message, { errore: true })
    }
  }

  const backup = async () => {
    setBackupInCorso(true)
    try {
      const n = await scaricaBackup()
      toast(`Backup scaricato (${n} percorsi). Conservalo su Drive o su una chiavetta.`)
    } catch (e) {
      toast('Backup non riuscito: ' + (e as Error).message, { errore: true })
    } finally {
      setBackupInCorso(false)
    }
  }

  // promemoria: ci sono modifiche non salvate in un backup da più di una settimana
  const daSalvare = (percorsi ?? []).filter((p) => modificato(p) && p.aggiornato > (ultimoBackup ?? 0))
  const trovati = (percorsi ?? []).filter((p) => cercaPercorso(p, cerca).ok).length
  const mostraBanner = !bannerChiuso && ultimoBackup !== null && daSalvare.length > 0 && Date.now() - (ultimoBackup ?? 0) > 7 * GIORNO

  return (
    <div className="min-h-full">
      <header className="bg-gradient-to-r from-emerald-600 via-sky-600 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-wrap items-center gap-4">
          <div className="text-5xl" aria-hidden>🧭</div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">GeoPercorsi</h1>
            <p className="opacity-90">Lezioni di geografia interattive per la scuola media</p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Link className="btn bg-white/15 hover:bg-white/25 text-white" to="/atlante/italia">🗺️ Atlante</Link>
            <a className="btn bg-white/15 hover:bg-white/25 text-white" href="./manuale.html" target="_blank" rel="noopener">📘 Guida</a>
            <button className="btn bg-white/15 hover:bg-white/25 text-white" onClick={() => setCreaClaude(true)} title="Fai scrivere un percorso a Claude e importalo qui">✨ Crea con Claude</button>
            <button className="btn bg-white/15 hover:bg-white/25 text-white" onClick={backup} disabled={backupInCorso} title="Scarica una copia di tutti i percorsi">
              💾 {backupInCorso ? 'Backup in corso…' : 'Backup'}
            </button>
            <button className="btn bg-white/15 hover:bg-white/25 text-white" onClick={() => fileRef.current?.click()} title="Pacchetti .geopercorso o backup .zip">⬆ Importa</button>
            {/* niente "accept": iPad e iPhone non conoscono l'estensione .geopercorso e mostrerebbero i file in grigio, non selezionabili; il contenuto si controlla comunque in importaFile */}
            <input ref={fileRef} type="file" multiple hidden onChange={(e) => { importa(e.target.files); e.target.value = '' }} />
          </div>
        </div>
      </header>

      {creaClaude && <CreaConClaude onClose={() => setCreaClaude(false)} />}

      {mostraBanner && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="rounded-xl bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 flex flex-wrap items-center gap-3">
            <span className="text-2xl" aria-hidden>💾</span>
            <div className="flex-1 min-w-60">
              <b>Fai un backup dei tuoi percorsi.</b> {daSalvare.length === 1 ? 'Un percorso è stato modificato' : `${daSalvare.length} percorsi sono stati modificati`} {ultimoBackup ? `dopo l’ultimo backup (${new Date(ultimoBackup).toLocaleDateString('it-IT')})` : 'e non hai ancora fatto un backup'}.
              I percorsi sono salvati solo in questo browser: se si cancellano i dati di navigazione vanno persi.
            </div>
            <button className="btn bg-amber-600 text-white hover:bg-amber-700" onClick={backup} disabled={backupInCorso}>Scarica il backup</button>
            <button className="btn-ghost" onClick={() => setBannerChiuso(true)}>Più tardi</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 pt-5">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>🔎</span>
          <input ref={cercaRef} type="text" inputMode="search" enterKeyHint="search" autoComplete="off" className="campo pl-11 pr-11 py-2.5 text-base"
            placeholder="Cerca un percorso: titolo, argomento, regione, Stato…  (premi / per scrivere qui)" aria-label="Cerca un percorso"
            value={cerca} onChange={(e) => setCerca(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setCerca('') }} />
          {cerca && (
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full text-slate-500 hover:bg-slate-100" aria-label="Cancella la ricerca"
              onClick={() => { setCerca(''); cercaRef.current?.focus() }}>✕</button>
          )}
        </div>
        {cerca.trim() && percorsi && (
          <p className="text-sm text-slate-600 mt-2" role="status">
            {trovati === 0 ? 'Nessun percorso trovato: prova con meno parole.' : `${trovati} ${trovati === 1 ? 'percorso trovato' : 'percorsi trovati'} su ${percorsi.length}`}
          </p>
        )}
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-3">
        {([1, 2, 3] as Classe[]).map((c) => {
          const cl = CLASSI[c]
          const lista = (percorsi ?? []).filter((p) => p.classe === c).map((p) => ({ p, c: cercaPercorso(p, cerca) })).filter((x) => x.c.ok)
            // prima chi risponde dal titolo, poi chi solo da una tappa (l'ordine per data resta)
            .sort((a, b) => Number(!!a.c.tappa) - Number(!!b.c.tappa))
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
                {percorsi && lista.length === 0 && <p className="text-sm text-slate-500 p-3">{cerca.trim() ? 'Nessun risultato in questa classe.' : 'Nessun percorso. Creane uno nuovo!'}</p>}
                {lista.map(({ p, c: corr }) => <SchedaPercorso key={p.id} p={p} colore={cl.colore} evidenziata={evidenzia.includes(p.id)} tappaTrovata={corr.tappa} />)}
              </div>
            </section>
          )
        })}
      </main>
      <footer className="text-center text-xs text-slate-500 pb-6 px-4">
        I percorsi sono salvati in questo browser. Usa “💾 Backup” per farne una copia di sicurezza.
        Dati cartografici: Natural Earth, ISTAT/openpolis, fiumi italiani © OpenStreetMap contributors (ODbL).
      </footer>
    </div>
  )
}

function SchedaPercorso({ p, colore, evidenziata, tappaTrovata }: { p: Percorso; colore: string; evidenziata: boolean; tappaTrovata?: string }) {
  const [lavoro, setLavoro] = useState(false)
  const [condividi, setCondividi] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (evidenziata) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, [evidenziata])

  const azione = async (fn: () => Promise<unknown>, ok?: string) => {
    setLavoro(true)
    try {
      await fn()
      if (ok) toast(ok)
    } catch (e) {
      toast('Errore: ' + (e as Error).message, { errore: true })
    } finally {
      setLavoro(false)
    }
  }
  const elimina = async () => {
    const copia = await db.percorsi.get(p.id)
    await db.percorsi.delete(p.id)
    // i file (immagini, audio…) restano nel database: con "Annulla" il percorso torna intero
    if (copia) toast(`“${p.titolo}” eliminato`, { azione: { etichetta: 'Annulla', fn: () => db.percorsi.put(copia) } })
  }

  return (
    <div ref={ref} className={'rounded-xl border border-slate-200 p-3 hover:shadow-sm transition bg-white relative ' + (evidenziata ? 'ring-4 ring-amber-300' : '')} style={{ borderLeft: `5px solid ${colore}` }}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <Link to={'/modifica/' + p.id} className="font-bold text-slate-900 hover:underline block truncate">{p.titolo}</Link>
          <div className="text-xs text-slate-500">{p.tappe.length} tappe · modificato il {new Date(p.aggiornato).toLocaleDateString('it-IT')}</div>
          {p.descrizione && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{p.descrizione}</p>}
          {tappaTrovata && <p className="text-xs text-indigo-700 mt-1">🔎 Tappa: {tappaTrovata}</p>}
        </div>
        <Menu etichetta="⋯" className="btn-ghost px-3 py-2 text-lg leading-none" aria-label="Altre azioni">
          {(chiudi) => (
            <>
              <Link className="menu-voce" to={'/gioca/' + p.id} onClick={chiudi}>🎒 Prova come alunno</Link>
              <button className="menu-voce" onClick={() => { chiudi(); azione(() => scaricaPacchetto(p), 'Pacchetto scaricato') }}>💾 Esporta pacchetto per i colleghi</button>
              <button className="menu-voce" onClick={() => { chiudi(); azione(() => salvaPercorso(clonaPercorso(p)), 'Percorso duplicato') }}>📄 Duplica</button>
              <button className="menu-voce text-red-600" onClick={() => { chiudi(); elimina() }}>🗑️ Elimina</button>
            </>
          )}
        </Menu>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <Link className="btn text-white py-1.5 shadow-sm hover:brightness-110" style={{ background: colore }} to={'/presenta/' + p.id}>📺 Presenta</Link>
        <Link className="btn-secondario py-1.5" to={'/modifica/' + p.id}>✏️ Modifica</Link>
        <button className="btn-secondario py-1.5" onClick={() => setCondividi(true)}>📤 Condividi</button>
      </div>
      {lavoro && <div className="text-xs text-indigo-700 mt-2">Preparazione in corso…</div>}
      {condividi && <DialogoCondividi p={p} onClose={() => setCondividi(false)} />}
    </div>
  )
}

/** Spiega come far arrivare il percorso agli alunni (e ai colleghi) senza server */
export function DialogoCondividi({ p, onClose, prima }: { p: Percorso; onClose: () => void; prima?: () => Promise<unknown> }) {
  const [stato, setStato] = useState<'pronto' | 'lavoro' | 'fatto'>('pronto')
  const scarica = async () => {
    setStato('lavoro')
    try {
      await prima?.()
      await esportaPerAlunni(p)
      setStato('fatto')
    } catch (e) {
      setStato('pronto')
      toast('Errore: ' + (e as Error).message, { errore: true })
    }
  }
  const pacchetto = async () => {
    try { await prima?.(); await scaricaPacchetto(p); toast('Pacchetto scaricato') } catch (e) { toast('Errore: ' + (e as Error).message, { errore: true }) }
  }
  return (
    <Dialogo titolo={<>📤 Condividi “{p.titolo}”</>} onClose={onClose}
      piede={<button className="btn-secondario" onClick={onClose}>Chiudi</button>}>
      <h3 className="font-extrabold text-base">Con gli alunni</h3>
      <ol className="mt-2 space-y-3">
        <li className="flex gap-3">
          <span className="w-7 h-7 shrink-0 rounded-full bg-indigo-600 text-white grid place-items-center font-bold text-sm">1</span>
          <div className="flex-1">
            Scarica il <b>file per gli alunni</b>: un’unica pagina HTML con tutto dentro (carte comprese), che funziona anche senza internet.
            <div className="mt-2">
              <button className="btn-primario text-base px-4 py-2" onClick={scarica} disabled={stato === 'lavoro'}>
                {stato === 'lavoro' ? 'Preparazione…' : stato === 'fatto' ? '✓ Scaricato · scarica di nuovo' : '🎒 Scarica il file per gli alunni'}
              </button>
            </div>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="w-7 h-7 shrink-0 rounded-full bg-indigo-600 text-white grid place-items-center font-bold text-sm">2</span>
          <div>Caricalo su <b>Classroom</b>, sul <b>registro elettronico</b> o su <b>Drive</b>, come un normale allegato.</div>
        </li>
        <li className="flex gap-3">
          <span className="w-7 h-7 shrink-0 rounded-full bg-indigo-600 text-white grid place-items-center font-bold text-sm">3</span>
          <div>Gli alunni lo scaricano e lo aprono nel browser. Alla fine ottengono un <b>riepilogo con il punteggio</b> da stampare o salvare in PDF e consegnare.</div>
        </li>
      </ol>
      <p className="text-xs text-slate-500 mt-3">Suggerimento: aggiungendo <code>?lim</code> all’indirizzo del file, si apre in modalità presentazione.</p>
      <h3 className="font-extrabold text-base mt-5">Con i colleghi</h3>
      <p className="text-sm text-slate-600 mt-1">Il <b>pacchetto .geopercorso</b> è una copia modificabile: il collega la apre con “⬆ Importa”.</p>
      <button className="btn-secondario mt-2" onClick={pacchetto}>💾 Scarica il pacchetto modificabile</button>
    </Dialogo>
  )
}
