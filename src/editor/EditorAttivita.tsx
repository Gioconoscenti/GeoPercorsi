import { useState } from 'react'
import type { EditorApi } from './Editor'
import type { Attivita, DomandaQuiz, Elemento, PuntoCoordinate, TipoAttivita } from '../types'
import { useGeo } from '../geo/useGeo'
import { pool } from '../attivita/generatori'
import { mescola } from '../attivita/correzione'
import { CLASSI } from '../types'
import { NOMI_ATTIVITA, TOLLERANZA, nuovaAttivita } from '../lib/fabbrica'
import { Campo, CaricaAsset, Sezione } from './PannelloProprieta'
import { CampiMappa, SelettoreLuoghi } from './SelettoreMappa'
import { analizzaCompleta } from '../attivita/correzione'

type El = Extract<Elemento, { tipo: 'attivita' }>

function Lista<T>({ voci, onChange, nuova, render, etichettaNuova = '＋ Aggiungi' }: {
  voci: T[]
  onChange: (v: T[]) => void
  nuova: () => T
  render: (v: T, set: (v: T) => void, i: number) => React.ReactNode
  etichettaNuova?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      {voci.map((v, i) => (
        <div key={i} className="rounded-lg border border-slate-200 p-2 bg-slate-50 relative">
          <div className="absolute right-1 top-1 flex">
            <button className="text-xs px-1 text-slate-400 hover:text-slate-800" disabled={i === 0} onClick={() => { const a = [...voci]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; onChange(a) }} title="Su">▲</button>
            <button className="text-xs px-1 text-slate-400 hover:text-rose-600" onClick={() => onChange(voci.filter((_, j) => j !== i))} title="Elimina">✕</button>
          </div>
          {render(v, (nv) => onChange(voci.map((x, j) => (j === i ? nv : x))), i)}
        </div>
      ))}
      <button className="btn-secondario justify-center" onClick={() => onChange([...voci, nuova()])}>{etichettaNuova}</button>
    </div>
  )
}

export function EditorAttivita({ api, e }: { api: EditorApi; e: El }) {
  const a = e.attivita
  const set = (att: Attivita) => api.aggiornaElemento(e.id, { attivita: att } as Partial<Elemento>)
  const [luoghi, setLuoghi] = useState(false)
  const area = CLASSI[api.percorso.classe].area

  const cambiaTipo = (t: TipoAttivita) => {
    if (t === a.tipo) return
    if (!confirm('Cambiando tipo perderai il contenuto attuale dell’attività. Continuare?')) return
    set({ ...nuovaAttivita(t, area), titolo: a.titolo })
  }

  return (
    <Sezione titolo="Attività">
      <Campo label="Tipo">
        <select className="campo" value={a.tipo} onChange={(x) => cambiaTipo(x.target.value as TipoAttivita)}>
          {(Object.keys(NOMI_ATTIVITA) as TipoAttivita[]).map((t) => <option key={t} value={t}>{NOMI_ATTIVITA[t].icona} {NOMI_ATTIVITA[t].nome}</option>)}
        </select>
      </Campo>
      <Campo label="Titolo"><input className="campo" value={a.titolo} onChange={(x) => set({ ...a, titolo: x.target.value })} /></Campo>

      {a.tipo === 'quiz' && (
        <Lista voci={a.domande} onChange={(domande) => set({ ...a, domande })} etichettaNuova="＋ Domanda"
          nuova={(): DomandaQuiz => ({ domanda: 'Nuova domanda', opzioni: ['Risposta giusta', 'Risposta sbagliata'], corrette: [0] })}
          render={(d, setD, i) => (
            <>
              <div className="text-xs font-bold text-slate-500 mb-1">Domanda {i + 1}</div>
              <textarea className="campo mb-1" rows={2} value={d.domanda} onChange={(x) => setD({ ...d, domanda: x.target.value })} />
              <div className="text-xs text-slate-500 mb-1">Spunta le risposte giuste:</div>
              {d.opzioni.map((o, k) => (
                <div key={k} className="flex items-center gap-1 mb-1">
                  <input type="checkbox" checked={d.corrette.includes(k)} title="Risposta giusta"
                    onChange={() => setD({ ...d, corrette: d.corrette.includes(k) ? d.corrette.filter((c) => c !== k) : [...d.corrette, k] })} />
                  <input className="campo py-1" value={o} onChange={(x) => setD({ ...d, opzioni: d.opzioni.map((y, j) => (j === k ? x.target.value : y)) })} />
                  <button className="text-slate-400 hover:text-rose-600 px-1" disabled={d.opzioni.length <= 2}
                    onClick={() => setD({ ...d, opzioni: d.opzioni.filter((_, j) => j !== k), corrette: d.corrette.filter((c) => c !== k).map((c) => (c > k ? c - 1 : c)) })}>✕</button>
                </div>
              ))}
              {d.opzioni.length < 6 && <button className="text-xs text-indigo-700 font-semibold" onClick={() => setD({ ...d, opzioni: [...d.opzioni, 'Nuova risposta'] })}>＋ risposta</button>}
              {d.corrette.length === 0 && <div className="text-xs text-rose-600">Spunta almeno una risposta giusta</div>}
              <div className="mt-1"><CaricaAsset assetId={d.assetId} accept="image/*" etichetta="Immagine" onChange={(id) => setD({ ...d, assetId: id })} /></div>
            </>
          )} />
      )}

      {a.tipo === 'vf' && (
        <Lista voci={a.affermazioni} onChange={(affermazioni) => set({ ...a, affermazioni })} etichettaNuova="＋ Affermazione"
          nuova={() => ({ testo: 'Nuova affermazione', vera: true })}
          render={(v, setV) => (
            <>
              <textarea className="campo mb-1 pr-10" rows={2} value={v.testo} onChange={(x) => setV({ ...v, testo: x.target.value })} />
              <div className="flex gap-1">
                <button className={'btn py-0.5 ' + (v.vera ? 'bg-emerald-600 text-white' : 'btn-secondario')} onClick={() => setV({ ...v, vera: true })}>Vera</button>
                <button className={'btn py-0.5 ' + (!v.vera ? 'bg-rose-600 text-white' : 'btn-secondario')} onClick={() => setV({ ...v, vera: false })}>Falsa</button>
              </div>
            </>
          )} />
      )}

      {a.tipo === 'abbina' && (
        <Lista voci={a.coppie} onChange={(coppie) => set({ ...a, coppie })} etichettaNuova="＋ Coppia"
          nuova={() => ({ a: '', b: '' })}
          render={(c, setC) => (
            <div className="flex items-center gap-1 pr-10">
              <input className="campo py-1" placeholder="Sinistra" value={c.a} onChange={(x) => setC({ ...c, a: x.target.value })} />
              <span>↔</span>
              <input className="campo py-1" placeholder="Destra" value={c.b} onChange={(x) => setC({ ...c, b: x.target.value })} />
            </div>
          )} />
      )}

      {a.tipo === 'completa' && (
        <>
          <Campo label="Testo">
            <textarea className="campo" rows={7} value={a.testo} onChange={(x) => set({ ...a, testo: x.target.value })} />
          </Campo>
          <p className="text-xs text-slate-500">
            Metti tra <b>[parentesi quadre]</b> le parole da far completare. Per accettare più risposte separale con <b>|</b>, es. <code>[Tevere|fiume Tevere]</code>.
            Spazi da completare: <b>{analizzaCompleta(a.testo).filter((p) => p.tipo === 'buco').length}</b>
          </p>
        </>
      )}

      {a.tipo === 'ordina' && (
        <>
          <Campo label="Consegna"><input className="campo" value={a.consegna} onChange={(x) => set({ ...a, consegna: x.target.value })} /></Campo>
          <p className="text-xs text-slate-500 mb-2">Scrivi gli elementi <b>nell’ordine giusto</b>: verranno mescolati per gli alunni.</p>
          <Lista voci={a.elementi} onChange={(elementi) => set({ ...a, elementi })} nuova={() => 'Nuovo elemento'}
            render={(v, setV, i) => (
              <div className="flex items-center gap-1 pr-10"><span className="text-xs font-bold w-5">{i + 1}.</span><input className="campo py-1" value={v} onChange={(x) => setV(x.target.value)} /></div>
            )} />
        </>
      )}

      {a.tipo === 'flashcard' && (
        <Lista voci={a.carte} onChange={(carte) => set({ ...a, carte })} etichettaNuova="＋ Carta"
          nuova={(): { fronte: string; retro: string; assetId?: string } => ({ fronte: '', retro: '' })}
          render={(c, setC) => (
            <div className="pr-10">
              <input className="campo py-1 mb-1" placeholder="Fronte" value={c.fronte} onChange={(x) => setC({ ...c, fronte: x.target.value })} />
              <textarea className="campo py-1 mb-1" rows={2} placeholder="Retro" value={c.retro} onChange={(x) => setC({ ...c, retro: x.target.value })} />
              <CaricaAsset assetId={c.assetId} accept="image/*" etichetta="Immagine" onChange={(id) => setC({ ...c, assetId: id })} />
            </div>
          )} />
      )}

      {a.tipo === 'coordinate' && <EditorCoordinate a={a} set={set} />}

      {(a.tipo === 'trova' || a.tipo === 'etichette') && (
        <>
          <CampiMappa config={a.mappa} senzaLivelli onChange={(m) => set({ ...a, mappa: { ...m, etichette: false }, obiettivi: m.area !== a.mappa.area || m.tipo !== a.mappa.tipo || m.focus !== a.mappa.focus ? [] : a.obiettivi })} />
          <button className="btn-primario w-full justify-center mt-3" onClick={() => setLuoghi(true)}>📍 Scegli i luoghi ({a.obiettivi.length})</button>
          <p className="text-xs text-slate-500 mt-2">
            {a.tipo === 'trova' ? 'Gli alunni dovranno cliccare i luoghi uno alla volta. Punto pieno se lo trovano al primo tentativo.' : 'Gli alunni toccano un nome e poi il luogo giusto sulla carta.'}
          </p>
          {luoghi && <SelettoreLuoghi config={a.mappa} obiettivi={a.obiettivi} onChange={(obiettivi, mappa) => set({ ...a, obiettivi, mappa })} onClose={() => setLuoghi(false)} />}
        </>
      )}
    </Sezione>
  )
}

function EditorCoordinate({ a, set }: { a: Extract<Attivita, { tipo: 'coordinate' }>; set: (att: Attivita) => void }) {
  const { data } = useGeo(a.mappa.area, 'politica')
  const aggiungiCitta = () => {
    if (!data) return
    const livelli = a.mappa.area === 'italia' ? ['citta', 'capoluoghi'] : ['citta', 'grandi_citta']
    const gia = new Set(a.punti.map((p) => p.nome))
    const citta = livelli.flatMap((l) => pool(data, l, undefined, a.mappa.focus)).filter((f) => !gia.has(f.properties.nome))
    const nuovi = mescola(citta).slice(0, 5).map((f) => {
      const [lon, lat] = (f.geometry as GeoJSON.Point).coordinates
      // coordinate arrotondate al grado (o al mezzo grado con lo zoom), come sull'atlante
      const r = a.mappa.area === 'italia' || a.mappa.focus ? 2 : 1
      return { lon: Math.round(lon * r) / r, lat: Math.round(lat * r) / r, nome: f.properties.nome }
    })
    set({ ...a, punti: [...a.punti, ...nuovi] })
  }
  return (
    <>
      <CampiMappa config={a.mappa} senzaLivelli onChange={(m) => set({ ...a, mappa: m, tolleranza: m.area !== a.mappa.area ? TOLLERANZA[m.area] : a.tolleranza })} />
      <Campo label={`Distanza accettata: ${a.tolleranza} km`}>
        <input type="range" min={10} max={1000} step={10} value={a.tolleranza} onChange={(x) => set({ ...a, tolleranza: +x.target.value })} className="w-full" />
      </Campo>
      <p className="text-xs text-slate-500 mb-2">Gli alunni vedono le coordinate e cliccano il punto sulla carta (con reticolato e gradi). Il nome si scopre dopo il clic.</p>
      <Lista voci={a.punti} onChange={(punti) => set({ ...a, punti })} etichettaNuova="＋ Punto"
        nuova={(): PuntoCoordinate => ({ lat: 45, lon: 9, nome: '' })}
        render={(p, setP) => (
          <div className="pr-10 grid grid-cols-2 gap-1">
            <input className="campo py-1 col-span-2" placeholder="Nome (facoltativo)" value={p.nome ?? ''} onChange={(x) => setP({ ...p, nome: x.target.value })} />
            <label className="text-xs text-slate-500">Latitudine (N +, S −)<input type="number" step="0.5" className="campo py-1" value={p.lat} onChange={(x) => setP({ ...p, lat: +x.target.value })} /></label>
            <label className="text-xs text-slate-500">Longitudine (E +, O −)<input type="number" step="0.5" className="campo py-1" value={p.lon} onChange={(x) => setP({ ...p, lon: +x.target.value })} /></label>
          </div>
        )} />
      <button className="btn-secondario w-full justify-center mt-2" onClick={aggiungiCitta} disabled={!data}>🎲 Aggiungi 5 città a caso</button>
    </>
  )
}
