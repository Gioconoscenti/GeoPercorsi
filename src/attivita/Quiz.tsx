import { useState } from 'react'
import type { Attivita } from '../types'
import { BottoneRiprova, Cornice, Punteggio, type PropsAttivita } from './comuni'
import { correggiQuiz, domandaGiusta, type Risultato } from './correzione'
import { getRuntime, useAssetUrl } from '../lib/runtime'

type Quiz = Extract<Attivita, { tipo: 'quiz' }>

export function Quiz({ att, onRisultato, statico }: PropsAttivita<Quiz>) {
  const [i, setI] = useState(0)
  const [risposte, setRisposte] = useState<number[][]>([])
  const [verificata, setVerificata] = useState(false)
  const [fine, setFine] = useState<Risultato | null>(null)
  const d = att.domande[i]
  const scelte = risposte[i] ?? []
  const multipla = (d?.corrette.length ?? 0) > 1
  const img = useAssetUrl(d?.assetId)

  if (!d) return <Cornice tipo="quiz" titolo={att.titolo}><p className="text-slate-500">Nessuna domanda.</p></Cornice>

  const scegli = (k: number) => {
    if (verificata || statico) return
    const nuove = [...risposte]
    nuove[i] = multipla ? (scelte.includes(k) ? scelte.filter((x) => x !== k) : [...scelte, k]) : [k]
    setRisposte(nuove)
  }
  const avanti = () => {
    setVerificata(false)
    if (i + 1 < att.domande.length) setI(i + 1)
    else {
      const r = correggiQuiz(att.domande, risposte)
      setFine(r)
      onRisultato?.(r)
    }
  }
  const ricomincia = () => { setI(0); setRisposte([]); setVerificata(false); setFine(null) }

  if (fine) {
    return (
      <Cornice tipo="quiz" titolo={att.titolo} risultato={fine} piede={<BottoneRiprova onClick={ricomincia} />}>
        <div className="h-full grid place-items-center text-center">
          <div>
            <div className="text-6xl mb-2">{fine.punti === fine.max ? '🏆' : '🎯'}</div>
            <div className="text-2xl font-extrabold">Hai risposto bene a {fine.punti} domande su {fine.max}</div>
            <div className="mt-4 scale-125 inline-block"><Punteggio r={fine} /></div>
          </div>
        </div>
      </Cornice>
    )
  }

  const giusta = domandaGiusta(d.corrette, scelte)
  return (
    <Cornice
      tipo="quiz"
      titolo={att.titolo}
      sottotitolo={`Domanda ${i + 1} di ${att.domande.length}${multipla ? ' · più risposte giuste' : ''}`}
      piede={
        <>
          <div className="flex gap-1">
            {att.domande.map((_, k) => <span key={k} className={'w-2.5 h-2.5 rounded-full ' + (k < i ? 'bg-indigo-400' : k === i ? 'bg-indigo-600' : 'bg-slate-300')} />)}
          </div>
          <div className="ml-auto flex gap-2">
            {!verificata ? (
              <button className="btn bg-emerald-600 text-white hover:bg-emerald-700 text-base px-5 py-2" disabled={!scelte.length || statico} onClick={() => setVerificata(true)}>✔ Verifica</button>
            ) : (
              <button className="btn-primario text-base px-5 py-2" onClick={avanti}>{i + 1 < att.domande.length ? 'Avanti ➜' : 'Risultato 🏁'}</button>
            )}
          </div>
        </>
      }
    >
      <div className="flex gap-4 items-start">
        {(img || d.bandiera) && (
          <img src={img ?? getRuntime().flagUrl(d.bandiera!)} alt="" className={'rounded-lg shadow max-h-40 max-w-[40%] object-contain ' + (d.bandiera ? 'border border-slate-200' : '')} />
        )}
        <h3 className="text-2xl font-bold flex-1">{d.domanda}</h3>
      </div>
      <div className="grid gap-2 mt-4 sm:grid-cols-2">
        {d.opzioni.map((o, k) => {
          const sel = scelte.includes(k)
          const corretta = d.corrette.includes(k)
          let cls = sel ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300'
          if (verificata) cls = corretta ? 'border-emerald-500 bg-emerald-50' : sel ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white opacity-60'
          return (
            <button key={k} onClick={() => scegli(k)} className={'text-left rounded-xl border-2 px-4 py-3 text-lg font-semibold transition flex items-center gap-3 ' + cls}>
              <span className={'w-7 h-7 shrink-0 grid place-items-center text-sm font-bold ' + (multipla ? 'rounded-md' : 'rounded-full') + ' ' + (sel ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600')}>
                {String.fromCharCode(65 + k)}
              </span>
              <span className="flex-1">{o}</span>
              {verificata && corretta && <span>✅</span>}
              {verificata && sel && !corretta && <span>❌</span>}
            </button>
          )
        })}
      </div>
      {verificata && (
        <div className={'mt-4 rounded-xl px-4 py-2 font-bold text-lg ' + (giusta ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')}>
          {giusta ? 'Esatto! 🎉' : 'Non proprio… guarda la risposta giusta in verde.'}
        </div>
      )}
    </Cornice>
  )
}
