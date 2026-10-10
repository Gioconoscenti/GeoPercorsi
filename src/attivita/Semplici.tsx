import { Fragment, useMemo, useState } from 'react'
import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Attivita } from '../types'
import { BottoneRiprova, BottoneVerifica, Cornice, classeEsito, type PropsAttivita } from './comuni'
import { analizzaCompleta, bucoGiusto, correggiAbbina, correggiCompleta, correggiOrdina, correggiVF, mescola, mescolaDiverso, type Risultato } from './correzione'
import { useAssetUrl } from '../lib/runtime'

type Att<T extends Attivita['tipo']> = Extract<Attivita, { tipo: T }>

// ---------------- Vero / Falso ----------------
export function VeroFalso({ att, onRisultato, statico }: PropsAttivita<Att<'vf'>>) {
  const [r, setR] = useState<(boolean | null)[]>(() => att.affermazioni.map(() => null))
  const [ris, setRis] = useState<Risultato | null>(null)
  const verifica = () => { const x = correggiVF(att.affermazioni, r); setRis(x); onRisultato?.(x) }
  const reset = () => { setR(att.affermazioni.map(() => null)); setRis(null) }
  return (
    <Cornice tipo="vf" titolo={att.titolo} risultato={ris}
      piede={<div className="ml-auto flex gap-2">{ris ? <BottoneRiprova onClick={reset} /> : <BottoneVerifica onClick={verifica} disabled={statico || r.some((x) => x === null)} />}</div>}>
      <div className="flex flex-col gap-2">
        {att.affermazioni.map((a, i) => (
          <div key={i} className={'flex items-center gap-3 rounded-xl border-2 px-4 py-2.5 ' + classeEsito(ris ? r[i] === a.vera : null)}>
            <span className="flex-1 text-lg font-semibold">{a.testo}</span>
            {[true, false].map((v) => (
              <button key={String(v)} disabled={!!ris || statico} onClick={() => setR(r.map((x, j) => (j === i ? v : x)))}
                className={'px-4 py-1.5 rounded-lg font-bold border-2 ' + (r[i] === v ? (v ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-rose-600 border-rose-600 text-white') : 'bg-white border-slate-300 text-slate-600')}>
                {v ? 'V' : 'F'}
              </button>
            ))}
            {ris && <span className="w-6">{r[i] === a.vera ? '✅' : '❌'}</span>}
          </div>
        ))}
      </div>
    </Cornice>
  )
}

// ---------------- Abbinamenti ----------------
const COLORI_COPPIE = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#0ea5e9', '#84cc16', '#f97316', '#8b5cf6', '#14b8a6', '#ef4444']

export function Abbina({ att, onRisultato, statico }: PropsAttivita<Att<'abbina'>>) {
  const n = att.coppie.length
  const destra = useMemo(() => mescolaDiverso(att.coppie.map((_, i) => i)), [att.coppie])
  const [scelte, setScelte] = useState<(number | null)[]>(() => att.coppie.map(() => null))
  const [attivo, setAttivo] = useState<number | null>(null)
  const [ris, setRis] = useState<Risultato | null>(null)

  const clickDestra = (j: number) => {
    if (attivo === null || ris || statico) return
    setScelte(scelte.map((x, i) => (i === attivo ? j : x === j ? null : x)))
    setAttivo(null)
  }
  const verifica = () => { const x = correggiAbbina(n, scelte); setRis(x); onRisultato?.(x) }
  const reset = () => { setScelte(att.coppie.map(() => null)); setRis(null) }
  const colore = (i: number) => COLORI_COPPIE[i % COLORI_COPPIE.length]

  return (
    <Cornice tipo="abbina" titolo={att.titolo} risultato={ris} sottotitolo="Tocca un elemento a sinistra, poi quello che gli corrisponde a destra"
      piede={<div className="ml-auto flex gap-2">{ris ? <BottoneRiprova onClick={reset} /> : <BottoneVerifica onClick={verifica} disabled={statico || scelte.some((x) => x === null)} />}</div>}>
      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
        <div className="flex flex-col gap-2">
          {att.coppie.map((c, i) => {
            const esito = ris ? scelte[i] === i : null
            return (
              <button key={i} onClick={() => !ris && setAttivo(attivo === i ? null : i)}
                className={'rounded-xl border-2 px-3 py-2 text-left text-lg font-semibold flex items-center gap-2 ' + (ris ? classeEsito(esito) : attivo === i ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white')}>
                <span className="w-4 h-4 rounded-full shrink-0" style={{ background: scelte[i] !== null ? colore(i) : '#e2e8f0' }} />
                {c.a}
                {ris && <span className="ml-auto text-sm">{esito ? '✅' : `❌ ${att.coppie[i].b}`}</span>}
              </button>
            )
          })}
        </div>
        <div className="flex flex-col gap-2">
          {destra.map((j) => {
            const da = scelte.indexOf(j)
            return (
              <button key={j} onClick={() => clickDestra(j)}
                className={'rounded-xl border-2 px-3 py-2 text-left text-lg font-semibold flex items-center gap-2 ' + (attivo !== null && !ris ? 'border-dashed border-indigo-300 hover:bg-indigo-50' : 'border-slate-200 bg-white')}>
                <span className="w-4 h-4 rounded-full shrink-0" style={{ background: da >= 0 ? colore(da) : '#e2e8f0' }} />
                {att.coppie[j].b}
              </button>
            )
          })}
        </div>
      </div>
    </Cornice>
  )
}

// ---------------- Completa il testo ----------------
export function Completa({ att, onRisultato, statico }: PropsAttivita<Att<'completa'>>) {
  const pezzi = useMemo(() => analizzaCompleta(att.testo), [att.testo])
  const nBuchi = pezzi.filter((p) => p.tipo === 'buco').length
  const [r, setR] = useState<string[]>(() => Array(nBuchi).fill(''))
  const [ris, setRis] = useState<Risultato | null>(null)
  const [soluzioni, setSoluzioni] = useState(false)
  const verifica = () => { const x = correggiCompleta(att.testo, r); setRis(x); onRisultato?.(x) }
  const reset = () => { setR(Array(nBuchi).fill('')); setRis(null); setSoluzioni(false) }
  let b = -1
  return (
    <Cornice tipo="completa" titolo={att.titolo} risultato={ris} sottotitolo="Scrivi le parole mancanti"
      piede={<div className="ml-auto flex gap-2">
        {ris && !soluzioni && <button className="btn-ghost" onClick={() => setSoluzioni(true)}>👁 Mostra soluzioni</button>}
        {ris ? <BottoneRiprova onClick={reset} /> : <BottoneVerifica onClick={verifica} disabled={statico} />}
      </div>}>
      <p className="text-xl leading-[2.4]">
        {pezzi.map((p, i) => {
          if (p.tipo === 'testo') return <Fragment key={i}>{p.testo}</Fragment>
          const k = ++b
          const esito = ris ? bucoGiusto(p.soluzioni, r[k]) : null
          const w = Math.max(5, ...p.soluzioni.map((s) => s.length)) + 1
          return (
            <span key={i} className="inline-flex flex-col align-middle mx-1">
              <input value={soluzioni && !esito ? p.soluzioni[0] : r[k]} readOnly={!!ris || statico}
                onChange={(e) => setR(r.map((x, j) => (j === k ? e.target.value : x)))}
                style={{ width: w + 'ch' }}
                className={'border-b-2 border-x-0 border-t-0 rounded-md px-1.5 py-0 text-xl font-bold text-center focus:outline-none ' + (esito === true ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : esito === false ? 'bg-rose-50 border-rose-500 text-rose-800' : 'bg-indigo-50 border-indigo-400')} />
            </span>
          )
        })}
      </p>
    </Cornice>
  )
}

// ---------------- Metti in ordine ----------------
function Riga({ id, testo, i, esito, sposta, n, bloccato }: { id: string; testo: string; i: number; esito: boolean | null; sposta: (d: number) => void; n: number; bloccato: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: bloccato })
  return (
    <div ref={setNodeRef} style={{ transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined, transition, zIndex: isDragging ? 10 : undefined }}
      className={'flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-lg font-semibold touch-none ' + classeEsito(esito) + (isDragging ? ' shadow-lg' : '')}>
      <span {...attributes} {...listeners} className="cursor-grab text-slate-400 px-1" title="Trascina">⠿</span>
      <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center text-sm font-bold">{i + 1}</span>
      <span className="flex-1">{testo}</span>
      {!bloccato && (
        <>
          <button className="btn-ghost px-2" disabled={i === 0} onClick={() => sposta(-1)}>▲</button>
          <button className="btn-ghost px-2" disabled={i === n - 1} onClick={() => sposta(1)}>▼</button>
        </>
      )}
      {esito !== null && <span>{esito ? '✅' : '❌'}</span>}
    </div>
  )
}

export function Ordina({ att, onRisultato, statico }: PropsAttivita<Att<'ordina'>>) {
  const iniziale = useMemo(() => mescolaDiverso(att.elementi.map((testo, i) => ({ id: String(i), testo }))), [att.elementi])
  const [lista, setLista] = useState(iniziale)
  const [ris, setRis] = useState<Risultato | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(TouchSensor))
  const fine = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    const a = lista.findIndex((x) => x.id === e.active.id)
    const b = lista.findIndex((x) => x.id === e.over!.id)
    setLista(arrayMove(lista, a, b))
  }
  const verifica = () => { const x = correggiOrdina(att.elementi, lista.map((l) => l.testo)); setRis(x); onRisultato?.(x) }
  const reset = () => { setLista(mescolaDiverso(lista)); setRis(null) }
  return (
    <Cornice tipo="ordina" titolo={att.titolo} risultato={ris} sottotitolo={att.consegna}
      piede={<div className="ml-auto flex gap-2">{ris ? <BottoneRiprova onClick={reset} /> : <BottoneVerifica onClick={verifica} disabled={statico} />}</div>}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={fine}>
        <SortableContext items={lista.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {lista.map((l, i) => (
              <Riga key={l.id} id={l.id} testo={l.testo} i={i} n={lista.length} bloccato={!!ris || !!statico}
                esito={ris ? att.elementi[i] === l.testo : null} sposta={(d) => setLista(arrayMove(lista, i, i + d))} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </Cornice>
  )
}

// ---------------- Flashcard ----------------
export function Flashcard({ att }: PropsAttivita<Att<'flashcard'>>) {
  const [ordine, setOrdine] = useState(() => att.carte.map((_, i) => i))
  const [i, setI] = useState(0)
  const [girata, setGirata] = useState(false)
  const c = att.carte[ordine[i]]
  const img = useAssetUrl(c?.assetId)
  if (!c) return <Cornice tipo="flashcard" titolo={att.titolo}><p>Nessuna carta.</p></Cornice>
  const vai = (d: number) => { setGirata(false); setI((i + d + ordine.length) % ordine.length) }
  return (
    <Cornice tipo="flashcard" titolo={att.titolo} sottotitolo={`Carta ${i + 1} di ${att.carte.length} · tocca la carta per girarla`}
      piede={<>
        <button className="btn-ghost" onClick={() => { setOrdine(mescola(ordine)); setI(0); setGirata(false) }}>🔀 Mescola</button>
        <div className="ml-auto flex gap-2">
          <button className="btn-secondario" onClick={() => vai(-1)}>◀</button>
          <button className="btn-secondario" onClick={() => vai(1)}>▶</button>
        </div>
      </>}>
      <div className="h-full grid place-items-center [perspective:1200px]">
        <button onClick={() => setGirata(!girata)} className="relative w-full max-w-lg h-full min-h-48 transition-transform duration-500 [transform-style:preserve-3d]"
          style={{ transform: girata ? 'rotateY(180deg)' : undefined }}>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white grid place-items-center p-6 text-3xl font-extrabold shadow-lg [backface-visibility:hidden]">
            <div className="flex flex-col items-center gap-3">
              {img && <img src={img} alt="" className="max-h-32 rounded-lg" />}
              {c.fronte}
            </div>
          </div>
          <div className="absolute inset-0 rounded-2xl bg-white border-4 border-indigo-400 text-indigo-900 grid place-items-center p-6 text-xl whitespace-pre-line overflow-auto font-bold shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {c.retro}
          </div>
        </button>
      </div>
    </Cornice>
  )
}
