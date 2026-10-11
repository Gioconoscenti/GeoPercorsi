import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { salvaPercorso } from '../data/db'
import { CLASSI, type Area, type Classe, type Percorso } from '../types'
import { Dialogo } from '../ui/Dialogo'
import { toast } from '../ui/Toast'
import { AREE_DISPONIBILI, costruisciPrompt } from './prompt'
import { convertiPercorso, estraiJson, type Conversione } from './schema'

async function copia(testo: string) {
  try {
    await navigator.clipboard.writeText(testo)
  } catch {
    // browser senza permessi sugli appunti: si seleziona un campo temporaneo
    const t = document.createElement('textarea')
    t.value = testo
    document.body.appendChild(t)
    t.select()
    document.execCommand('copy')
    t.remove()
  }
}

const PASSO = 'w-7 h-7 shrink-0 rounded-full bg-indigo-600 text-white grid place-items-center font-bold text-sm'

/** Crea un percorso con un assistente esterno (es. Claude gratuito): copia il prompt, poi incolla la risposta */
export function CreaConClaude({ onClose, classe: classeIniziale }: { onClose: () => void; classe?: Classe }) {
  const nav = useNavigate()
  const [classe, setClasse] = useState<Classe>(classeIniziale ?? 1)
  const [richiesta, setRichiesta] = useState('')
  const [aree, setAree] = useState<Area[]>([CLASSI[classeIniziale ?? 1].area])
  const [copiato, setCopiato] = useState(false)
  const [lavoro, setLavoro] = useState(false)
  const [risposta, setRisposta] = useState('')
  const [esito, setEsito] = useState<Conversione | null>(null)

  const cambiaClasse = (c: Classe) => {
    setClasse(c)
    setAree([CLASSI[c].area])
  }
  const attivaArea = (a: Area) => setAree((x) => (x.includes(a) ? x.filter((y) => y !== a) : [...x, a]))

  const copiaPrompt = async () => {
    if (richiesta.trim().length < 10) return toast('Descrivi meglio il percorso che vuoi (almeno una frase).', { errore: true })
    setLavoro(true)
    try {
      await copia(await costruisciPrompt({ richiesta, classe, aree }))
      setCopiato(true)
      toast('Prompt copiato: incollalo in una nuova chat di Claude')
    } catch (e) {
      toast('Errore: ' + (e as Error).message, { errore: true })
    } finally {
      setLavoro(false)
    }
  }

  const controlla = async () => {
    setLavoro(true)
    try {
      const { dati, errore } = estraiJson(risposta)
      setEsito(errore ? { errori: [errore], avvisi: [] } : await convertiPercorso(dati, classe))
    } catch (e) {
      setEsito({ errori: ['Errore imprevisto: ' + (e as Error).message], avvisi: [] })
    } finally {
      setLavoro(false)
    }
  }

  const crea = async (p: Percorso) => {
    await salvaPercorso(p)
    nav('/modifica/' + p.id)
  }

  const messaggioCorrezione = (e: Conversione) =>
    `Il JSON che hai scritto ha questi problemi. Riscrivilo corretto, sempre come unico blocco JSON, cambiando solo ciò che serve:\n${e.errori.map((x) => '- ' + x).join('\n')}`

  return (
    <Dialogo largo titolo={<>✨ Crea un percorso con Claude</>} onClose={onClose}
      piede={<button className="btn-secondario" onClick={onClose}>Chiudi</button>}>
      <p className="text-sm text-slate-600">
        Funziona con Claude gratuito (o un altro assistente): niente chiavi, niente account da collegare. L’app prepara le istruzioni e controlla la risposta.
      </p>

      <ol className="mt-4 space-y-5">
        <li className="flex gap-3">
          <span className={PASSO}>1</span>
          <div className="flex-1 min-w-0">
            <b>Descrivi il percorso</b>
            <textarea className="campo mt-2 min-h-24" value={richiesta} onChange={(e) => { setRichiesta(e.target.value); setCopiato(false) }}
              placeholder="Es.: Percorso storico e artistico su Parma, Ferrara e Ravenna, con testi sulle tre città, un quiz e un abbinamento monumento-città." />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm">
              <label className="flex items-center gap-1.5">Classe
                <select className="campo py-1 w-auto" value={classe} onChange={(e) => cambiaClasse(Number(e.target.value) as Classe)}>
                  {([1, 2, 3] as Classe[]).map((c) => <option key={c} value={c}>{CLASSI[c].nome}</option>)}
                </select>
              </label>
              <span className="flex items-center gap-2">Carte da usare:
                {AREE_DISPONIBILI.map((a) => (
                  <label key={a.id} className="flex items-center gap-1"><input type="checkbox" checked={aree.includes(a.id)} onChange={() => { attivaArea(a.id); setCopiato(false) }} />{a.nome}</label>
                ))}
              </span>
            </div>
            <button className="btn-primario mt-3" onClick={copiaPrompt} disabled={lavoro}>
              {copiato ? '✓ Copiato · copia di nuovo' : '📋 Copia le istruzioni per Claude'}
            </button>
          </div>
        </li>

        <li className="flex gap-3">
          <span className={PASSO}>2</span>
          <div>Apri <b>claude.ai</b>, avvia una nuova chat, <b>incolla</b> e invia. Aspetta che Claude finisca di scrivere, poi copia tutta la sua risposta.</div>
        </li>

        <li className="flex gap-3">
          <span className={PASSO}>3</span>
          <div className="flex-1 min-w-0">
            <b>Incolla qui la risposta</b>
            <textarea className="campo mt-2 min-h-32 font-mono text-xs" value={risposta} onChange={(e) => { setRisposta(e.target.value); setEsito(null) }} placeholder='{ "formato": "geopercorsi-1", … }' />
            <button className="btn-primario mt-3" onClick={controlla} disabled={lavoro || !risposta.trim()}>🔍 Controlla</button>

            {esito && esito.errori.length > 0 && (
              <div className="mt-3 rounded-xl bg-red-50 border border-red-300 text-red-900 p-3 text-sm">
                <b>Non posso ancora creare il percorso:</b>
                <ul className="list-disc ml-5 mt-1">{esito.errori.map((x, i) => <li key={i}>{x}</li>)}</ul>
                <button className="btn-secondario mt-2" onClick={async () => { await copia(messaggioCorrezione(esito)); toast('Copiato: incollalo nella stessa chat di Claude') }}>
                  📋 Copia il messaggio di correzione per Claude
                </button>
              </div>
            )}
            {esito && esito.avvisi.length > 0 && (
              <div className="mt-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 p-3 text-sm">
                <b>Da sapere:</b>
                <ul className="list-disc ml-5 mt-1">{esito.avvisi.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
            )}
            {esito?.percorso && (
              <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 text-sm">
                <b>✓ “{esito.percorso.titolo}” — {esito.percorso.tappe.length} tappe</b>
                <ol className="list-decimal ml-5 mt-1">{esito.percorso.tappe.map((t) => <li key={t.id}>{t.titolo}</li>)}</ol>
                <p className="mt-2 text-xs">Controlla i fatti storici e artistici: Claude può sbagliare. Dopo la creazione puoi modificare tutto e aggiungere le immagini.</p>
                <button className="btn-primario mt-2" onClick={() => crea(esito.percorso!)}>Crea il percorso e aprilo</button>
              </div>
            )}
          </div>
        </li>
      </ol>
    </Dialogo>
  )
}
