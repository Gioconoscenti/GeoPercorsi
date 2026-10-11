import { useMemo, useState } from 'react'
import type { EditorApi } from './Editor'
import { CLASSI, STAGE_H, STAGE_W, type Area, type Attivita, type TipoMappa } from '../types'
import { useGeo } from '../geo/useGeo'
import { COLORI_CONTINENTI, LIVELLI, NOMI_LIVELLI } from '../geo/aree'
import { GENERATORI, genera, generatoriPossibili, livelliDisponibili, pool, type TipoGeneratore } from '../attivita/generatori'
import { nuovaTappa, nuovoElemento } from '../lib/fabbrica'
import { SceltaArea, SceltaTipo } from './SelettoreMappa'
import { SceltaFocus } from '../geo/SceltaFocus'

const CONTINENTI: Record<string, string> = { europa: 'Europa', asia: 'Asia', africa: 'Africa', 'america-nord': 'America sett.', 'america-sud': 'America merid.', oceania: 'Oceania' }

export function Generatore({ api, onClose }: { api: EditorApi; onClose: () => void }) {
  const [area, setArea] = useState<Area>(CLASSI[api.percorso.classe].area)
  const [tipo, setTipo] = useState<TipoMappa>('politica')
  const [livello, setLivello] = useState<string | null>(null)
  const [gen, setGen] = useState<TipoGeneratore>('trova')
  const [quanti, setQuanti] = useState(6)
  const [continente, setContinente] = useState('')
  const [focus, setFocus] = useState<string | undefined>()
  const [nuova, setNuova] = useState(true)
  const [lavoro, setLavoro] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  // l'attività generata si guarda prima di inserirla: si può rigenerare o togliere qualche domanda
  const [anteprima, setAnteprima] = useState<Attivita | null>(null)
  const { data } = useGeo(area, tipo)

  const livelli = useMemo(() => (data ? livelliDisponibili(data, focus) : []), [data, focus])
  const ordineLivelli = LIVELLI[tipo][area].map((l) => l.id)
  const livelliOrd = [...livelli].sort((a, b) => (ordineLivelli.indexOf(a) + 99) % 99 - (ordineLivelli.indexOf(b) + 99) % 99)
  const liv = livello && livelli.includes(livello) ? livello : livelliOrd[0]
  const possibili = data && liv ? generatoriPossibili(data, liv, focus) : []
  const g = possibili.includes(gen) ? gen : possibili[0]
  const disponibili = data && liv ? pool(data, liv, continente || undefined, focus).length : 0

  const crea = async () => {
    if (!g || !liv) return
    setLavoro(true)
    setErrore(null)
    try {
      setAnteprima(await genera(g, { area, tipo, livello: liv, quanti, continente: continente || undefined, focus }))
    } catch (e) {
      setErrore((e as Error).message)
    } finally {
      setLavoro(false)
    }
  }

  const inserisci = (att: Attivita) => {
      const grande = att.tipo === 'trova' || att.tipo === 'etichette' || att.tipo === 'coordinate'
      const w = grande ? 1240 : 900
      const h = grande ? 680 : 600
      const el = nuovoElemento('attivita', { attivita: att, w, h, x: (STAGE_W - w) / 2, y: (STAGE_H - h) / 2 } as never, area)
      if (nuova) {
        const t = nuovaTappa(att.titolo)
        t.elementi.push(el)
        api.aggiungiTappa(t)
      } else api.aggiungiElemento(el)
      onClose()
  }

  return (
    <div className="fixed inset-0 z-[90] bg-slate-900/60 grid place-items-center p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-auto" onMouseDown={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white flex items-center">
          <div>
            <h2 className="text-xl font-extrabold">✨ Genera un’attività dalla mappa</h2>
            <p className="text-sm opacity-90">Usa i dati delle carte (nomi, capitali, altezze, lunghezze…) per creare giochi in un clic.</p>
          </div>
          <button className="ml-auto w-9 h-9 rounded-full hover:bg-white/20 text-xl" onClick={onClose}>✕</button>
        </div>
        {anteprima ? (
          <Anteprima att={anteprima} nome={(id) => data?.byId.get(id)?.properties.nome ?? id} lavoro={lavoro} errore={errore}
            onChange={setAnteprima} onIndietro={() => setAnteprima(null)} onRigenera={crea} onInserisci={() => inserisci(anteprima)} />
        ) : (
        <div className="p-6 grid gap-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><span className="etichetta">1 · Area</span><SceltaArea area={area} onChange={(a) => { setArea(a); setLivello(null); setContinente(''); setFocus(undefined) }} />
              <div className="mt-2"><span className="etichetta">Solo in</span><SceltaFocus area={area} valore={focus} onChange={(id) => { setFocus(id); setLivello(null) }} /></div>
            </div>
            <div><span className="etichetta">2 · Carta</span><SceltaTipo tipo={tipo} onChange={(t) => { setTipo(t); setLivello(null) }} /></div>
          </div>
          <div>
            <span className="etichetta">3 · Su cosa</span>
            {!data ? <p className="text-sm text-slate-500">Caricamento…</p> : (
              <div className="flex flex-wrap gap-1.5">
                {livelliOrd.map((l) => (
                  <button key={l} onClick={() => setLivello(l)} className={'px-3 py-1 rounded-full text-sm font-semibold border ' + (l === liv ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300 hover:border-indigo-400')}>
                    {LIVELLI[tipo][area].find((x) => x.id === l)?.icona ?? '•'} {NOMI_LIVELLI[l] ?? l}
                  </button>
                ))}
              </div>
            )}
            {area === 'mondo' && (liv === 'stati' || liv === 'citta') && (
              <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                <span className="text-xs text-slate-500">Solo in:</span>
                <button onClick={() => setContinente('')} className={'px-2 py-0.5 rounded-full text-xs border ' + (!continente ? 'bg-slate-800 text-white' : 'bg-white')}>tutti</button>
                {Object.entries(CONTINENTI).map(([id, n]) => (
                  <button key={id} onClick={() => setContinente(id)} className={'px-2 py-0.5 rounded-full text-xs border ' + (continente === id ? 'ring-2 ring-slate-800' : '')} style={{ background: COLORI_CONTINENTI[id] }}>{n}</button>
                ))}
              </div>
            )}
          </div>
          <div>
            <span className="etichetta">4 · Tipo di gioco</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {possibili.map((p) => (
                <button key={p} onClick={() => setGen(p)} className={'text-left rounded-xl border-2 p-2.5 transition ' + (p === g ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300')}>
                  <div className="text-2xl">{GENERATORI[p].icona}</div>
                  <div className="font-bold text-sm">{GENERATORI[p].nome}</div>
                  <div className="text-xs text-slate-500">{GENERATORI[p].descr}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <span className="etichetta mb-0">5 · Quanti</span>
              <input type="range" min={3} max={Math.max(3, Math.min(15, disponibili))} value={Math.min(quanti, disponibili || 3)} onChange={(e) => setQuanti(+e.target.value)} />
              <b className="w-6">{Math.min(quanti, disponibili || 3)}</b>
              <span className="text-xs text-slate-500">(disponibili: {disponibili})</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={nuova} onChange={(e) => setNuova(e.target.checked)} /> in una nuova tappa
            </label>
          </div>
          {errore && <div className="text-rose-700 text-sm">{errore}</div>}
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={onClose}>Annulla</button>
            <button className="btn-primario text-base px-5 py-2" disabled={!g || lavoro || disponibili < 3} onClick={crea}>{lavoro ? 'Creazione…' : '✨ Crea e guarda l’anteprima'}</button>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

/** Le voci dell'attività generata, in forma leggibile (per l'anteprima) */
function voci(a: Attivita, nome: (id: string) => string): string[] {
  switch (a.tipo) {
    case 'quiz': return a.domande.map((d) => `${d.domanda} → ${d.corrette.map((k) => d.opzioni[k]).join(', ')}`)
    case 'vf': return a.affermazioni.map((x) => `${x.testo} (${x.vera ? 'vera' : 'falsa'})`)
    case 'abbina': return a.coppie.map((c) => `${c.a} ↔ ${c.b}`)
    case 'flashcard': return a.carte.map((c) => `${c.fronte} → ${c.retro}`)
    case 'ordina': return a.elementi.map((x, k) => `${k + 1}. ${x}`)
    case 'trova':
    case 'etichette': return a.obiettivi.map(nome)
    case 'coordinate': return a.punti.map((q) => q.nome ?? `${q.lat}, ${q.lon}`)
    case 'completa': return [a.testo]
  }
}

function togli(a: Attivita, k: number): Attivita {
  const via = <T,>(l: T[]) => l.filter((_, j) => j !== k)
  switch (a.tipo) {
    case 'quiz': return { ...a, domande: via(a.domande) }
    case 'vf': return { ...a, affermazioni: via(a.affermazioni) }
    case 'abbina': return { ...a, coppie: via(a.coppie) }
    case 'flashcard': return { ...a, carte: via(a.carte) }
    case 'ordina': return { ...a, elementi: via(a.elementi) }
    case 'trova':
    case 'etichette': return { ...a, obiettivi: via(a.obiettivi) }
    case 'coordinate': return { ...a, punti: via(a.punti) }
    case 'completa': return a
  }
}

function Anteprima({ att, nome, lavoro, errore, onChange, onIndietro, onRigenera, onInserisci }: {
  att: Attivita
  nome: (id: string) => string
  lavoro: boolean
  errore: string | null
  onChange: (a: Attivita) => void
  onIndietro: () => void
  onRigenera: () => void
  onInserisci: () => void
}) {
  const lista = voci(att, nome)
  const minimo = att.tipo === 'completa' ? 1 : 2
  return (
    <div className="p-6 grid gap-4">
      <div>
        <span className="etichetta">Anteprima</span>
        <input className="campo text-lg font-bold" value={att.titolo} onChange={(e) => onChange({ ...att, titolo: e.target.value })} aria-label="Titolo dell’attività" />
      </div>
      <ol className="flex flex-col gap-1.5 max-h-[45vh] overflow-auto">
        {lista.map((v, k) => (
          <li key={k} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span className="w-6 text-xs font-bold text-slate-400">{k + 1}</span>
            <span className="flex-1 whitespace-pre-line">{v}</span>
            {att.tipo !== 'completa' && (
              <button className="w-9 h-9 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" disabled={lista.length <= minimo}
                onClick={() => onChange(togli(att, k))} aria-label={`Togli la voce ${k + 1}`} title="Togli">✕</button>
            )}
          </li>
        ))}
      </ol>
      {errore && <div className="text-rose-700 text-sm">{errore}</div>}
      <div className="flex flex-wrap justify-end gap-2">
        <button className="btn-ghost mr-auto" onClick={onIndietro}>← Cambia le scelte</button>
        <button className="btn-secondario text-base px-4 py-2" onClick={onRigenera} disabled={lavoro}>{lavoro ? 'Creazione…' : '🎲 Rigenera'}</button>
        <button className="btn-primario text-base px-5 py-2" onClick={onInserisci}>✓ Inserisci nel percorso</button>
      </div>
      <p className="text-xs text-slate-500">Dopo l’inserimento potrai modificare ogni voce dal pannello a destra.</p>
    </div>
  )
}
