// Percorsi d'esempio precaricati al primo avvio (due per classe: politica e fisica)
import { nuovaTappa, nuovoElemento } from '../lib/fabbrica'
import { nuovoId } from '../lib/id'
import { CLASSI, type Area, type Attivita, type Classe, type ContenutoArea, type Elemento, type MappaConfig, type Percorso, type Tappa } from '../types'

export const testo = (t: string, x: number, y: number, w: number, h: number, extra: Record<string, unknown> = {}) =>
  nuovoElemento('testo', { testo: t, x, y, w, h, ...extra } as never)
export const titolo = (t: string, colore: string) => testo(t, 40, 24, 1200, 70, { size: 44, grassetto: true, colore })
export const mappa = (m: MappaConfig, x: number, y: number, w: number, h: number, contenuti: Record<string, ContenutoArea> = {}) =>
  nuovoElemento('mappa', { mappa: m, contenuti, x, y, w, h } as never)
export const attivita = (a: Attivita, grande = false) =>
  nuovoElemento('attivita', (grande ? { attivita: a, x: 30, y: 24, w: 1220, h: 672 } : { attivita: a, x: 190, y: 60, w: 900, h: 600 }) as never)
export const hotspot = (x: number, y: number, titolo: string, t: string, icona = 'ℹ️', colore = '#f59e0b') =>
  nuovoElemento('hotspot', { x, y, w: 60, h: 60, titolo, testo: t, icona, colore } as never)

export function tappa(t: string, sfondo: string, elementi: Elemento[]): Tappa {
  return { ...nuovaTappa(t), sfondo, elementi }
}

export function copertina(classe: Classe, t: string, sotto: string): Tappa {
  const c = CLASSI[classe]
  return tappa('Copertina', c.chiaro, [
    testo(c.emoji, 560, 90, 160, 150, { size: 110, allinea: 'center' }),
    testo(t, 90, 260, 1100, 110, { size: 68, grassetto: true, allinea: 'center', colore: c.colore }),
    testo(sotto, 140, 380, 1000, 90, { size: 30, allinea: 'center', colore: '#334155' }),
    nuovoElemento('pulsante', { etichetta: 'Iniziamo ➜', colore: c.colore, x: 520, y: 520, w: 240, h: 72 } as never),
  ])
}

/** I pulsanti "Iniziamo" della copertina portano alla tappa 2 */
function collega(p: Percorso) {
  const btn = p.tappe[0].elementi.find((e) => e.tipo === 'pulsante')
  if (btn && btn.tipo === 'pulsante' && p.tappe[1]) btn.vaiA = p.tappe[1].id
  return p
}

export function percorso(classe: Classe, t: string, descrizione: string, tappe: Tappa[]): Percorso {
  return collega({ id: nuovoId(), titolo: t, descrizione, classe, tappe, creato: Date.now(), aggiornato: Date.now() })
}

export const M = (area: Area, tipo: MappaConfig['tipo'], extra: Partial<MappaConfig> = {}): MappaConfig => ({ area, tipo, etichette: true, colori: {}, ...extra })

export function esempi(): Percorso[] {
  const verde = CLASSI[1].colore
  const blu = CLASSI[2].colore
  const arancio = CLASSI[3].colore

  const regioni = percorso(1, 'Le regioni d’Italia', 'Scopriamo le 20 regioni italiane e i loro capoluoghi.', [
    copertina(1, 'Le regioni d’Italia', 'Venti regioni, venti capoluoghi: impariamo a riconoscerli!'),
    tappa('La carta politica', '#ffffff', [
      titolo('L’Italia è divisa in 20 regioni', verde),
      testo('Clicca su una regione per vedere il capoluogo, la superficie e gli abitanti.\n\n5 regioni hanno uno statuto speciale: Valle d’Aosta, Trentino-Alto Adige, Friuli-Venezia Giulia, Sicilia e Sardegna.\n\nUsa i pulsanti sulla carta per mostrare le province.', 40, 120, 380, 560, { size: 24 }),
      mappa(M('italia', 'politica', { colori: { 'regione-2': '#a78bfa', 'regione-4': '#a78bfa', 'regione-6': '#a78bfa', 'regione-19': '#a78bfa', 'regione-20': '#a78bfa' } }), 440, 110, 800, 590, {
        'regione-12': { testo: 'Nel Lazio si trova Roma, capitale d’Italia, che ospita al suo interno lo Stato della Città del Vaticano.' },
      }),
    ]),
    tappa('Trova le regioni', '#ffffff', [attivita({ tipo: 'trova', titolo: 'Trova le regioni', mappa: M('italia', 'politica', { etichette: false }), obiettivi: ['regione-3', 'regione-9', 'regione-12', 'regione-15', 'regione-16', 'regione-19', 'regione-20', 'regione-5'] }, true)]),
    tappa('Regioni e capoluoghi', '#f0fdf4', [attivita({ tipo: 'abbina', titolo: 'Abbina ogni regione al suo capoluogo', coppie: [
      { a: 'Piemonte', b: 'Torino' }, { a: 'Veneto', b: 'Venezia' }, { a: 'Emilia-Romagna', b: 'Bologna' }, { a: 'Abruzzo', b: 'L’Aquila' }, { a: 'Basilicata', b: 'Potenza' }, { a: 'Calabria', b: 'Catanzaro' },
    ] })]),
    tappa('Dai il nome alle regioni del Nord', '#ffffff', [attivita({ tipo: 'etichette', titolo: 'Le regioni del Nord', mappa: M('italia', 'politica', { etichette: false }), obiettivi: ['regione-1', 'regione-2', 'regione-3', 'regione-4', 'regione-5', 'regione-6', 'regione-7', 'regione-8'] }, true)]),
    tappa('Vero o falso?', '#f0fdf4', [attivita({ tipo: 'vf', titolo: 'Vero o falso?', affermazioni: [
      { testo: 'Le regioni italiane sono 20.', vera: true },
      { testo: 'Il capoluogo della Lombardia è Brescia.', vera: false },
      { testo: 'La Sicilia è la regione più grande d’Italia.', vera: true },
      { testo: 'Il Molise è una regione a statuto speciale.', vera: false },
      { testo: 'La Valle d’Aosta è la regione più piccola.', vera: true },
    ] })]),
  ])

  const fisicaIt = percorso(1, 'Monti, fiumi e laghi d’Italia', 'Il paesaggio fisico italiano: Alpi, Appennini, pianure, fiumi, laghi e vulcani.', [
    copertina(1, 'Monti, fiumi e laghi d’Italia', 'Esploriamo il paesaggio fisico della nostra penisola'),
    tappa('La carta fisica', '#ffffff', [
      titolo('L’Italia fisica', verde),
      testo('L’Italia è una penisola montuosa: le Alpi la chiudono a nord, gli Appennini la percorrono da nord a sud.\n\nLa pianura più grande è la Pianura Padana, attraversata dal Po.\n\nClicca su monti, fiumi, laghi e vulcani per scoprirne le misure!', 40, 120, 380, 470, { size: 23 }),
      hotspot(200, 610, 'Montagne, colline, pianure', 'Il territorio italiano è formato per il 35% da montagne, per il 42% da colline e solo per il 23% da pianure.', '⛰️', '#92400e'),
      mappa(M('italia', 'fisica'), 440, 110, 800, 590),
    ]),
    tappa('Trova i fiumi', '#ffffff', [attivita({ tipo: 'trova', titolo: 'Trova i fiumi italiani', mappa: M('italia', 'fisica', { etichette: false, livelli: ['fiumi', 'laghi', 'mari', 'confini'] }), obiettivi: ['fiume-po', 'fiume-tevere', 'fiume-arno', 'fiume-adige', 'fiume-piave', 'fiume-volturno'] }, true)]),
    tappa('Le vette più alte', '#fffbeb', [attivita({ tipo: 'ordina', titolo: 'Dalla più alta alla più bassa', consegna: 'Metti in ordine le montagne dalla più alta alla più bassa', elementi: ['Monte Bianco', 'Monte Rosa', 'Cervino', 'Gran Paradiso', 'Etna', 'Gran Sasso (Corno Grande)'] })]),
    tappa('Completa', '#ffffff', [attivita({ tipo: 'completa', titolo: 'Completa il testo', testo: 'Il fiume più lungo d’Italia è il [Po], che nasce dal [Monviso] e sfocia nel mare [Adriatico]. Il lago più grande è il lago di [Garda]. Il vulcano attivo più alto d’Europa è l’[Etna], in [Sicilia].' })]),
    tappa('Quiz', '#fffbeb', [attivita({ tipo: 'quiz', titolo: 'Quiz sul paesaggio', domande: [
      { domanda: 'Quale catena montuosa percorre l’Italia da nord a sud?', opzioni: ['Appennini', 'Alpi', 'Pirenei', 'Carpazi'], corrette: [0] },
      { domanda: 'Quali di questi sono vulcani?', opzioni: ['Vesuvio', 'Cervino', 'Stromboli', 'Monviso'], corrette: [0, 2] },
      { domanda: 'Il Tevere attraversa…', opzioni: ['Firenze', 'Roma', 'Torino', 'Napoli'], corrette: [1] },
      { domanda: 'La seconda pianura d’Italia per estensione è…', opzioni: ['il Tavoliere delle Puglie', 'la Maremma', 'il Campidano', 'l’Agro Pontino'], corrette: [0] },
    ] })]),
  ])

  const capitali = percorso(2, 'Gli Stati e le capitali d’Europa', 'Viaggio tra gli Stati europei: capitali, bandiere e Unione europea.', [
    copertina(2, 'Gli Stati e le capitali d’Europa', 'Un viaggio da Lisbona a Mosca'),
    tappa('La carta politica', '#ffffff', [
      titolo('L’Europa politica', blu),
      testo('L’Europa conta circa 45 Stati.\n\nClicca su uno Stato per scoprire capitale, lingua, moneta e se fa parte dell’Unione europea.\n\nGli Stati in blu sono i 6 fondatori della Comunità europea (1957).', 40, 120, 360, 560, { size: 23 }),
      mappa(M('europa', 'politica', { colori: { 'stato-ITA': '#3b82f6', 'stato-FRA': '#3b82f6', 'stato-DEU': '#3b82f6', 'stato-BEL': '#3b82f6', 'stato-NLD': '#3b82f6', 'stato-LUX': '#3b82f6' } }), 420, 110, 820, 590),
    ]),
    tappa('Trova gli Stati', '#ffffff', [attivita({ tipo: 'trova', titolo: 'Trova gli Stati', mappa: M('europa', 'politica', { etichette: false }), obiettivi: ['stato-FRA', 'stato-DEU', 'stato-ESP', 'stato-POL', 'stato-GRC', 'stato-SWE', 'stato-UKR', 'stato-PRT'] }, true)]),
    tappa('Capitali', '#eff6ff', [attivita({ tipo: 'quiz', titolo: 'Quiz: le capitali', domande: [
      { domanda: 'Qual è la capitale della Germania?', opzioni: ['Monaco di Baviera', 'Berlino', 'Amburgo', 'Francoforte'], corrette: [1] },
      { domanda: 'Qual è la capitale della Svizzera?', opzioni: ['Zurigo', 'Ginevra', 'Berna', 'Basilea'], corrette: [2] },
      { domanda: 'Qual è la capitale dei Paesi Bassi?', opzioni: ['Amsterdam', 'Rotterdam', 'L’Aia', 'Bruxelles'], corrette: [0] },
      { domanda: 'Di quale Stato è questa bandiera?', bandiera: 'pt', opzioni: ['Spagna', 'Portogallo', 'Irlanda', 'Italia'], corrette: [1] },
    ] })]),
    tappa('Abbina', '#ffffff', [attivita({ tipo: 'abbina', titolo: 'Abbina Stato e capitale', coppie: [
      { a: 'Austria', b: 'Vienna' }, { a: 'Polonia', b: 'Varsavia' }, { a: 'Ungheria', b: 'Budapest' }, { a: 'Norvegia', b: 'Oslo' }, { a: 'Grecia', b: 'Atene' }, { a: 'Irlanda', b: 'Dublino' },
    ] })]),
  ])

  const fisicaEu = percorso(2, 'Rilievi e fiumi d’Europa', 'Le grandi catene montuose, le pianure e i fiumi del continente europeo.', [
    copertina(2, 'Rilievi e fiumi d’Europa', 'Dalle Alpi agli Urali, dal Tamigi al Volga'),
    tappa('La carta fisica', '#ffffff', [
      titolo('L’Europa fisica', blu),
      testo('Gli Urali segnano il confine con l’Asia.\n\nAl centro si estende la grande Pianura europea; a sud ci sono le catene più alte: Alpi, Pirenei, Caucaso.\n\nAccendi e spegni i livelli con i pulsanti sopra la carta.', 40, 120, 360, 560, { size: 23 }),
      mappa(M('europa', 'fisica'), 420, 110, 820, 590),
    ]),
    tappa('Trova i fiumi', '#ffffff', [attivita({ tipo: 'trova', titolo: 'Trova i grandi fiumi europei', mappa: M('europa', 'fisica', { etichette: false, livelli: ['fiumi', 'laghi', 'mari', 'confini'] }), obiettivi: ['fiume-danubio', 'fiume-reno', 'fiume-volga', 'fiume-senna', 'fiume-loira', 'fiume-tamigi', 'fiume-elba'] }, true)]),
    tappa('In ordine di lunghezza', '#eff6ff', [attivita({ tipo: 'ordina', titolo: 'Dal più lungo al più corto', consegna: 'Ordina i fiumi dal più lungo al più corto', elementi: ['Volga', 'Danubio', 'Reno', 'Loira', 'Senna', 'Tamigi'] })]),
    tappa('Vero o falso?', '#ffffff', [attivita({ tipo: 'vf', titolo: 'Vero o falso?', affermazioni: [
      { testo: 'Il Volga è il fiume più lungo d’Europa.', vera: true },
      { testo: 'Il monte Elbrus si trova nelle Alpi.', vera: false },
      { testo: 'I Pirenei separano la Spagna dalla Francia.', vera: true },
      { testo: 'Il Danubio sfocia nel mare del Nord.', vera: false },
    ] })]),
  ])

  const continenti = percorso(3, 'I continenti', 'I sette continenti: posizione, dimensioni, popolazione.', [
    copertina(3, 'I continenti', 'Il mondo in sette grandi terre'),
    tappa('Il planisfero politico', '#ffffff', [
      titolo('Il planisfero', arancio),
      testo('Le terre emerse sono divise in continenti.\n\nClicca su un continente per vederne superficie e abitanti. Accendi “Stati” per vedere i confini.', 40, 120, 340, 560, { size: 23 }),
      mappa(M('mondo', 'politica'), 400, 110, 840, 590),
    ]),
    tappa('Dai il nome ai continenti', '#ffffff', [attivita({ tipo: 'etichette', titolo: 'Metti i nomi ai continenti', mappa: M('mondo', 'politica', { etichette: false }), obiettivi: ['continente-europa', 'continente-asia', 'continente-africa', 'continente-america-nord', 'continente-america-sud', 'continente-oceania', 'continente-antartide'] }, true)]),
    tappa('Dal più grande', '#fff7ed', [attivita({ tipo: 'ordina', titolo: 'In ordine di superficie', consegna: 'Ordina i continenti dal più grande al più piccolo', elementi: ['Asia', 'Africa', 'America settentrionale', 'America meridionale', 'Antartide', 'Europa', 'Oceania'] })]),
    tappa('Flashcard', '#ffffff', [attivita({ tipo: 'flashcard', titolo: 'Ripasso veloce', carte: [
      { fronte: 'Il continente più popolato', retro: 'Asia' },
      { fronte: 'Il continente senza abitanti permanenti', retro: 'Antartide' },
      { fronte: 'Il continente attraversato dall’Equatore e dai due Tropici', retro: 'Africa' },
      { fronte: 'Il continente più piccolo', retro: 'Oceania' },
    ] })]),
  ])

  const climi = percorso(3, 'Climi e ambienti del mondo', 'Fasce climatiche, grandi fiumi, montagne e deserti della Terra.', [
    copertina(3, 'Climi e ambienti del mondo', 'Dal caldo dei Tropici al gelo dei Poli'),
    tappa('Le fasce climatiche', '#ffffff', [
      titolo('Le zone astronomiche', arancio),
      testo('I Tropici e i Circoli polari dividono la Terra in 5 fasce: una zona torrida, due temperate e due glaciali.\n\nPiù ci si allontana dall’Equatore, più i raggi del Sole arrivano inclinati e fa freddo.', 40, 120, 340, 560, { size: 23 }),
      mappa(M('mondo', 'fisica', { livelli: ['fasce', 'paralleli', 'deserti', 'rilievi', 'mari'] }), 400, 110, 840, 590),
    ]),
    tappa('Trova sulla carta', '#ffffff', [attivita({ tipo: 'trova', titolo: 'Trova fiumi e montagne', mappa: M('mondo', 'fisica', { etichette: false }), obiettivi: ['fiume-nilo', 'fiume-amazzoni', 'fiume-mississippi', 'fiume-azzurro', 'vetta-everest', 'vetta-aconcagua', 'lago-vittoria'] }, true)]),
    tappa('Quiz', '#fff7ed', [attivita({ tipo: 'quiz', titolo: 'Quiz: climi e ambienti', domande: [
      { domanda: 'Quale parallelo divide la Terra in due emisferi?', opzioni: ['Equatore', 'Tropico del Cancro', 'Circolo polare artico', 'Meridiano di Greenwich'], corrette: [0] },
      { domanda: 'Il deserto caldo più grande del mondo è…', opzioni: ['Gobi', 'Sahara', 'Kalahari', 'Atacama'], corrette: [1] },
      { domanda: 'La montagna più alta della Terra è…', opzioni: ['K2', 'Aconcagua', 'Everest', 'Kilimangiaro'], corrette: [2] },
      { domanda: 'In quale zona si trova l’Italia?', opzioni: ['Torrida', 'Temperata boreale', 'Glaciale artica', 'Temperata australe'], corrette: [1] },
    ] })]),
    tappa('Vero o falso?', '#ffffff', [attivita({ tipo: 'vf', titolo: 'Vero o falso?', affermazioni: [
      { testo: 'Il Nilo sfocia nel mar Mediterraneo.', vera: true },
      { testo: 'Le Ande si trovano in Africa.', vera: false },
      { testo: 'Il lago Bajkal è il lago più profondo del mondo.', vera: true },
      { testo: 'Nella zona torrida fa freddo tutto l’anno.', vera: false },
    ] })]),
  ])

  return [regioni, fisicaIt, capitali, fisicaEu, continenti, climi]
}
