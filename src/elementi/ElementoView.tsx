import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Elemento } from '../types'
import { getRuntime, useAssetUrl } from '../lib/runtime'
import { MapView } from '../geo/MapView'
import { AttivitaView } from '../attivita/AttivitaView'
import type { Risultato } from '../attivita/correzione'

export type Modo = 'editor' | 'lim' | 'alunno'

export interface PropsElemento {
  el: Elemento
  modo: Modo
  onVai?: (tappaId: string) => void
  onRisultato?: (r: Risultato) => void
}

export function ElementoView({ el, modo, onVai, onRisultato }: PropsElemento) {
  const statico = modo === 'editor'
  switch (el.tipo) {
    case 'testo':
      return (
        <div className="w-full h-full overflow-hidden whitespace-pre-wrap leading-snug rounded-xl"
          style={{ fontSize: el.size, color: el.colore, background: el.sfondo, fontWeight: el.grassetto ? 800 : 400, textAlign: el.allinea, padding: el.sfondo !== 'transparent' ? '0.4em 0.6em' : 0 }}>
          {el.testo}
        </div>
      )
    case 'immagine':
      return <Immagine assetId={el.assetId} adatta={el.adatta} />
    case 'video':
      return <Video el={el} />
    case 'audio':
      return <Audio assetId={el.assetId} etichetta={el.etichetta} />
    case 'pdf':
      return <Pdf assetId={el.assetId} />
    case 'hotspot':
      return <Hotspot el={el} statico={statico} />
    case 'pulsante':
      return (
        <button
          className="w-full h-full rounded-2xl text-white font-extrabold shadow-lg hover:brightness-110 active:scale-95 transition text-2xl px-3"
          style={{ background: el.colore }}
          onClick={() => {
            if (statico) return
            if (el.vaiA) onVai?.(el.vaiA)
            // solo siti web veri: niente "javascript:" o altri schemi nel file che gira tra gli alunni
            else if (el.url && /^https?:\/\//i.test(el.url)) window.open(el.url, '_blank', 'noopener')
          }}
        >
          {el.etichetta}
        </button>
      )
    case 'mappa':
      return <MappaElemento el={el} statico={statico} />
    case 'attivita':
      return <AttivitaView key={statico ? JSON.stringify(el.attivita) : el.id} att={el.attivita} statico={statico} onRisultato={onRisultato} />
  }
}

function Vuoto({ icona, testo }: { icona: string; testo: string }) {
  return (
    <div className="w-full h-full grid place-items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 text-center p-2">
      <div><div className="text-4xl">{icona}</div><div className="text-sm">{testo}</div></div>
    </div>
  )
}

function Immagine({ assetId, adatta }: { assetId?: string; adatta: 'contain' | 'cover' }) {
  const url = useAssetUrl(assetId)
  if (!assetId) return <Vuoto icona="🖼️" testo="Scegli un’immagine" />
  if (!url) return null
  return <img src={url} alt="" draggable={false} className="w-full h-full rounded-xl" style={{ objectFit: adatta }} />
}

export function youtubeId(s?: string) {
  if (!s) return null
  const m = s.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) ?? s.match(/^([\w-]{11})$/)
  return m ? m[1] : null
}

function Video({ el }: { el: Extract<Elemento, { tipo: 'video' }> }) {
  const url = useAssetUrl(el.assetId)
  const yt = youtubeId(el.youtube)
  if (yt) return <iframe className="w-full h-full rounded-xl bg-black" src={`https://www.youtube-nocookie.com/embed/${yt}`} allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen title="Video" />
  if (url) return <video src={url} controls className="w-full h-full rounded-xl bg-black" />
  return <Vuoto icona="🎬" testo="Carica un video o incolla un link YouTube" />
}

function Audio({ assetId, etichetta }: { assetId?: string; etichetta: string }) {
  const url = useAssetUrl(assetId)
  if (!assetId) return <Vuoto icona="🎧" testo="Carica un file audio" />
  return (
    <div className="w-full h-full rounded-2xl bg-white shadow border border-slate-200 flex items-center gap-3 px-3">
      <span className="text-3xl">🎧</span>
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{etichetta}</div>
        {url && <audio src={url} controls className="w-full h-9" />}
      </div>
    </div>
  )
}

function Pdf({ assetId }: { assetId?: string }) {
  const [pagine, setPagine] = useState<string[] | null>(null)
  const [i, setI] = useState(0)
  const [errore, setErrore] = useState(false)
  useEffect(() => {
    setPagine(null)
    setI(0)
    if (assetId) getRuntime().pdfPagine(assetId).then((p) => setPagine(p ?? [])).catch(() => setErrore(true))
  }, [assetId])
  if (!assetId) return <Vuoto icona="📄" testo="Carica un PDF" />
  if (errore) return <Vuoto icona="⚠️" testo="PDF non leggibile" />
  if (!pagine) return <Vuoto icona="⏳" testo="Caricamento PDF…" />
  return (
    <div className="w-full h-full flex flex-col bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
      <div className="flex-1 min-h-0 overflow-auto grid place-items-center p-1">
        <img src={pagine[i]} alt={`Pagina ${i + 1}`} className="max-w-full max-h-full shadow" draggable={false} />
      </div>
      {pagine.length > 1 && (
        <div className="flex items-center justify-center gap-3 py-1 bg-white text-sm">
          <button className="btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}>◀</button>
          <span>Pagina {i + 1} / {pagine.length}</span>
          <button className="btn-ghost" disabled={i === pagine.length - 1} onClick={() => setI(i + 1)}>▶</button>
        </div>
      )}
    </div>
  )
}

function Hotspot({ el, statico }: { el: Extract<Elemento, { tipo: 'hotspot' }>; statico: boolean }) {
  const [aperto, setAperto] = useState(false)
  const img = useAssetUrl(el.assetId)
  return (
    <>
      <button onClick={() => !statico && setAperto(true)} className="relative w-full h-full rounded-full grid place-items-center shadow-lg text-white font-bold border-4 border-white"
        style={{ background: el.colore, fontSize: Math.min(el.w, el.h) * 0.45 }} title={el.titolo}>
        {!statico && <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: el.colore }} />}
        <span className="relative">{el.icona}</span>
      </button>
      {aperto && createPortal(
        <div className="fixed inset-0 z-[100] bg-slate-900/50 grid place-items-center p-4" onClick={() => setAperto(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-auto p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button className="absolute right-3 top-3 w-9 h-9 rounded-full hover:bg-slate-100 text-xl" onClick={() => setAperto(false)}>✕</button>
            <h3 className="text-2xl font-extrabold pr-10 flex items-center gap-2"><span>{el.icona}</span>{el.titolo}</h3>
            {img && <img src={img} alt="" className="mt-3 rounded-xl w-full max-h-80 object-contain bg-slate-50" />}
            <p className="mt-3 text-lg whitespace-pre-wrap">{el.testo}</p>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

function MappaElemento({ el, statico }: { el: Extract<Elemento, { tipo: 'mappa' }>; statico: boolean }) {
  // nel player si possono cambiare i livelli senza modificare il percorso
  const [config, setConfig] = useState(el.mappa)
  useEffect(() => setConfig(el.mappa), [el.mappa])
  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow border border-slate-300">
      <MapView config={statico ? el.mappa : config} onConfigChange={setConfig} controlli={!statico && el.w >= 500} cambioTipo={false}
        scheda={!statico} contenuti={el.contenuti} zoomAbilitato={!statico} />
    </div>
  )
}
