import { useState, type ReactNode } from 'react'
import type { EditorApi } from './Editor'
import { Menu } from './Editor'
import { NOMI_ATTIVITA, nuovaAttivita, nuovoElemento } from '../lib/fabbrica'
import { CLASSI, STAGE_H, STAGE_W, type TipoAttivita, type TipoElemento } from '../types'
import { elementoDaFile, scegliFile } from './media'
import { Generatore } from './Generatore'

const STILE_VOCE = 'flex flex-col items-center px-2.5 py-1 rounded-lg hover:bg-white text-slate-700 min-w-14'

/** Pulsante della barra: icona sopra, nome sotto */
function Voce({ icona, testo, freccia }: { icona: string; testo: string; freccia?: boolean }) {
  return (
    <>
      <span className="text-xl leading-none" aria-hidden>{icona}</span>
      <span className="text-[11px] font-semibold mt-0.5">{testo}{freccia && ' ▾'}</span>
    </>
  )
}

function VoceMenu({ icona, nome, descr, onClick }: { icona: string; nome: string; descr: string; onClick: () => void }) {
  return (
    <button className="menu-voce" onClick={onClick}>
      <span className="text-lg w-7 text-center" aria-hidden>{icona}</span>
      <span><span className="font-semibold block">{nome}</span><span className="text-xs text-slate-500">{descr}</span></span>
    </button>
  )
}

function Gruppo({ icona, testo, children }: { icona: string; testo: string; children: (chiudi: () => void) => ReactNode }) {
  return <Menu sinistra className={STILE_VOCE} etichetta={<Voce icona={icona} testo={testo} freccia />}>{children}</Menu>
}

export function BarraStrumenti({ api }: { api: EditorApi }) {
  const [genera, setGenera] = useState(false)
  const area = CLASSI[api.percorso.classe].area

  const aggiungi = (tipo: TipoElemento) => api.aggiungiElemento(nuovoElemento(tipo, {}, area))
  /**
   * Tutti i media funzionano allo stesso modo: si sceglie il file e l'elemento compare già pronto.
   * Se si chiude la finestra senza scegliere, si crea il riquadro vuoto (il file si sceglie poi dal pannello).
   */
  const media = async (tipo: 'immagine' | 'video' | 'audio' | 'pdf', accept: string) => {
    const files = await scegliFile(accept, true)
    if (!files.length) return aggiungi(tipo)
    for (const f of files) {
      const el = await elementoDaFile(f)
      if (el) api.aggiungiElemento(el)
    }
  }
  const attivita = (tipo: TipoAttivita) => {
    const grande = tipo === 'trova' || tipo === 'etichette' || tipo === 'coordinate'
    const w = grande ? 1180 : 860
    const h = grande ? 620 : 560
    api.aggiungiElemento(nuovoElemento('attivita', { attivita: nuovaAttivita(tipo, area), w, h, x: (STAGE_W - w) / 2, y: (STAGE_H - h) / 2 + 30 } as never, area))
  }

  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 bg-slate-100 border-b border-slate-300 flex-wrap">
      <button onClick={() => aggiungi('testo')} className={STILE_VOCE} title="Aggiungi un testo"><Voce icona="🔤" testo="Testo" /></button>
      <Gruppo icona="🖼️" testo="Media">
        {(chiudi) => (
          <>
            <VoceMenu icona="🖼️" nome="Immagine" descr="Foto, carte, disegni dal computer" onClick={() => { chiudi(); media('immagine', 'image/*') }} />
            <VoceMenu icona="▶️" nome="Video YouTube" descr="Incolla il link nel pannello a destra" onClick={() => { chiudi(); aggiungi('video') }} />
            <VoceMenu icona="🎬" nome="Video da file" descr="Incluso nel file per gli alunni (attenzione al peso)" onClick={() => { chiudi(); media('video', 'video/*') }} />
            <VoceMenu icona="🎧" nome="Audio" descr="Registrazioni, musiche, letture" onClick={() => { chiudi(); media('audio', 'audio/*') }} />
            <VoceMenu icona="📄" nome="PDF" descr="Pagine da sfogliare con le frecce" onClick={() => { chiudi(); media('pdf', 'application/pdf') }} />
            <div className="px-3 py-1.5 text-xs text-slate-500 border-t border-slate-100 mt-1">💡 Puoi anche trascinare i file direttamente sulla tela.</div>
          </>
        )}
      </Gruppo>
      <Gruppo icona="👆" testo="Interazioni">
        {(chiudi) => (
          <>
            <VoceMenu icona="ℹ️" nome="Punto informativo" descr="Un cerchio che apre una scheda con testo e immagine" onClick={() => { chiudi(); aggiungi('hotspot') }} />
            <VoceMenu icona="🔘" nome="Pulsante" descr="Porta a un’altra tappa o a un sito (percorsi a bivi)" onClick={() => { chiudi(); aggiungi('pulsante') }} />
          </>
        )}
      </Gruppo>
      <button onClick={() => aggiungi('mappa')} className={STILE_VOCE} title="Aggiungi una carta politica o fisica"><Voce icona="🗺️" testo="Mappa" /></button>
      <div className="w-px h-8 bg-slate-300 mx-1" />
      <Gruppo icona="🎯" testo="Attività">
        {(chiudi) => (Object.keys(NOMI_ATTIVITA) as TipoAttivita[]).map((t) => (
          <VoceMenu key={t} icona={NOMI_ATTIVITA[t].icona} nome={NOMI_ATTIVITA[t].nome} descr={NOMI_ATTIVITA[t].descr} onClick={() => { chiudi(); attivita(t) }} />
        ))}
      </Gruppo>
      <button onClick={() => setGenera(true)} className="ml-2 btn bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white shadow">✨ Genera dalla mappa</button>
      {genera && <Generatore api={api} onClose={() => setGenera(false)} />}
    </div>
  )
}
