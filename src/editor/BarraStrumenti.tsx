import { useState } from 'react'
import type { EditorApi } from './Editor'
import { Menu } from './Editor'
import { NOMI_ATTIVITA, nuovaAttivita, nuovoElemento } from '../lib/fabbrica'
import { CLASSI, STAGE_H, STAGE_W, type TipoAttivita, type TipoElemento } from '../types'
import { ACCETTA_MEDIA, elementoDaFile, scegliFile } from './media'
import { Generatore } from './Generatore'

export function BarraStrumenti({ api }: { api: EditorApi }) {
  const [genera, setGenera] = useState(false)
  const area = CLASSI[api.percorso.classe].area

  const aggiungi = (tipo: TipoElemento) => api.aggiungiElemento(nuovoElemento(tipo, {}, area))
  const carica = async (accept: string) => {
    for (const f of await scegliFile(accept, true)) {
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

  const B = ({ icona, testo, onClick }: { icona: string; testo: string; onClick: () => void }) => (
    <button onClick={onClick} className="flex flex-col items-center px-2.5 py-1 rounded-lg hover:bg-white text-slate-700 min-w-14" title={testo}>
      <span className="text-xl leading-none">{icona}</span>
      <span className="text-[11px] font-semibold mt-0.5">{testo}</span>
    </button>
  )

  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 bg-slate-100 border-b border-slate-300 flex-wrap">
      <B icona="🔤" testo="Testo" onClick={() => aggiungi('testo')} />
      <B icona="🖼️" testo="Immagine" onClick={() => carica('image/*')} />
      <B icona="🎬" testo="Video" onClick={() => aggiungi('video')} />
      <B icona="🎧" testo="Audio" onClick={() => carica('audio/*')} />
      <B icona="📄" testo="PDF" onClick={() => carica('application/pdf')} />
      <B icona="📎" testo="Carica file" onClick={() => carica(ACCETTA_MEDIA)} />
      <div className="w-px h-8 bg-slate-300 mx-1" />
      <B icona="ℹ️" testo="Punto info" onClick={() => aggiungi('hotspot')} />
      <B icona="🔘" testo="Pulsante" onClick={() => aggiungi('pulsante')} />
      <B icona="🗺️" testo="Mappa" onClick={() => aggiungi('mappa')} />
      <div className="w-px h-8 bg-slate-300 mx-1" />
      <Menu sinistra className="flex flex-col items-center px-2.5 py-1 rounded-lg hover:bg-white text-slate-700"
        etichetta={<><span className="text-xl leading-none">🎯</span><span className="text-[11px] font-semibold mt-0.5">Attività ▾</span></>}>
        {(chiudi) => (Object.keys(NOMI_ATTIVITA) as TipoAttivita[]).map((t) => (
          <button key={t} className="menu-voce" onClick={() => { chiudi(); attivita(t) }}>
            <span className="text-lg">{NOMI_ATTIVITA[t].icona}</span>
            <span><span className="font-semibold block">{NOMI_ATTIVITA[t].nome}</span><span className="text-xs text-slate-500">{NOMI_ATTIVITA[t].descr}</span></span>
          </button>
        ))}
      </Menu>
      <button onClick={() => setGenera(true)} className="ml-2 btn bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white shadow">✨ Genera dalla mappa</button>
      {genera && <Generatore api={api} onClose={() => setGenera(false)} />}
    </div>
  )
}
