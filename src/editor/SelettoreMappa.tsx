import { useMemo, useState, type ReactNode } from 'react'
import type { Area, ContenutoArea, Elemento, MappaConfig, TipoMappa } from '../types'
import { NOMI_AREE } from '../types'
import { LIVELLI, NOMI_LIVELLI, conFocus, livelliPredefiniti } from '../geo/aree'
import { SceltaFocus } from '../geo/SceltaFocus'
import { MapView } from '../geo/MapView'
import { useGeo, type GeoFeature } from '../geo/useGeo'
import { livelliDisponibili, pool } from '../attivita/generatori'
import { mescola } from '../attivita/correzione'
import { CaricaAsset, Campo } from './PannelloProprieta'

export function Modal({ titolo, children, onClose, piede }: { titolo: string; children: ReactNode; onClose: () => void; piede?: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] bg-slate-900/60 grid place-items-center p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center px-5 py-3 border-b border-slate-200">
          <h2 className="text-lg font-extrabold">{titolo}</h2>
          <button className="ml-auto w-9 h-9 rounded-full hover:bg-slate-100 text-xl" onClick={onClose}>✕</button>
        </div>
        <div className="flex-1 min-h-0">{children}</div>
        {piede && <div className="px-5 py-3 border-t border-slate-200 flex items-center gap-2 bg-slate-50">{piede}</div>}
      </div>
    </div>
  )
}

export function SceltaTipo({ tipo, onChange }: { tipo: TipoMappa; onChange: (t: TipoMappa) => void }) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-slate-300 text-sm font-semibold">
      {(['politica', 'fisica'] as const).map((t) => (
        <button key={t} onClick={() => onChange(t)} className={'flex-1 px-3 py-1.5 ' + (tipo === t ? (t === 'fisica' ? 'bg-amber-700 text-white' : 'bg-sky-600 text-white') : 'bg-white hover:bg-slate-50')}>
          {t === 'politica' ? '🗺️ Politica' : '⛰️ Fisica'}
        </button>
      ))}
    </div>
  )
}

export function SceltaArea({ area, onChange }: { area: Area; onChange: (a: Area) => void }) {
  return (
    <select className="campo" value={area} onChange={(e) => onChange(e.target.value as Area)}>
      {(['italia', 'europa', 'mondo'] as Area[]).map((a) => <option key={a} value={a}>{NOMI_AREE[a]}</option>)}
    </select>
  )
}

/** Campi base di una mappa: area, politica/fisica, livelli, nomi */
export function CampiMappa({ config, onChange, senzaLivelli }: { config: MappaConfig; onChange: (c: MappaConfig) => void; senzaLivelli?: boolean /* giochi: niente livelli né nomi */ }) {
  const attivi = config.livelli ?? livelliPredefiniti(config.area, config.tipo)
  return (
    <>
      <Campo label="Area"><SceltaArea area={config.area} onChange={(a) => onChange({ ...config, area: a, livelli: undefined, colori: {}, focus: undefined })} /></Campo>
      <Campo label="Zoom su"><SceltaFocus area={config.area} valore={config.focus} onChange={(id) => onChange(conFocus(config, id))} /></Campo>
      <div className="mb-3"><span className="etichetta">Tipo di carta</span><SceltaTipo tipo={config.tipo} onChange={(t) => onChange({ ...config, tipo: t, livelli: undefined, colori: {} })} /></div>
      {!senzaLivelli && (
        <div className="mb-3">
          <span className="etichetta">Cosa mostrare</span>
          <div className="flex flex-wrap gap-1">
            {LIVELLI[config.tipo][config.area].map((l) => {
              const on = attivi.includes(l.id)
              return (
                <button key={l.id} onClick={() => onChange({ ...config, livelli: on ? attivi.filter((x) => x !== l.id) : [...attivi, l.id] })}
                  className={'px-2 py-0.5 rounded-full text-xs border ' + (on ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-white border-slate-200 text-slate-400')}>
                  {l.icona} {l.nome}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {!senzaLivelli && <label className="flex items-center gap-2 text-sm mb-1">
        <input type="checkbox" checked={config.etichette} onChange={(e) => onChange({ ...config, etichette: e.target.checked })} /> Mostra i nomi sulla carta
      </label>}
    </>
  )
}

const PALETTE = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#78716c', '#1e293b']

/** Editor della mappa: colori delle aree e contenuti che si aprono al click */
export function EditorMappaModal({ el, onChange, onClose }: { el: Extract<Elemento, { tipo: 'mappa' }>; onChange: (patch: { mappa?: MappaConfig; contenuti?: Record<string, ContenutoArea> }) => void; onClose: () => void }) {
  const [modo, setModo] = useState<'contenuti' | 'colora'>('contenuti')
  const [colore, setColore] = useState<string | null>(PALETTE[0])
  const [sel, setSel] = useState<GeoFeature | null>(null)
  const { data } = useGeo(el.mappa.area, el.mappa.tipo)
  const colori = el.mappa.colori ?? {}

  const click = (f: GeoFeature) => {
    const id = f.properties.id!
    if (modo === 'colora') {
      const nuovi = { ...colori }
      if (colore === null || nuovi[id] === colore) delete nuovi[id]
      else nuovi[id] = colore
      onChange({ mappa: { ...el.mappa, colori: nuovi } })
    } else setSel(f)
  }
  const contenuto = sel ? el.contenuti[sel.properties.id!] : undefined
  const setContenuto = (c: ContenutoArea | undefined) => {
    if (!sel) return
    const nuovi = { ...el.contenuti }
    if (c && (c.testo || c.assetId)) nuovi[sel.properties.id!] = c
    else delete nuovi[sel.properties.id!]
    onChange({ contenuti: nuovi })
  }
  const nome = (id: string) => data?.byId.get(id)?.properties.nome ?? id
  // le aree con contenuti hanno un bordo evidenziato
  const evid = Object.fromEntries(Object.keys(el.contenuti).filter((id) => !colori[id]).map((id) => [id, '#fde047']))

  return (
    <Modal titolo="Mappa: colori e contenuti" onClose={onClose} piede={<button className="btn-primario ml-auto" onClick={onClose}>Fatto</button>}>
      <div className="flex h-full">
        <div className="flex-1 min-w-0">
          <MapView config={el.mappa} onConfigChange={(m) => onChange({ mappa: m })} controlli cambioTipo={false}
            evidenzia={{ ...evid, ...(sel && modo === 'contenuti' ? { [sel.properties.id!]: '#a5b4fc' } : {}) }} onFeatureClick={click} />
        </div>
        <div className="w-80 shrink-0 border-l border-slate-200 p-4 overflow-auto">
          <div className="flex rounded-lg overflow-hidden border border-slate-300 text-sm font-semibold mb-4">
            <button className={'flex-1 py-1.5 ' + (modo === 'contenuti' ? 'bg-indigo-600 text-white' : '')} onClick={() => setModo('contenuti')}>📝 Contenuti</button>
            <button className={'flex-1 py-1.5 ' + (modo === 'colora' ? 'bg-indigo-600 text-white' : '')} onClick={() => setModo('colora')}>🎨 Colora</button>
          </div>
          {modo === 'colora' ? (
            <>
              <p className="text-sm text-slate-600 mb-2">Scegli un colore e clicca le aree, i fiumi, le città… per colorarli. Clicca di nuovo per togliere il colore.</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {PALETTE.map((c) => <button key={c} onClick={() => setColore(c)} className={'w-8 h-8 rounded-lg border-2 ' + (colore === c ? 'border-slate-900 scale-110' : 'border-white shadow')} style={{ background: c }} />)}
                <button onClick={() => setColore(null)} className={'h-8 px-2 rounded-lg border-2 text-sm ' + (colore === null ? 'border-slate-900' : 'border-slate-200')}>🧽 Gomma</button>
              </div>
              {Object.keys(colori).length > 0 && <button className="btn-ghost text-sm" onClick={() => onChange({ mappa: { ...el.mappa, colori: {} } })}>Togli tutti i colori</button>}
            </>
          ) : sel ? (
            <>
              <div className="text-xs uppercase text-slate-500">{sel.properties.tipo}</div>
              <h3 className="text-xl font-extrabold mb-3">{sel.properties.nome}</h3>
              <Campo label="Testo che compare cliccando">
                <textarea className="campo" rows={6} value={contenuto?.testo ?? ''} placeholder="Es. curiosità, appunti della lezione, domande…"
                  onChange={(e) => setContenuto({ ...contenuto, testo: e.target.value })} />
              </Campo>
              <Campo label="Immagine">
                <CaricaAsset assetId={contenuto?.assetId} accept="image/*" onChange={(id) => setContenuto({ testo: contenuto?.testo ?? '', assetId: id })} />
              </Campo>
              <p className="text-xs text-slate-500">La scheda mostra già automaticamente i dati principali (capoluogo, altezza, lunghezza…).</p>
            </>
          ) : (
            <p className="text-sm text-slate-600">Clicca un elemento della carta per aggiungere un testo o un’immagine che gli alunni vedranno cliccandolo.</p>
          )}
          {Object.keys(el.contenuti).length > 0 && (
            <div className="mt-5">
              <div className="etichetta">Elementi con contenuti</div>
              <ul className="text-sm space-y-1">
                {Object.keys(el.contenuti).map((id) => (
                  <li key={id}><button className="text-indigo-700 hover:underline" onClick={() => { setModo('contenuti'); setSel(data?.byId.get(id) ?? null) }}>📝 {nome(id)}</button></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

/** Scelta dei luoghi per i giochi "Trova" ed "Etichette" */
export function SelettoreLuoghi({ config, obiettivi, onChange, onClose }: { config: MappaConfig; obiettivi: string[]; onChange: (ids: string[], config: MappaConfig) => void; onClose: () => void }) {
  const { data } = useGeo(config.area, config.tipo)
  const livelli = useMemo(() => (data ? livelliDisponibili(data, config.focus) : []), [data, config.focus])
  const [livello, setLivello] = useState<string | null>(null)
  const liv = livello ?? (obiettivi.length && data ? data.byId.get(obiettivi[0])?.properties.livello : null) ?? livelli[0]
  const sel = new Set(obiettivi)
  const mappa: MappaConfig = { ...config, livelli: liv ? [...new Set([...(config.livelli ?? livelliPredefiniti(config.area, config.tipo)), liv])] : config.livelli, etichette: true }

  const toggle = (f: GeoFeature) => {
    const id = f.properties.id!
    onChange(sel.has(id) ? obiettivi.filter((x) => x !== id) : [...obiettivi, id], config)
  }
  const tutti = data && liv ? pool(data, liv, undefined, config.focus) : []
  const nome = (id: string) => data?.byId.get(id)?.properties.nome ?? id

  return (
    <Modal titolo="Scegli i luoghi del gioco" onClose={onClose}
      piede={<><span className="text-sm text-slate-600">Selezionati: <b>{obiettivi.length}</b></span><button className="btn-primario ml-auto" onClick={onClose}>Fatto</button></>}>
      <div className="flex h-full">
        <div className="flex-1 min-w-0">
          <MapView config={mappa} selezionabile={(f) => f.properties.livello === liv}
            evidenzia={Object.fromEntries(obiettivi.map((id) => [id, '#6366f1']))} onFeatureClick={toggle} />
        </div>
        <div className="w-80 shrink-0 border-l border-slate-200 p-4 overflow-auto">
          <div className="mb-3"><span className="etichetta">Tipo di carta</span><SceltaTipo tipo={config.tipo} onChange={(t) => { setLivello(null); onChange([], { ...config, tipo: t, livelli: undefined }) }} /></div>
          <span className="etichetta">Cosa cercare</span>
          <div className="flex flex-wrap gap-1 mb-3">
            {livelli.map((l) => (
              <button key={l} onClick={() => setLivello(l)} className={'px-2 py-1 rounded-full text-xs border ' + (l === liv ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-300')}>
                {NOMI_LIVELLI[l] ?? l}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-600 mb-2">Clicca sulla carta per aggiungere o togliere un luogo.</p>
          <div className="flex gap-1 mb-3 flex-wrap">
            <button className="btn-secondario text-xs" onClick={() => onChange([...new Set([...obiettivi, ...mescola(tutti.filter((f) => !sel.has(f.properties.id!))).slice(0, 5).map((f) => f.properties.id!)])], config)}>🎲 +5 a caso</button>
            {tutti.length <= 60 && <button className="btn-secondario text-xs" onClick={() => onChange([...new Set([...obiettivi, ...tutti.map((f) => f.properties.id!)])], config)}>Tutti</button>}
            {obiettivi.length > 0 && <button className="btn-ghost text-xs" onClick={() => onChange([], config)}>Svuota</button>}
          </div>
          <ul className="flex flex-wrap gap-1">
            {obiettivi.map((id) => (
              <li key={id} className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-sm flex items-center gap-1">
                {nome(id)}<button onClick={() => onChange(obiettivi.filter((x) => x !== id), config)} className="text-indigo-500 hover:text-indigo-900">✕</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  )
}
