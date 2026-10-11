// Percorsi d'esempio aggiunti dopo i capitoli: i temi di approfondimento (terremoti, clima, Unione europea)
// e le carte mute di Italia, Europa e mondo. Si creano al primo avvio, una sola volta (seed "esempi-v3").
import { M } from './esempi'
import { costruisciCapitolo, Z, type Capitolo, type Passo } from './capitoli'
import { datiClimogramma, domandeClimogramma, domandeTerremoti, grafico, TERREMOTI } from './dati-didattici'
import type { Percorso } from '../types'

/** Quiz con la risposta giusta indicata per posizione */
const quiz = (titolo: string, domande: [string, string[], number][]): Passo => ({
  att: { tipo: 'quiz', titolo, domande: domande.map(([domanda, opzioni, giusta]) => ({ domanda, opzioni, corrette: [giusta] })) },
})
const vf = (titolo: string, affermazioni: [string, boolean][]): Passo => ({
  att: { tipo: 'vf', titolo, affermazioni: affermazioni.map(([testo, vera]) => ({ testo, vera })) },
})
const abbina = (titolo: string, coppie: [string, string][]): Passo => ({
  att: { tipo: 'abbina', titolo, coppie: coppie.map(([a, b]) => ({ a, b })) },
})

// ---------------- temi di approfondimento ----------------
const TEMI = (): Capitolo[] => [
  {
    classe: 1, titolo: 'I terremoti e i vulcani', sottotitolo: 'Perché trema la terra, dove sono i vulcani italiani e come ci si protegge',
    passi: [
      { lezione: 'Perché la terra trema', testo: 'La crosta terrestre è divisa in grandi placche che si muovono lentamente: si allontanano, si scontrano o scorrono una accanto all’altra.\n\nQuando l’energia accumulata lungo una frattura si libera all’improvviso, nasce un terremoto.\n\nIl punto sotto terra dove nasce è l’ipocentro; il punto della superficie che sta proprio sopra di esso è l’epicentro, e lì le scosse sono più forti.\n\nLe onde sismiche si propagano in tutte le direzioni, come i cerchi in uno stagno.' },
      { lezione: 'Misurare un terremoto', testo: 'La magnitudo misura l’energia liberata dal terremoto ed è la stessa ovunque (è la scala resa famosa da Richter).\n\nL’intensità, misurata con la scala Mercalli, descrive gli effetti su persone, case e paesaggio: cambia da luogo a luogo ed è più alta vicino all’epicentro.\n\nOgni aumento di una unità di magnitudo corrisponde a un’energia circa 30 volte maggiore.\n\nLe onde sismiche si registrano con uno strumento chiamato sismografo.' },
      abbina('Le parole dei terremoti', [
        ['Ipocentro', 'Punto sotto terra dove nasce il terremoto'],
        ['Epicentro', 'Punto della superficie sopra l’ipocentro'],
        ['Magnitudo', 'Energia liberata dal terremoto'],
        ['Intensità', 'Effetti del terremoto su cose e persone'],
        ['Sismografo', 'Strumento che registra le onde sismiche'],
      ]),
      { att: grafico('Leggi il grafico: i terremoti italiani', TERREMOTI, domandeTerremoti()) },
      { carta: 'L’Italia dei terremoti e dei vulcani', mappa: M('italia', 'fisica', { livelli: ['rilievi', 'vulcani', 'mari', 'confini'] }),
        testo: 'L’Italia si trova dove la placca africana si avvicina a quella euroasiatica: per questo ha molti terremoti e molti vulcani.\n\nLe zone più a rischio sono l’Appennino, la Calabria, la Sicilia orientale e il Friuli.\n\nI vulcani principali sono l’Etna, lo Stromboli, il Vesuvio, Vulcano e i Campi Flegrei.' },
      { gen: 'trova', area: 'italia', tipo: 'fisica', livello: 'vulcani', quanti: 5, titolo: 'Trova i vulcani italiani' },
      { gen: 'ordina', area: 'italia', tipo: 'fisica', livello: 'vulcani', quanti: 5 },
      { lezione: 'I vulcani', testo: 'Un vulcano è un’apertura della crosta da cui escono magma, gas e ceneri. Il magma che arriva in superficie si chiama lava.\n\nUn vulcano può essere attivo (erutta di tanto in tanto), quiescente (dormiente) oppure spento.\n\nIntorno ai vulcani il terreno è molto fertile, per questo ci vivono molte persone: è un motivo in più per conoscerli e tenerli sotto controllo.' },
      vf('Vero o falso?', [
        ['L’Etna è il vulcano attivo più alto d’Europa.', true],
        ['L’epicentro è il punto in profondità dove nasce il terremoto.', false],
        ['Il magma che esce da un vulcano prende il nome di lava.', true],
        ['La magnitudo misura gli effetti del terremoto sulle case.', false],
        ['I terremoti si verificano solo in Italia.', false],
        ['Il Vesuvio sorge vicino a Napoli.', true],
      ]),
      { lezione: 'Come proteggersi', testo: 'Durante la scossa: ripàrati sotto un tavolo robusto o vicino a un muro portante, lontano da finestre, specchi e mobili che possono cadere. Non usare l’ascensore.\n\nDopo la scossa: esci con calma dalle scale, raggiungi un luogo aperto lontano da edifici e fili elettrici e segui le indicazioni degli adulti e della Protezione civile.\n\nPrepararsi serve: conosci il piano di evacuazione della scuola e le vie di fuga.' },
      quiz('Quiz: sicurezza e terremoti', [
        ['Durante una scossa in classe, che cosa è giusto fare?', ['Ripararsi sotto il banco o vicino a un muro portante', 'Correre verso l’ascensore', 'Affacciarsi alla finestra', 'Uscire di corsa gridando'], 0],
        ['Dopo la scossa, dove ci si raduna?', ['Sotto un balcone', 'In un luogo aperto, lontano dagli edifici', 'Nel garage', 'In ascensore'], 1],
        ['Che cosa misura la magnitudo?', ['La velocità del vento', 'Gli effetti sulle case', 'L’energia liberata dal terremoto', 'La profondità del mare'], 2],
      ]),
    ],
  },
  {
    classe: 1, titolo: 'Il clima e i biomi', sottotitolo: 'Elementi e fattori del clima, climogrammi e ambienti naturali',
    passi: [
      { lezione: 'Tempo e clima', testo: 'Il tempo atmosferico è lo stato dell’atmosfera in un certo luogo e in un certo momento: oggi piove, domani c’è il sole.\n\nIl clima è l’insieme delle condizioni del tempo che si ripetono in un luogo per molti anni.\n\nGli elementi del clima sono: temperatura, precipitazioni, pressione atmosferica, umidità e venti.' },
      { lezione: 'Che cosa cambia il clima', testo: 'I fattori del clima fanno variare gli elementi da luogo a luogo:\n\n• latitudine: più ci si allontana dall’Equatore, più fa freddo;\n• altitudine: salendo di 1000 metri la temperatura scende di circa 6 °C;\n• distanza dal mare: il mare rende più miti inverni ed estati;\n• correnti marine e venti: portano caldo o freddo, umidità o aria secca;\n• rilievi: fermano le nuvole e fanno piovere sul versante che le incontra.' },
      { carta: 'I climi dell’Italia', mappa: M('italia', 'fisica', { livelli: ['rilievi', 'pianure', 'mari', 'confini'] }),
        testo: 'In Italia ci sono più climi.\n\nSulle Alpi: clima alpino, con inverni freddi e nevicate.\n\nNella Pianura Padana: clima continentale, con inverni freddi, estati calde e nebbia.\n\nSulle coste e nelle isole: clima mediterraneo, con inverni miti ed estati calde e asciutte.' },
      { lezione: 'Leggere un climogramma', testo: 'Il climogramma racconta il clima di una città in un anno.\n\nLe barre azzurre sono le piogge di ogni mese (si leggono sulla scala di destra, in millimetri). La linea rossa è la temperatura media del mese (scala di sinistra, in °C).\n\nLe due scale sono legate: 10 °C occupano lo stesso spazio di 20 mm di pioggia. Quando la linea rossa passa sopra la cima delle barre il mese è arido, cioè secco.' },
      ...(['Milano', 'Roma', 'Palermo', 'Londra', 'Mosca'] as const).map((c): Passo => ({ att: grafico(`Climogramma di ${c}`, datiClimogramma(c), domandeClimogramma(c)) })),
      { lezione: 'Confrontiamo i climogrammi', testo: 'Roma e Palermo hanno il clima mediterraneo: estate calda e secca, piogge soprattutto in autunno e in inverno.\n\nMilano ha un clima continentale: inverni più freddi e piogge distribuite in tutto l’anno.\n\nLondra, vicina all’oceano Atlantico, ha estati fresche e inverni miti.\n\nMosca, lontana dal mare, ha l’inverno molto freddo (sotto zero per diversi mesi) e l’estate abbastanza calda: la differenza tra mese più caldo e più freddo, cioè l’escursione termica annua, è grande.' },
      { lezione: 'I biomi', testo: 'Il bioma è un grande ambiente in cui clima, piante e animali sono legati tra loro. In Europa troviamo:\n\n• tundra (estremo nord): freddo intenso, muschi e licheni;\n• taiga (Scandinavia e Russia): foreste di conifere;\n• foresta di latifoglie (Europa centrale): querce, faggi e castagni che perdono le foglie in inverno;\n• steppa (Europa orientale): praterie con poche piante alte;\n• macchia mediterranea (coste del sud): arbusti sempreverdi come leccio, mirto e corbezzolo.' },
      abbina('Abbina il bioma', [
        ['Tundra', 'Muschi e licheni, suolo gelato'],
        ['Taiga', 'Immense foreste di conifere'],
        ['Foresta di latifoglie', 'Querce e faggi che perdono le foglie'],
        ['Macchia mediterranea', 'Arbusti sempreverdi, estati secche'],
        ['Steppa', 'Praterie di erbe'],
      ]),
      vf('Vero o falso?', [
        ['Il tempo atmosferico e il clima sono la stessa cosa.', false],
        ['Salendo in quota la temperatura diminuisce.', true],
        ['Il mare rende più miti gli inverni.', true],
        ['Il clima di Mosca è più mite di quello di Roma.', false],
        ['Le piante della macchia mediterranea sono adatte alle estati secche.', true],
      ]),
      quiz('Quiz: clima e ambienti', [
        ['Quale fattore spiega perché in montagna fa più freddo?', ['L’altitudine', 'La vicinanza al mare', 'Le correnti marine', 'L’umidità'], 0],
        ['Quale clima è tipico delle coste italiane?', ['Alpino', 'Mediterraneo', 'Polare', 'Equatoriale'], 1],
        ['In quale bioma crescono querce e faggi?', ['Tundra', 'Steppa', 'Foresta di latifoglie', 'Deserto'], 2],
        ['Quali sono gli elementi del clima?', ['Latitudine e altitudine', 'Temperatura, precipitazioni, pressione, umidità e venti', 'Montagne e pianure', 'Fiumi e laghi'], 1],
      ]),
    ],
  },
  {
    classe: 1, titolo: 'L’Unione europea', sottotitolo: 'Come è nata, chi ne fa parte, le istituzioni e i simboli',
    passi: [
      { carta: 'Gli Stati dell’Unione', mappa: M('europa', 'politica', { colori: coloriUE() }),
        testo: 'Nel 1957 sei Stati fondano la Comunità europea. Con gli anni se ne sono aggiunti altri e oggi gli Stati membri sono 27 (il Regno Unito è uscito nel 2020).\n\nBlu: fondatori (1957).\nVerde: ingressi dal 1973 al 1995.\nArancio: ingressi del 2004.\nViola: Bulgaria e Romania (2007), Croazia (2013).' },
      { gen: 'trova', area: 'europa', tipo: 'politica', livello: 'stati', nomi: ['Italia', 'Francia', 'Germania', 'Belgio', 'Paesi Bassi', 'Lussemburgo'], titolo: 'Trova i sei Stati fondatori' },
      { gen: 'trova', area: 'europa', tipo: 'politica', livello: 'stati', nomi: ['Polonia', 'Repubblica Ceca', 'Slovacchia', 'Ungheria', 'Slovenia', 'Estonia', 'Lettonia', 'Lituania', 'Cipro', 'Malta'], titolo: 'Trova gli Stati entrati nel 2004' },
      { lezione: 'Le istituzioni europee', testo: 'Parlamento europeo: eletto dai cittadini ogni 5 anni, approva le leggi insieme al Consiglio. Si riunisce a Strasburgo e a Bruxelles.\n\nCommissione europea: propone le nuove leggi e controlla che siano applicate. Ha sede a Bruxelles.\n\nConsiglio dell’Unione europea: riunisce i ministri dei governi degli Stati.\n\nCorte di giustizia: garantisce il rispetto delle norme europee. Ha sede a Lussemburgo.\n\nBanca centrale europea: gestisce la moneta unica. Ha sede a Francoforte.' },
      abbina('Chi fa che cosa?', [
        ['Parlamento europeo', 'È eletto dai cittadini ogni 5 anni'],
        ['Commissione europea', 'Propone le nuove leggi'],
        ['Corte di giustizia', 'Controlla il rispetto delle norme europee'],
        ['Banca centrale europea', 'Gestisce la moneta unica'],
        ['Consiglio dell’UE', 'Riunisce i ministri dei governi degli Stati'],
      ]),
      { lezione: 'Simboli e diritti', testo: 'Bandiera: dodici stelle dorate disposte in cerchio su fondo blu.\nInno: l’«Inno alla gioia», dalla Nona sinfonia di Beethoven.\nFesta: il 9 maggio, Giornata dell’Europa.\nMoneta: l’euro, in circolazione dal 2002 (non tutti gli Stati membri l’hanno adottato).\n\nI cittadini dell’Unione possono viaggiare, studiare e lavorare in tutti gli Stati membri. Con l’accordo di Schengen si passano le frontiere di molti Stati senza controlli.' },
      { gen: 'grafico', area: 'europa', tipo: 'politica', livello: 'stati', nomi: ['Germania', 'Francia', 'Italia', 'Spagna', 'Polonia', 'Romania'], titolo: 'Leggi il grafico: gli Stati più popolosi dell’UE' },
      quiz('Quiz sull’Unione europea', [
        ['In quale anno nasce la Comunità europea con i Trattati di Roma?', ['1945', '1957', '1992', '2002'], 1],
        ['Dal 2020, dopo l’uscita del Regno Unito, quanti Stati fanno parte dell’UE?', ['28', '25', '27', '30'], 2],
        ['Dove ha sede la Commissione europea?', ['Bruxelles', 'Roma', 'Parigi', 'Berlino'], 0],
        ['Quante stelle ha la bandiera europea?', ['Dodici', 'Ventisette', 'Sei', 'Quindici'], 0],
        ['Quale moneta è in circolazione dal 2002 in molti Stati dell’UE?', ['Lira', 'Euro', 'Sterlina', 'Dollaro'], 1],
      ]),
      vf('Vero o falso?', [
        ['L’Italia è tra gli Stati fondatori della Comunità europea.', true],
        ['La Svizzera fa parte dell’Unione europea.', false],
        ['Tutti gli Stati dell’UE usano l’euro.', false],
        ['Il Parlamento europeo è eletto direttamente dai cittadini.', true],
        ['La Norvegia è uno Stato membro dell’UE.', false],
      ]),
    ],
  },
]

/** Colori della carta dell'Unione europea, per anno di ingresso */
function coloriUE(): Record<string, string> {
  const gruppi: [string, string[]][] = [
    ['#2563eb', ['ITA', 'FRA', 'DEU', 'BEL', 'NLD', 'LUX']],
    ['#16a34a', ['DNK', 'IRL', 'GRC', 'ESP', 'PRT', 'AUT', 'FIN', 'SWE']],
    ['#f97316', ['CYP', 'CZE', 'EST', 'HUN', 'LVA', 'LTU', 'MLT', 'POL', 'SVK', 'SVN']],
    ['#a855f7', ['BGR', 'ROU', 'HRV']],
  ]
  return Object.fromEntries(gruppi.flatMap(([colore, stati]) => stati.map((s) => ['stato-' + s, colore])))
}
export { coloriUE }

// ---------------- carte mute ----------------
const NORD_OVEST: [string, string][] = [['regione-2', 'Valle d’Aosta'], ['regione-1', 'Piemonte'], ['regione-7', 'Liguria'], ['regione-3', 'Lombardia']]
const NORD_EST: [string, string][] = [['regione-5', 'Veneto'], ['regione-4', 'Trentino-Alto Adige'], ['regione-6', 'Friuli-Venezia Giulia'], ['regione-8', 'Emilia-Romagna']]
const CENTRO: [string, string][] = [['regione-9', 'Toscana'], ['regione-10', 'Umbria'], ['regione-11', 'Marche'], ['regione-12', 'Lazio']]
const SUD_ISOLE: [string, string][] = [['regione-13', 'Abruzzo'], ['regione-14', 'Molise'], ['regione-15', 'Campania'], ['regione-16', 'Puglia'], ['regione-17', 'Basilicata'], ['regione-18', 'Calabria'], ['regione-19', 'Sicilia'], ['regione-20', 'Sardegna']]

const mute = (area: 'italia' | 'europa' | 'mondo', focus: string, quantiPolitica: number, quantiFisica: number, livelliPolitica?: string[]): Passo[] => [
  { carta: 'Studia la carta', mappa: Z(area, 'politica', focus) },
  { gen: 'carta-muta', area, tipo: 'politica', livello: '', focus, quanti: quantiPolitica, livelli: livelliPolitica },
  { gen: 'carta-muta', area, tipo: 'fisica', livello: '', focus, quanti: quantiFisica },
]

const regioni = (titolo: string, sottotitolo: string, lista: [string, string][]): Capitolo => ({
  classe: 1, titolo, sottotitolo, passi: lista.flatMap(([id]) => mute('italia', id, 12, 12)),
})

const REGIONI_EUROPA_STATI: [string, string, string[]][] = [
  ['Carte mute: la Regione iberica', 'Spagna e Portogallo', ['ESP', 'PRT']],
  ['Carte mute: la Regione atlantica', 'Francia, Belgio, Paesi Bassi e Lussemburgo', ['FRA', 'BEL', 'NLD', 'LUX']],
  ['Carte mute: la Regione britannica', 'Regno Unito e Irlanda', ['GBR', 'IRL']],
  ['Carte mute: la Regione germanica', 'Germania, Austria e Svizzera', ['DEU', 'AUT', 'CHE']],
  ['Carte mute: la Regione nordica', 'Norvegia, Svezia, Finlandia, Danimarca, Islanda e Stati baltici', ['NOR', 'SWE', 'FIN', 'DNK', 'ISL', 'EST', 'LVA', 'LTU']],
  ['Carte mute: la Regione balcanica', 'Dalla Slovenia alla Grecia', ['SVN', 'HRV', 'BIH', 'SRB', 'MNE', 'MKD', 'ALB', 'BGR', 'GRC']],
  ['Carte mute: la Regione centro-orientale', 'Polonia, Cechia, Slovacchia, Ungheria, Romania, Ucraina, Bielorussia e Moldavia', ['POL', 'CZE', 'SVK', 'HUN', 'ROU', 'UKR', 'BLR', 'MDA']],
  ['Carte mute: la Russia', 'La Russia', ['RUS']],
]

const MACROAREE_CONTINENTI: [string, string, string[]][] = [
  ['Carte mute: l’Africa', 'Africa settentrionale, centrale e meridionale', ['macro-africa-settentrionale', 'macro-africa-centrale', 'macro-africa-meridionale']],
  ['Carte mute: l’Asia', 'Medio Oriente, Asia centrale, Subcontinente indiano, Sudest asiatico ed Estremo Oriente', ['macro-medio-oriente', 'macro-asia-centrale', 'macro-subcontinente-indiano', 'macro-estremo-oriente']],
  ['Carte mute: l’America', 'America anglosassone e America latina', ['macro-america-anglosassone', 'macro-america-latina']],
  ['Carte mute: l’Oceania', 'Australia, Nuova Zelanda e le isole del Pacifico', ['continente-oceania']],
]

const MUTE = (): Capitolo[] => [
  {
    classe: 1, titolo: 'Carte mute: l’Italia', sottotitolo: 'Regioni, capoluoghi, mari, fiumi, laghi e monti da collocare sulla carta',
    passi: [
      { carta: 'Osserva la carta', mappa: M('italia', 'politica'), testo: 'Guarda bene la carta politica: poi prova a rifarla senza i nomi.\n\nNelle prossime tappe tocca un nome e poi il luogo giusto sulla carta muta.' },
      { gen: 'etichette', area: 'italia', tipo: 'politica', livello: 'regioni', quanti: 20, titolo: 'Le regioni' },
      { gen: 'etichette', area: 'italia', tipo: 'politica', livello: 'citta', quanti: 20, titolo: 'I capoluoghi di regione' },
      { carta: 'Osserva la carta fisica', mappa: M('italia', 'fisica') },
      { gen: 'etichette', area: 'italia', tipo: 'fisica', livello: 'mari', quanti: 8, titolo: 'I mari' },
      { gen: 'etichette', area: 'italia', tipo: 'fisica', livello: 'fiumi', quanti: 10, titolo: 'I fiumi' },
      { gen: 'etichette', area: 'italia', tipo: 'fisica', livello: 'laghi', quanti: 8, titolo: 'I laghi' },
      { gen: 'etichette', area: 'italia', tipo: 'fisica', livello: 'vette', quanti: 10, titolo: 'Le vette' },
    ],
  },
  regioni('Carte mute: il Nord-Ovest', 'Valle d’Aosta, Piemonte, Liguria e Lombardia', NORD_OVEST),
  regioni('Carte mute: il Nord-Est', 'Veneto, Trentino-Alto Adige, Friuli-Venezia Giulia ed Emilia-Romagna', NORD_EST),
  regioni('Carte mute: il Centro', 'Toscana, Umbria, Marche e Lazio', CENTRO),
  regioni('Carte mute: il Sud e le isole', 'Abruzzo, Molise, Campania, Puglia, Basilicata, Calabria, Sicilia e Sardegna', SUD_ISOLE),
  {
    classe: 2, titolo: 'Carte mute: l’Europa', sottotitolo: 'Stati, capitali, mari, fiumi, monti e penisole da collocare sulla carta',
    passi: [
      { carta: 'Osserva la carta', mappa: M('europa', 'politica'), testo: 'Guarda bene la carta politica: poi prova a rifarla senza i nomi.\n\nNelle prossime tappe tocca un nome e poi il luogo giusto sulla carta muta.' },
      { gen: 'etichette', area: 'europa', tipo: 'politica', livello: 'stati', quanti: 16, titolo: 'Gli Stati' },
      { gen: 'etichette', area: 'europa', tipo: 'politica', livello: 'citta', quanti: 16, titolo: 'Le capitali' },
      { carta: 'Osserva la carta fisica', mappa: M('europa', 'fisica') },
      { gen: 'etichette', area: 'europa', tipo: 'fisica', livello: 'mari', quanti: 8, titolo: 'I mari' },
      { gen: 'etichette', area: 'europa', tipo: 'fisica', livello: 'penisole', quanti: 6, titolo: 'Le penisole' },
      { gen: 'etichette', area: 'europa', tipo: 'fisica', livello: 'rilievi', quanti: 10, titolo: 'I rilievi' },
      { gen: 'etichette', area: 'europa', tipo: 'fisica', livello: 'fiumi', quanti: 10, titolo: 'I fiumi' },
    ],
  },
  ...REGIONI_EUROPA_STATI.map(([nome, sottotitolo, stati]): Capitolo => ({
    classe: 2, titolo: nome, sottotitolo,
    passi: stati.flatMap((s) => mute('europa', 'stato-' + s, 10, 12)),
  })),
  {
    classe: 3, titolo: 'Carte mute: il mondo', sottotitolo: 'Continenti, oceani, Stati, rilievi, fiumi e deserti da collocare sulla carta',
    passi: [
      { carta: 'Osserva la carta', mappa: M('mondo', 'politica'), testo: 'Guarda bene il planisfero: poi prova a rifarlo senza i nomi.\n\nNelle prossime tappe tocca un nome e poi il luogo giusto sulla carta muta.' },
      { gen: 'etichette', area: 'mondo', tipo: 'politica', livello: 'continenti', quanti: 7, titolo: 'I continenti' },
      { gen: 'etichette', area: 'mondo', tipo: 'politica', livello: 'mari', quanti: 7, titolo: 'Gli oceani e i mari' },
      { gen: 'etichette', area: 'mondo', tipo: 'politica', livello: 'stati', quanti: 15, titolo: 'Gli Stati principali' },
      { carta: 'Osserva la carta fisica', mappa: M('mondo', 'fisica') },
      { gen: 'etichette', area: 'mondo', tipo: 'fisica', livello: 'rilievi', quanti: 10, titolo: 'I rilievi' },
      { gen: 'etichette', area: 'mondo', tipo: 'fisica', livello: 'fiumi', quanti: 10, titolo: 'I fiumi' },
      { gen: 'etichette', area: 'mondo', tipo: 'fisica', livello: 'deserti', quanti: 8, titolo: 'I deserti' },
    ],
  },
  ...MACROAREE_CONTINENTI.map(([nome, sottotitolo, aree]): Capitolo => ({
    classe: 3, titolo: nome, sottotitolo,
    passi: aree.flatMap((a) => mute('mondo', a, 16, 14)),
  })),
]

export const CAPITOLI_EXTRA = (): Capitolo[] => [...TEMI(), ...MUTE()]

/** I percorsi aggiunti dal seed "esempi-v3" (le date si assegnano nel seed, per metterli dopo i capitoli) */
export async function percorsiExtra(): Promise<Percorso[]> {
  const out: Percorso[] = []
  for (const c of CAPITOLI_EXTRA()) out.push(await costruisciCapitolo(c))
  return out
}
