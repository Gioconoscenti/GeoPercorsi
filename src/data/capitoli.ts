// Percorsi d'esempio organizzati come i capitoli dei libri di testo di 1ª, 2ª e 3ª media.
// Le carte sono fisse; le attività vengono generate dai dati delle carte al primo avvio.
import { genera, type OpzioniGeneratore, type TipoGeneratore } from '../attivita/generatori'
import { conFocus, livelliPredefiniti } from '../geo/aree'
import { caricaGeo } from '../geo/useGeo'
import { CLASSI, type Area, type Attivita, type Classe, type MappaConfig, type Percorso, type Tappa, type TipoMappa } from '../types'
import { M, attivita, copertina, mappa, percorso, tappa, testo, titolo } from './esempi'

type Passo =
  /** carta con un testo di spiegazione a sinistra (se manca, si usa la descrizione dell'area su cui si fa lo zoom) */
  | { carta: string; mappa: MappaConfig; testo?: string }
  /** attività generata dai dati delle carte */
  | { gen: TipoGeneratore; area: Area; tipo: TipoMappa; livello: string; quanti?: number; focus?: string; titolo?: string }
  /** attività scritta a mano */
  | { att: Attivita }

interface Capitolo {
  classe: Classe
  titolo: string
  sottotitolo: string
  passi: Passo[]
}

/** Carta con zoom su una regione/uno Stato/un'area e i livelli giusti */
const Z = (area: Area, tipo: TipoMappa, focus?: string, livelli?: string[]): MappaConfig => {
  const base = M(area, tipo, livelli ? { livelli } : {})
  return focus ? conFocus(base, focus) : base
}

// ---------------- 1ª media ----------------
const PRIMA: Capitolo[] = [
  {
    classe: 1, titolo: 'Gli strumenti del geografo', sottotitolo: 'Orientamento, reticolato geografico, coordinate e fusi orari',
    passi: [
      { carta: 'Il reticolato geografico', mappa: M('italia', 'politica', { livelli: [...livelliPredefiniti('italia', 'politica'), 'reticolato'] }),
        testo: 'Paralleli e meridiani formano il reticolato geografico.\n\nLa latitudine dice quanto un luogo è a nord o a sud dell’Equatore; la longitudine quanto è a est o a ovest del meridiano di Greenwich.\n\nMuovi il mouse sulla carta: in basso leggi le coordinate del punto.' },
      { gen: 'direzione', area: 'italia', tipo: 'politica', livello: 'citta', quanti: 6, titolo: 'Orientarsi con i punti cardinali' },
      { gen: 'coordinate-quiz', area: 'italia', tipo: 'politica', livello: 'citta', quanti: 5 },
      { gen: 'coordinate-clic', area: 'europa', tipo: 'politica', livello: 'citta', quanti: 6 },
      { gen: 'distanza', area: 'italia', tipo: 'politica', livello: 'citta', quanti: 5, titolo: 'Misurare le distanze' },
      { carta: 'I fusi orari', mappa: M('mondo', 'politica', { livelli: ['continenti', 'mari', 'fusi', 'paralleli'] }),
        testo: 'La Terra ruota di 15° ogni ora: per questo è divisa in 24 fusi orari.\n\nVerso est l’ora aumenta, verso ovest diminuisce. Clicca un fuso per sapere che ore sono lì quando a Greenwich è mezzogiorno.' },
      { gen: 'fusi', area: 'mondo', tipo: 'politica', livello: 'citta', quanti: 6 },
    ],
  },
  {
    classe: 1, titolo: 'Il pianeta Terra e il clima', sottotitolo: 'Paralleli fondamentali, zone climatiche e ambienti',
    passi: [
      { carta: 'Le zone climatiche', mappa: M('mondo', 'fisica', { livelli: ['fasce', 'paralleli', 'mari', 'rilievi', 'deserti'] }),
        testo: 'I Tropici e i Circoli polari dividono la Terra in cinque zone: una torrida, due temperate e due glaciali.\n\nL’Italia e l’Europa si trovano nella zona temperata boreale.' },
      { gen: 'trova', area: 'mondo', tipo: 'fisica', livello: 'paralleli', quanti: 7, titolo: 'Trova paralleli e meridiani' },
      { gen: 'trova', area: 'mondo', tipo: 'fisica', livello: 'fasce', quanti: 5, titolo: 'Trova le zone climatiche' },
      { att: { tipo: 'vf', titolo: 'Vero o falso?', affermazioni: [
        { testo: 'L’Equatore divide la Terra in emisfero boreale e australe.', vera: true },
        { testo: 'L’Italia si trova nella zona torrida.', vera: false },
        { testo: 'Più si sale in altitudine, più la temperatura diminuisce.', vera: true },
        { testo: 'Il mare rende il clima più freddo d’inverno.', vera: false },
      ] } },
    ],
  },
  {
    classe: 1, titolo: 'I rilievi', sottotitolo: 'Le montagne italiane ed europee',
    passi: [
      { carta: 'Le montagne italiane', mappa: M('italia', 'fisica', { livelli: ['rilievi', 'vette', 'vulcani', 'mari', 'confini'] }),
        testo: 'Le Alpi chiudono l’Italia a nord con un grande arco; gli Appennini la percorrono da nord a sud.\n\nIn Italia ci sono anche vulcani attivi: Etna, Vesuvio, Stromboli.' },
      { gen: 'trova', area: 'italia', tipo: 'fisica', livello: 'vette', quanti: 8, titolo: 'Trova le vette italiane' },
      { gen: 'ordina', area: 'italia', tipo: 'fisica', livello: 'vette', quanti: 6 },
      { carta: 'Le montagne europee', mappa: M('europa', 'fisica', { livelli: ['rilievi', 'vette', 'vulcani', 'mari', 'confini'] }),
        testo: 'Le catene più alte d’Europa sono il Caucaso, le Alpi e i Pirenei. Gli Urali segnano il confine con l’Asia.' },
      { gen: 'trova', area: 'europa', tipo: 'fisica', livello: 'rilievi', quanti: 8, titolo: 'Trova le catene montuose europee' },
      { gen: 'dove', area: 'europa', tipo: 'fisica', livello: 'vette', quanti: 6 },
    ],
  },
  {
    classe: 1, titolo: 'Le pianure', sottotitolo: 'Pianure italiane ed europee',
    passi: [
      { carta: 'Le pianure italiane', mappa: M('italia', 'fisica', { livelli: ['pianure', 'fiumi', 'mari', 'confini'] }),
        testo: 'Le pianure occupano meno di un quarto dell’Italia. La più grande è la Pianura Padana, formata dai detriti portati dal Po e dai suoi affluenti.' },
      { gen: 'trova', area: 'italia', tipo: 'fisica', livello: 'pianure', quanti: 7, titolo: 'Trova le pianure italiane' },
      { gen: 'record', area: 'italia', tipo: 'fisica', livello: 'pianure', quanti: 4 },
      { carta: 'Le pianure europee', mappa: M('europa', 'fisica', { livelli: ['pianure', 'fiumi', 'mari', 'confini'] }),
        testo: 'Una grande pianura attraversa l’Europa dalla Francia alla Russia; nell’Europa centrale si trova la Pianura pannonica, attraversata dal Danubio.' },
      { gen: 'trova', area: 'europa', tipo: 'fisica', livello: 'pianure', quanti: 6, titolo: 'Trova le pianure europee' },
    ],
  },
  {
    classe: 1, titolo: 'L’acqua sulla terra', sottotitolo: 'Fiumi, laghi e mari d’Italia e d’Europa',
    passi: [
      { carta: 'Fiumi e laghi d’Italia', mappa: M('italia', 'fisica', { livelli: ['fiumi', 'laghi', 'mari', 'confini'] }),
        testo: 'I fiumi alpini sono lunghi e ricchi d’acqua; quelli appenninici più brevi e con regime torrentizio.\n\nI grandi laghi del Nord (Garda, Maggiore, Como) sono di origine glaciale.' },
      { gen: 'trova', area: 'italia', tipo: 'fisica', livello: 'fiumi', quanti: 8, titolo: 'Trova i fiumi italiani' },
      { gen: 'etichette', area: 'italia', tipo: 'fisica', livello: 'laghi', quanti: 6, titolo: 'Dai il nome ai laghi' },
      { gen: 'ordina', area: 'italia', tipo: 'fisica', livello: 'fiumi', quanti: 6 },
      { gen: 'etichette', area: 'italia', tipo: 'fisica', livello: 'mari', quanti: 5, titolo: 'I mari che bagnano l’Italia' },
      { gen: 'trova', area: 'europa', tipo: 'fisica', livello: 'fiumi', quanti: 8, titolo: 'Trova i grandi fiumi europei' },
    ],
  },
  {
    classe: 1, titolo: 'Le città', sottotitolo: 'Città italiane ed europee',
    passi: [
      { carta: 'Le città italiane', mappa: M('italia', 'politica', { livelli: ['regioni', 'citta', 'capoluoghi', 'mari'] }),
        testo: 'Ogni regione ha un capoluogo e ogni provincia una città capoluogo. Le città più grandi sono Roma, Milano, Napoli e Torino.' },
      { gen: 'trova', area: 'italia', tipo: 'politica', livello: 'citta', quanti: 8, titolo: 'Trova i capoluoghi di regione' },
      { gen: 'trova', area: 'europa', tipo: 'politica', livello: 'citta', quanti: 8, titolo: 'Trova le capitali europee' },
      { gen: 'record', area: 'europa', tipo: 'politica', livello: 'grandi_citta', quanti: 5 },
    ],
  },
  {
    classe: 1, titolo: 'Uno sguardo sull’Italia', sottotitolo: 'Le 20 regioni, i capoluoghi e i confini',
    passi: [
      { carta: 'Le regioni italiane', mappa: M('italia', 'politica'),
        testo: 'L’Italia è divisa in 20 regioni: 15 a statuto ordinario e 5 a statuto speciale.\n\nClicca una regione per leggere la sua scheda.' },
      { gen: 'trova', area: 'italia', tipo: 'politica', livello: 'regioni', quanti: 10, titolo: 'Trova le regioni' },
      { gen: 'capitali', area: 'italia', tipo: 'politica', livello: 'regioni', quanti: 8 },
      { gen: 'confini', area: 'italia', tipo: 'politica', livello: 'regioni', quanti: 6 },
      { gen: 'flashcard', area: 'italia', tipo: 'politica', livello: 'regioni', quanti: 8 },
    ],
  },
]

// ---------------- 2ª media ----------------
const REGIONI_EUROPA: [string, string][] = [
  ['iberica', 'La Regione iberica'], ['atlantica', 'La Regione atlantica'], ['britannica', 'La Regione britannica'], ['germanica', 'La Regione germanica'],
  ['nordica', 'La Regione nordica'], ['balcanica', 'La Regione balcanica'], ['centro-orientale', 'La Regione centro-orientale'], ['russia', 'La Russia'],
]

const SECONDA: Capitolo[] = [
  {
    classe: 2, titolo: 'L’Europa', sottotitolo: 'Territorio, climi e regioni d’Europa',
    passi: [
      { carta: 'Le regioni d’Europa', mappa: M('europa', 'politica', { livelli: ['macroregioni', 'stati', 'citta', 'mari'] }),
        testo: 'Per studiarla, l’Europa si divide in regioni: iberica, atlantica, britannica, germanica, nordica, balcanica, centro-orientale e la Russia.\n\nClicca una regione o uno Stato per leggere la scheda.' },
      { gen: 'trova', area: 'europa', tipo: 'politica', livello: 'macroregioni', quanti: 8, titolo: 'Trova le regioni d’Europa' },
      { gen: 'dove', area: 'europa', tipo: 'politica', livello: 'stati', quanti: 8, titolo: 'In quale regione d’Europa si trova?' },
      { carta: 'Il territorio europeo', mappa: M('europa', 'fisica'),
        testo: 'L’Europa è una grande penisola dell’Asia, con coste molto frastagliate. Al centro si estende una vasta pianura, a sud ci sono le catene più alte.' },
      { gen: 'trova', area: 'europa', tipo: 'fisica', livello: 'penisole', quanti: 5, titolo: 'Trova le penisole europee' },
    ],
  },
  ...REGIONI_EUROPA.map(([k, nome]): Capitolo => {
    const focus = 'macro-' + k
    const unoStato = k === 'russia'
    return {
      classe: 2, titolo: nome, sottotitolo: unoStato ? 'Il territorio, le città e i fiumi della Russia europea' : 'Gli Stati, le capitali, i rilievi e i fiumi',
      passi: [
        { carta: 'Gli Stati', mappa: Z('europa', 'politica', unoStato ? 'stato-RUS' : focus) },
        unoStato
          ? { gen: 'trova', area: 'europa', tipo: 'politica', livello: 'grandi_citta', quanti: 6, focus: 'stato-RUS', titolo: 'Trova le città russe' }
          : k === 'britannica'
            // solo due Stati: si gioca con le quattro nazioni del Regno Unito
            ? { gen: 'trova', area: 'europa', tipo: 'politica', livello: 'suddivisioni', quanti: 4, focus: 'stato-GBR', titolo: 'Trova le nazioni del Regno Unito' }
            : { gen: 'trova', area: 'europa', tipo: 'politica', livello: 'stati', quanti: 10, focus, titolo: 'Trova gli Stati' },
        unoStato
          ? { gen: 'etichette', area: 'europa', tipo: 'politica', livello: 'suddivisioni', quanti: 6, focus: 'stato-RUS' }
          : { gen: 'capitali', area: 'europa', tipo: 'politica', livello: 'stati', quanti: 10, focus },
        { carta: 'Rilievi e fiumi', mappa: Z('europa', 'fisica', focus),
          testo: 'Clicca montagne, fiumi e laghi per conoscerne le misure. Con il pulsante “Scheda” in basso leggi la scheda della regione.' },
        { gen: 'trova', area: 'europa', tipo: 'fisica', livello: 'fiumi', quanti: 7, focus },
        { gen: unoStato ? 'record' : 'flashcard', area: 'europa', tipo: unoStato ? 'fisica' : 'politica', livello: unoStato ? 'fiumi' : 'stati', quanti: 8, focus },
      ],
    }
  }),
]

// ---------------- 3ª media ----------------
const CONTINENTI: { titolo: string; cont: string; aree: string[]; sottotitolo: string }[] = [
  { titolo: 'L’Africa', cont: 'continente-africa', aree: ['macro-africa-settentrionale', 'macro-africa-centrale', 'macro-africa-meridionale'], sottotitolo: 'Il continente, le sue regioni e gli Stati' },
  { titolo: 'L’Asia', cont: 'continente-asia', aree: ['macro-medio-oriente', 'macro-subcontinente-indiano', 'macro-estremo-oriente'], sottotitolo: 'Medio Oriente, Subcontinente indiano, Sudest asiatico ed Estremo Oriente' },
  { titolo: 'L’America', cont: 'continente-america-nord', aree: ['macro-america-anglosassone', 'macro-america-latina'], sottotitolo: 'America anglosassone e America latina' },
]

const TERZA: Capitolo[] = [
  {
    classe: 3, titolo: 'Alla scoperta della Terra', sottotitolo: 'Continenti, rilievi, acque e climi',
    passi: [
      { carta: 'I continenti', mappa: M('mondo', 'politica'),
        testo: 'Le terre emerse formano sei continenti abitati e l’Antartide.\n\nClicca un continente per vedere superficie e abitanti.' },
      { gen: 'etichette', area: 'mondo', tipo: 'politica', livello: 'continenti', quanti: 7, titolo: 'Dai il nome ai continenti' },
      { carta: 'Rilievi e acque', mappa: M('mondo', 'fisica'),
        testo: 'Le catene più alte sono l’Himalaya e le Ande; i fiumi più lunghi il Nilo e il Rio delle Amazzoni.' },
      { gen: 'trova', area: 'mondo', tipo: 'fisica', livello: 'rilievi', quanti: 8, titolo: 'Trova le grandi catene montuose' },
      { gen: 'trova', area: 'mondo', tipo: 'fisica', livello: 'fiumi', quanti: 8, titolo: 'Trova i grandi fiumi' },
      { gen: 'record', area: 'mondo', tipo: 'fisica', livello: 'fiumi', quanti: 5 },
      { gen: 'trova', area: 'mondo', tipo: 'fisica', livello: 'deserti', quanti: 6, titolo: 'Trova i deserti' },
    ],
  },
  ...CONTINENTI.map(({ titolo: t, cont, aree, sottotitolo }): Capitolo => ({
    classe: 3, titolo: t, sottotitolo,
    passi: [
      { carta: 'Il continente', mappa: Z('mondo', 'politica', cont === 'continente-america-nord' ? undefined : cont, cont === 'continente-america-nord' ? ['macroaree', 'stati', 'citta', 'mari'] : undefined),
        ...(cont === 'continente-america-nord' ? { testo: 'L’America si divide in America anglosassone (Canada e Stati Uniti) e America latina, dal Messico alla Terra del Fuoco.' } : {}) },
      ...aree.flatMap((a): Passo[] => [
        { carta: 'Gli Stati', mappa: Z('mondo', 'politica', a) },
        { gen: 'trova', area: 'mondo', tipo: 'politica', livello: 'stati', quanti: 8, focus: a },
      ]),
      { gen: 'capitali', area: 'mondo', tipo: 'politica', livello: 'stati', quanti: 8, focus: cont === 'continente-america-nord' ? 'macro-america-latina' : cont },
      { carta: 'Rilievi e fiumi', mappa: Z('mondo', 'fisica', cont === 'continente-america-nord' ? 'macro-america-latina' : cont),
        testo: 'Clicca montagne, fiumi, laghi e deserti per conoscerne le misure.' },
      { gen: 'trova', area: 'mondo', tipo: 'fisica', livello: 'fiumi', quanti: 6, focus: cont === 'continente-america-nord' ? 'macro-america-latina' : cont },
    ],
  })),
  {
    classe: 3, titolo: 'L’Oceania', sottotitolo: 'Australia, Nuova Zelanda e le isole del Pacifico',
    passi: [
      { carta: 'Il continente', mappa: Z('mondo', 'politica', 'continente-oceania') },
      { gen: 'trova', area: 'mondo', tipo: 'politica', livello: 'stati', quanti: 6, focus: 'continente-oceania' },
      { gen: 'trova', area: 'mondo', tipo: 'politica', livello: 'suddivisioni', quanti: 8, focus: 'stato-AUS', titolo: 'Trova gli Stati dell’Australia' },
      { carta: 'Il territorio', mappa: Z('mondo', 'fisica', 'continente-oceania') },
      { gen: 'flashcard', area: 'mondo', tipo: 'politica', livello: 'stati', quanti: 6, focus: 'continente-oceania' },
    ],
  },
  {
    classe: 3, titolo: 'I Poli', sottotitolo: 'Artide e Antartide',
    passi: [
      { carta: 'Le zone glaciali', mappa: M('mondo', 'fisica', { livelli: ['fasce', 'paralleli', 'mari', 'rilievi'] }),
        testo: 'Oltre i Circoli polari si trovano le zone glaciali. L’Artide è un oceano ghiacciato; l’Antartide è un continente coperto da una calotta di ghiaccio spessa anche 4 km.' },
      { att: { tipo: 'vf', titolo: 'Vero o falso?', affermazioni: [
        { testo: 'Il Polo Nord si trova su un continente.', vera: false },
        { testo: 'L’Antartide non ha abitanti permanenti.', vera: true },
        { testo: 'Oltre il Circolo polare artico ci sono giorni in cui il Sole non tramonta.', vera: true },
        { testo: 'L’Antartide appartiene alla Norvegia.', vera: false },
      ] } },
      { gen: 'trova', area: 'mondo', tipo: 'fisica', livello: 'paralleli', quanti: 5, titolo: 'Trova i paralleli fondamentali' },
    ],
  },
]

export const CAPITOLI: Capitolo[] = [...PRIMA, ...SECONDA, ...TERZA]

/** Titoli dei vecchi esempi (sostituiti dai capitoli se non sono mai stati modificati) */
export const TITOLI_ESEMPI_V1 = ['Le regioni d’Italia', 'Monti, fiumi e laghi d’Italia', 'Gli Stati e le capitali d’Europa', 'Rilievi e fiumi d’Europa', 'I continenti', 'Climi e ambienti del mondo']

async function costruisci(c: Capitolo): Promise<Percorso> {
  const colore = CLASSI[c.classe].colore
  const tappe: Tappa[] = [copertina(c.classe, c.titolo, c.sottotitolo)]
  for (const p of c.passi) {
    if ('carta' in p) {
      // il testo, se manca, è la descrizione dell'area su cui si fa lo zoom
      let spiegazione = p.testo
      if (!spiegazione && p.mappa.focus) {
        const pol = await caricaGeo(p.mappa.area, 'politica')
        const f = pol.byId.get(p.mappa.focus)
        spiegazione = [f?.properties.desc, f?.properties.i_Stati ? `Stati: ${f.properties.i_Stati}.` : '', 'Clicca sulla carta per leggere le schede.'].filter(Boolean).join('\n\n')
      }
      const nomeFocus = p.mappa.focus ? (await caricaGeo(p.mappa.area, 'politica')).byId.get(p.mappa.focus)?.properties.nome : undefined
      tappe.push(tappa(p.carta, '#ffffff', [
        titolo(nomeFocus ? `${p.carta}: ${nomeFocus}` : p.carta, colore),
        testo(spiegazione ?? '', 40, 120, 360, 560, { size: 22 }),
        mappa(p.mappa, 420, 110, 820, 590),
      ]))
    } else if ('gen' in p) {
      try {
        const o: OpzioniGeneratore = { area: p.area, tipo: p.tipo, livello: p.livello, quanti: p.quanti ?? 8, focus: p.focus }
        const a = await genera(p.gen, o)
        if (p.titolo) a.titolo = p.titolo + (a.titolo.includes(' – ') ? ' – ' + a.titolo.split(' – ')[1] : '')
        const grande = a.tipo === 'trova' || a.tipo === 'etichette' || a.tipo === 'coordinate'
        tappe.push(tappa(a.titolo, grande ? '#ffffff' : CLASSI[c.classe].chiaro, [attivita(a, grande)]))
      } catch (e) {
        console.warn('Attività non creata:', c.titolo, p.gen, e)
      }
    } else {
      tappe.push(tappa(p.att.titolo, CLASSI[c.classe].chiaro, [attivita(p.att)]))
    }
  }
  return percorso(c.classe, c.titolo, c.sottotitolo, tappe)
}

export async function percorsiCapitoli(): Promise<Percorso[]> {
  const out: Percorso[] = []
  for (const c of CAPITOLI) out.push(await costruisci(c))
  // la home ordina per data di modifica (più recente in alto): il primo capitolo deve risultare il più recente
  const t0 = Date.now()
  out.forEach((p, i) => { p.creato = p.aggiornato = t0 - i * 1000 })
  return out
}
