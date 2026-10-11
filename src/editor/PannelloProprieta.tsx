import { useEffect, useState, type ReactNode } from 'react'
import type { EditorApi } from './Editor'
import type { Elemento, MappaConfig } from '../types'
import { NOMI_ELEMENTI } from '../lib/fabbrica'
import { aggiungiAsset } from '../data/db'
import { getRuntime } from '../lib/runtime'
import { scegliFile } from './media'
import { EditorAttivita } from './EditorAttivita'
import { CampiMappa, EditorMappaModal } from './SelettoreMappa'
import { youtubeId } from '../elementi/ElementoView'

export function Campo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="etichetta">{label}</span>
      {children}
    </label>
  )
}

export function Sezione({ titolo, children }: { titolo: string; children: ReactNode }) {
  return (
    <div className="border-b border-slate-200 px-4 py-3">
      <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 mb-2">{titolo}</div>
      {children}
    </div>
  )
}

export function CaricaAsset({ assetId, accept, onChange, etichetta = 'Carica file' }: { assetId?: string; accept: string; onChange: (id?: string) => void; etichetta?: string }) {
  const [nome, setNome] = useState<string>()
  useEffect(() => {
    setNome(undefined)
    if (assetId) getRuntime().assetInfo(assetId).then((i) => setNome(i?.nome))
  }, [assetId])
  const carica = async () => {
    const [f] = await scegliFile(accept)
    if (f) onChange(await aggiungiAsset(f))
  }
  return (
    <div className="flex items-center gap-2">
      <button className="btn-secondario" onClick={carica}>📎 {assetId ? 'Sostituisci' : etichetta}</button>
      {assetId && <span className="text-xs text-slate-500 truncate flex-1" title={nome}>{nome ?? '…'}</span>}
      {assetId && <button className="btn-ghost px-2" title="Rimuovi" onClick={() => onChange(undefined)}>✕</button>}
    </div>
  )
}

const COLORI = ['#0f172a', '#ffffff', '#dc2626', '#ea580c', '#f59e0b', '#16a34a', '#0891b2', '#2563eb', '#4f46e5', '#9333ea', '#db2777', '#78716c']
const SFONDI = ['#ffffff', '#f8fafc', '#fef9c3', '#dcfce7', '#dbeafe', '#ffedd5', '#fce7f3', '#ede9fe', '#e0f2fe', '#1e293b', '#14532d', '#1e3a8a']

export function SceltaColore({ valore, onChange, colori = COLORI, trasparente }: { valore: string; onChange: (c: string) => void; colori?: string[]; trasparente?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {trasparente && (
        <button onClick={() => onChange('transparent')} title="Nessuno"
          className={'w-6 h-6 rounded-md border-2 bg-[repeating-conic-gradient(#ddd_0_25%,#fff_0_50%)] bg-[length:8px_8px] ' + (valore === 'transparent' ? 'border-indigo-600' : 'border-slate-300')} />
      )}
      {colori.map((c) => (
        <button key={c} onClick={() => onChange(c)} className={'w-6 h-6 rounded-md border-2 ' + (valore === c ? 'border-indigo-600 scale-110' : 'border-slate-300')} style={{ background: c }} />
      ))}
      <input type="color" value={valore.startsWith('#') ? valore : '#ffffff'} onChange={(e) => onChange(e.target.value)} className="w-7 h-7 p-0 border-0 bg-transparent cursor-pointer" />
    </div>
  )
}

export function PannelloProprieta({ api }: { api: EditorApi }) {
  const e = api.selezionato
  return (
    <aside className="w-80 shrink-0 bg-white border-l border-slate-200 overflow-auto">
      {e ? <ProprietaElemento api={api} e={e} /> : <ProprietaTappa api={api} />}
    </aside>
  )
}

function ProprietaTappa({ api }: { api: EditorApi }) {
  const t = api.tappa
  const set = (patch: Partial<typeof t>) => api.aggiornaTappa((x) => ({ ...x, ...patch }))
  return (
    <>
      <Sezione titolo="Tappa">
        <Campo label="Titolo"><input className="campo" value={t.titolo} onChange={(e) => set({ titolo: e.target.value })} /></Campo>
        <Campo label="Colore di sfondo"><SceltaColore valore={t.sfondo} onChange={(c) => set({ sfondo: c })} colori={SFONDI} /></Campo>
        <Campo label="Immagine di sfondo"><CaricaAsset assetId={t.sfondoAssetId} accept="image/*" onChange={(id) => set({ sfondoAssetId: id })} /></Campo>
      </Sezione>
      <Sezione titolo="Percorso">
        <Campo label="Descrizione (mostrata agli alunni all’inizio)">
          <textarea className="campo" rows={3} value={api.percorso.descrizione} onChange={(e) => api.aggiornaPercorso((p) => ({ ...p, descrizione: e.target.value }))} />
        </Campo>
      </Sezione>
      <div className="p-4 text-sm text-slate-500 space-y-2">
        <p>💡 Clicca un elemento sulla tela per modificarlo. Doppio clic su un testo per scriverci dentro.</p>
        <p>⌨️ <b>Canc</b> elimina · <b>Ctrl+D</b> duplica · <b>frecce</b> spostano · <b>Ctrl+Z</b> annulla</p>
        <p>📎 Trascina sulla tela immagini, PDF, audio e video dal tuo computer.</p>
      </div>
    </>
  )
}

function ProprietaElemento({ api, e }: { api: EditorApi; e: Elemento }) {
  const set = (patch: Record<string, unknown>) => api.aggiornaElemento(e.id, patch as Partial<Elemento>)
  const [editorMappa, setEditorMappa] = useState(false)
  return (
    <>
      <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
        <span className="font-extrabold flex-1">{NOMI_ELEMENTI[e.tipo]}</span>
        <button className="btn-ghost px-2" title="Porta in primo piano" onClick={() => api.spostaLivello(e.id, 'su')}>⬆</button>
        <button className="btn-ghost px-2" title="Porta sullo sfondo" onClick={() => api.spostaLivello(e.id, 'giu')}>⬇</button>
        <button className="btn-ghost px-2" title="Duplica (Ctrl+D)" onClick={() => api.duplicaElemento(e.id)}>📄</button>
        <button className="btn-pericolo px-2" title="Elimina (Canc)" onClick={() => api.eliminaElemento(e.id)}>🗑️</button>
      </div>

      {e.tipo === 'testo' && (
        <Sezione titolo="Testo">
          <textarea className="campo mb-3" rows={4} value={e.testo} onChange={(x) => set({ testo: x.target.value })} />
          <Campo label={`Dimensione: ${e.size}`}><input type="range" min={12} max={120} value={e.size} onChange={(x) => set({ size: +x.target.value })} className="w-full" /></Campo>
          <div className="flex gap-1 mb-3">
            <button className={'btn ' + (e.grassetto ? 'bg-slate-800 text-white' : 'btn-secondario')} onClick={() => set({ grassetto: !e.grassetto })}><b>G</b></button>
            {(['left', 'center', 'right'] as const).map((a) => (
              <button key={a} className={'btn ' + (e.allinea === a ? 'bg-slate-800 text-white' : 'btn-secondario')} onClick={() => set({ allinea: a })}>{{ left: '⇤', center: '↔', right: '⇥' }[a]}</button>
            ))}
          </div>
          <Campo label="Colore"><SceltaColore valore={e.colore} onChange={(c) => set({ colore: c })} /></Campo>
          <Campo label="Riquadro"><SceltaColore valore={e.sfondo} onChange={(c) => set({ sfondo: c })} colori={SFONDI} trasparente /></Campo>
        </Sezione>
      )}

      {e.tipo === 'immagine' && (
        <Sezione titolo="Immagine">
          <Campo label="File"><CaricaAsset assetId={e.assetId} accept="image/*" onChange={(id) => set({ assetId: id })} /></Campo>
          <Campo label="Adattamento">
            <select className="campo" value={e.adatta} onChange={(x) => set({ adatta: x.target.value })}>
              <option value="contain">Intera</option><option value="cover">Riempi il riquadro</option>
            </select>
          </Campo>
          <p className="text-xs text-slate-500">Suggerimento: aggiungi dei “Punti informativi” ℹ️ sopra l’immagine per renderla interattiva.</p>
        </Sezione>
      )}

      {e.tipo === 'video' && (
        <Sezione titolo="Video">
          <Campo label="Link YouTube">
            <input className="campo" placeholder="https://www.youtube.com/watch?v=…" value={e.youtube ?? ''} onChange={(x) => set({ youtube: x.target.value })} />
            {e.youtube && !youtubeId(e.youtube) && <span className="text-xs text-rose-600">Link non riconosciuto</span>}
          </Campo>
          <Campo label="Oppure un file video"><CaricaAsset assetId={e.assetId} accept="video/*" onChange={(id) => set({ assetId: id })} /></Campo>
          <p className="text-xs text-slate-500">I video YouTube richiedono internet. I file video vengono inclusi nel file per gli alunni (attenzione alle dimensioni).</p>
        </Sezione>
      )}

      {e.tipo === 'audio' && (
        <Sezione titolo="Audio">
          <Campo label="Etichetta"><input className="campo" value={e.etichetta} onChange={(x) => set({ etichetta: x.target.value })} /></Campo>
          <Campo label="File"><CaricaAsset assetId={e.assetId} accept="audio/*" onChange={(id) => set({ assetId: id })} /></Campo>
        </Sezione>
      )}

      {e.tipo === 'pdf' && (
        <Sezione titolo="PDF">
          <Campo label="File"><CaricaAsset assetId={e.assetId} accept="application/pdf" onChange={(id) => set({ assetId: id })} /></Campo>
          <p className="text-xs text-slate-500">Le pagine si sfogliano con le frecce. Puoi aggiungere punti informativi sopra il PDF.</p>
        </Sezione>
      )}

      {e.tipo === 'hotspot' && (
        <Sezione titolo="Punto informativo">
          <Campo label="Titolo"><input className="campo" value={e.titolo} onChange={(x) => set({ titolo: x.target.value })} /></Campo>
          <Campo label="Testo"><textarea className="campo" rows={4} value={e.testo} onChange={(x) => set({ testo: x.target.value })} /></Campo>
          <Campo label="Immagine (facoltativa)"><CaricaAsset assetId={e.assetId} accept="image/*" onChange={(id) => set({ assetId: id })} /></Campo>
          <Campo label="Icona">
            <div className="flex flex-wrap gap-1">
              {['ℹ️', '❓', '⭐', '📍', '👁️', '💡', '🏛️', '⛰️', '🌊', '🌋', '🏙️', '🍝', '🎨', '🔍'].map((i) => (
                <button key={i} onClick={() => set({ icona: i })} className={'w-8 h-8 rounded-md text-lg ' + (e.icona === i ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-slate-100')}>{i}</button>
              ))}
            </div>
          </Campo>
          <Campo label="Colore"><SceltaColore valore={e.colore} onChange={(c) => set({ colore: c })} /></Campo>
        </Sezione>
      )}

      {e.tipo === 'pulsante' && (
        <Sezione titolo="Pulsante">
          <Campo label="Scritta"><input className="campo" value={e.etichetta} onChange={(x) => set({ etichetta: x.target.value })} /></Campo>
          <Campo label="Quando lo clicchi, vai a…">
            <select className="campo" value={e.vaiA ?? (e.url !== undefined ? '__url' : '')} onChange={(x) => {
              const v = x.target.value
              set(v === '__url' ? { vaiA: undefined, url: e.url ?? 'https://' } : { vaiA: v || undefined, url: undefined })
            }}>
              <option value="">— niente —</option>
              {api.percorso.tappe.map((t, i) => <option key={t.id} value={t.id}>Tappa {i + 1}: {t.titolo}</option>)}
              <option value="__url">Un sito web…</option>
            </select>
            {e.vaiA && !api.percorso.tappe.some((t) => t.id === e.vaiA) && <span className="text-xs text-rose-600">La tappa di destinazione è stata eliminata: scegline un’altra</span>}
          </Campo>
          {e.url !== undefined && (
            <Campo label="Indirizzo">
              <input className="campo" value={e.url} onChange={(x) => set({ url: x.target.value })} />
              {e.url && !/^https?:\/\//i.test(e.url) && <span className="text-xs text-rose-600">L’indirizzo deve iniziare con https://</span>}
            </Campo>
          )}
          <Campo label="Colore"><SceltaColore valore={e.colore} onChange={(c) => set({ colore: c })} /></Campo>
          <p className="text-xs text-slate-500">Con i pulsanti puoi creare percorsi a bivi, come in un gioco.</p>
        </Sezione>
      )}

      {e.tipo === 'mappa' && (
        <Sezione titolo="Mappa">
          <CampiMappa config={e.mappa} onChange={(m: MappaConfig) => set({ mappa: m })} />
          <button className="btn-primario w-full justify-center mt-2" onClick={() => setEditorMappa(true)}>🎨 Colora e aggiungi contenuti</button>
          <p className="text-xs text-slate-500 mt-2">
            Nel percorso, cliccando un’area si apre la sua scheda con i dati e il contenuto che hai aggiunto.
            {Object.keys(e.contenuti).length > 0 && <> Contenuti aggiunti: <b>{Object.keys(e.contenuti).length}</b>.</>}
          </p>
          {editorMappa && <EditorMappaModal el={e} onChange={(patch) => set(patch)} onClose={() => setEditorMappa(false)} />}
        </Sezione>
      )}

      {e.tipo === 'attivita' && <EditorAttivita api={api} e={e} />}

      <Sezione titolo="Posizione e dimensioni">
        <div className="grid grid-cols-4 gap-1.5">
          {(['x', 'y', 'w', 'h'] as const).map((k) => (
            <label key={k} className="text-xs text-slate-500">
              {{ x: 'X', y: 'Y', w: 'Largh.', h: 'Alt.' }[k]}
              <input type="number" className="campo px-1.5" value={Math.round(e[k])} onChange={(x) => set({ [k]: +x.target.value })} />
            </label>
          ))}
        </div>
        <div className="flex gap-1 mt-2">
          <button className="btn-ghost text-xs" onClick={() => set({ x: 0, y: 0, w: 1280, h: 720 })}>⛶ Tutto schermo</button>
          <button className="btn-ghost text-xs" onClick={() => set({ x: Math.round((1280 - e.w) / 2) })}>↔ Centra</button>
        </div>
      </Sezione>
    </>
  )
}
