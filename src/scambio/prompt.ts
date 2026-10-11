// Costruisce il prompt da incollare in Claude (o in un altro assistente) per ottenere un percorso in JSON.
import { SFONDO, NOMI_LIVELLI } from '../geo/aree'
import { caricaGeo, type GeoData } from '../geo/useGeo'
import { CLASSI, NOMI_AREE, type Area, type Classe, type TipoMappa } from '../types'
import { FORMATO, MAX_TAPPE } from './schema'

export interface OpzioniPrompt {
  richiesta: string
  classe: Classe
  /** le carte di cui l'assistente può usare i nomi dei luoghi */
  aree: Area[]
  /** numero di tappe indicativo */
  tappe?: number
}

/** Quanti nomi mostrare per livello: oltre, l'elenco è parziale (i primi per grandezza) */
const MAX_NOMI = 60
const LIVELLI_ESCLUSI = new Set(['fusi', 'contesto', 'terra'])

function nomiLivello(geo: GeoData, livello: string): { nomi: string[]; totale: number } {
  const visti = new Set<string>()
  const lista = (geo.perLivello.get(livello) ?? []).filter((f) => f.properties.id && f.properties.nome && !visti.has(f.properties.nome) && visti.add(f.properties.nome))
  lista.sort((a, b) => (typeof b.properties.val === 'number' ? b.properties.val : 0) - (typeof a.properties.val === 'number' ? a.properties.val : 0) || a.properties.nome!.localeCompare(b.properties.nome!, 'it'))
  return { nomi: lista.slice(0, MAX_NOMI).map((f) => f.properties.nome!), totale: lista.length }
}

async function elencoLuoghi(aree: Area[]): Promise<string> {
  const righe: string[] = []
  for (const area of aree) {
    for (const tipo of ['politica', 'fisica'] as TipoMappa[]) {
      const geo = await caricaGeo(area, tipo)
      const sezioni: string[] = []
      for (const livello of geo.perLivello.keys()) {
        if (SFONDO.has(livello) || LIVELLI_ESCLUSI.has(livello)) continue
        const { nomi, totale } = nomiLivello(geo, livello)
        if (totale < 3) continue
        sezioni.push(`  - livello "${livello}" (${NOMI_LIVELLI[livello] ?? livello}, ${totale}${totale > nomi.length ? `, primi ${nomi.length}` : ''}): ${nomi.join(', ')}`)
      }
      righe.push(`- area "${area}", carta "${tipo}":`, ...sezioni)
    }
  }
  return righe.join('\n')
}

const ESEMPIO = `{
  "formato": "${FORMATO}",
  "titolo": "Parma, Ferrara e Ravenna: tre città d'arte",
  "descrizione": "Un viaggio storico e artistico in Emilia-Romagna",
  "classe": 1,
  "tappe": [
    { "tipo": "lezione", "titolo": "Tre città, tre storie", "testo": "Parma, Ferrara e Ravenna ..." },
    { "tipo": "carta", "titolo": "Dove si trovano", "area": "italia", "carta": "politica", "zoom": "Emilia-Romagna",
      "testo": "Clicca sulle città per leggere la loro scheda.",
      "schede": { "Parma": "Capitale del ducato farnesiano ...", "Ferrara": "Città rinascimentale degli Estensi ...", "Ravenna": "Capitale dell'Impero romano d'Occidente ..." } },
    { "tipo": "trova", "titolo": "Trova le città", "area": "italia", "carta": "politica", "livello": "capoluoghi", "zoom": "Emilia-Romagna", "luoghi": ["Parma", "Ferrara", "Ravenna"] },
    { "tipo": "quiz", "titolo": "Quiz", "domande": [
      { "domanda": "Quale città è famosa per i mosaici bizantini?", "opzioni": ["Parma", "Ferrara", "Ravenna", "Bologna"], "corrette": [2] } ] },
    { "tipo": "vf", "titolo": "Vero o falso?", "affermazioni": [ { "testo": "Ferrara fu governata dagli Estensi.", "vera": true } ] },
    { "tipo": "abbina", "titolo": "Abbina", "coppie": [ { "a": "Ravenna", "b": "Mosaici" }, { "a": "Ferrara", "b": "Castello Estense" } ] },
    { "tipo": "completa", "titolo": "Completa", "testo": "La basilica di San Vitale si trova a [Ravenna]." },
    { "tipo": "ordina", "titolo": "In ordine di tempo", "consegna": "Metti in ordine cronologico", "elementi": ["Primo evento", "Secondo evento", "Terzo evento"] },
    { "tipo": "flashcard", "titolo": "Ripasso", "carte": [ { "fronte": "Duomo di Parma", "retro": "Cattedrale romanica con affreschi del Correggio" } ] }
  ]
}`

export async function costruisciPrompt(o: OpzioniPrompt): Promise<string> {
  const cl = CLASSI[o.classe]
  const n = o.tappe ?? 10
  const luoghi = await elencoLuoghi(o.aree.length ? o.aree : [cl.area])
  return `Sei un docente esperto di geografia, storia e arte della scuola media italiana. Devi scrivere un percorso didattico interattivo per la webapp "GeoPercorsi". Rispondi SOLO con un unico blocco di codice JSON (\`\`\`json … \`\`\`), senza testo prima o dopo.

# Richiesta del docente
${o.richiesta.trim()}

# Destinatari e stile
- Classe: ${cl.nome} (tema del programma: ${cl.tema}). Italiano chiaro, adatto a ragazzi di 11-14 anni, tono incoraggiante.
- Circa ${n} tappe (massimo ${MAX_TAPPE}), in questo ordine: introduzione, spiegazione con carta, 2-3 attività di gioco varie, verifica finale.
- Testi di spiegazione brevi (massimo 600 caratteri per tappa). Usa \\n\\n per andare a capo.
- Scrivi solo fatti verificabili: niente date, nomi o numeri incerti. Se non sei sicuro, lascia perdere quel dettaglio.
- Nei quiz metti 4 opzioni plausibili, una sola corretta (salvo richiesta diversa), e varia la posizione della risposta giusta.

# Formato del JSON
L'oggetto principale ha: "formato": "${FORMATO}", "titolo", "descrizione", "classe" (${o.classe}), "tappe" (elenco). Ogni tappa ha "tipo" e "titolo". Tipi ammessi:
- "lezione": "testo"
- "carta": una carta geografica con testo a lato. Campi: "area" ("italia", "europa" o "mondo"), "carta" ("politica" o "fisica"), "testo", opzionali "zoom" (nome di una regione, Stato o continente) e "schede" (oggetto { "Nome luogo": "testo che appare cliccando il luogo" }) — le schede sono il modo migliore per dare contenuti su città, monti, fiumi.
- "trova": l'alunno clicca i luoghi sulla carta. Campi: "area", "carta", "livello", "luoghi" (almeno 2 nomi), opzionale "zoom".
- "etichette": come "trova", ma l'alunno trascina i nomi sui luoghi.
- "quiz": "domande": [ { "domanda", "opzioni": [..], "corrette": [posizioni delle risposte giuste, da 0] } ]
- "vf": "affermazioni": [ { "testo", "vera": true/false } ]
- "abbina": "coppie": [ { "a", "b" } ] (da 2 a 8)
- "completa": "testo" con le parole mancanti tra [parentesi quadre]
- "ordina": "consegna", "elementi" (almeno 3, scritti GIÀ nell'ordine corretto: l'app li mescola)
- "flashcard": "carte": [ { "fronte", "retro" } ]
Non inventare altri tipi né altri campi.

# Luoghi disponibili sulle carte
Nei campi "luoghi", "schede" e "zoom" usa SOLO nomi di questo elenco, scritti esattamente così (altrimenti vengono scartati). Per "livello" usa uno dei livelli elencati.
${luoghi}

# Esempio (solo per il formato: il contenuto va deciso dalla richiesta)
\`\`\`json
${ESEMPIO}
\`\`\`

Ora scrivi il percorso richiesto.`
}

export const AREE_DISPONIBILI = (Object.keys(NOMI_AREE) as Area[]).map((a) => ({ id: a, nome: NOMI_AREE[a] }))
