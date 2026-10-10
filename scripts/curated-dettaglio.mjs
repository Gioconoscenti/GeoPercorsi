// Dati di dettaglio curati a mano: regioni italiane, Stati europei, fiumi/laghi/vette in più.
// Valori arrotondati, adatti alla scuola secondaria di primo grado.

/**
 * Fiumi italiani di dettaglio (geometrie da OpenStreetMap, scaricate da build-geo).
 * osm: nomi possibili in OSM. km: lunghezza indicativa.
 */
export const FIUMI_ITALIA = [
  { id: 'po', nome: 'Po', km: 652, foce: 'mare Adriatico', osm: ['Po'], note: 'Il fiume più lungo d’Italia: nasce dal Monviso e attraversa la Pianura Padana.' },
  { id: 'adige', nome: 'Adige', km: 410, foce: 'mare Adriatico', osm: ['Adige', 'Adige - Etsch', 'Etsch - Adige'], note: 'Secondo fiume italiano per lunghezza, attraversa Bolzano, Trento e Verona.' },
  { id: 'tevere', nome: 'Tevere', km: 405, foce: 'mar Tirreno', osm: ['Tevere'], note: 'Nasce dal monte Fumaiolo e attraversa Roma.' },
  { id: 'adda', nome: 'Adda', km: 313, foce: 'Po', osm: ['Adda'], note: 'Affluente del Po, attraversa il lago di Como.' },
  { id: 'oglio', nome: 'Oglio', km: 280, foce: 'Po', osm: ['Oglio'], note: 'Affluente del Po, attraversa il lago d’Iseo.' },
  { id: 'tanaro', nome: 'Tanaro', km: 276, foce: 'Po', osm: ['Tanaro'], note: 'Affluente del Po in Piemonte, passa per Alba e Asti.' },
  { id: 'ticino', nome: 'Ticino', km: 248, foce: 'Po', osm: ['Ticino'], note: 'Nasce in Svizzera e attraversa il lago Maggiore.' },
  { id: 'arno', nome: 'Arno', km: 241, foce: 'mar Ligure', osm: ['Arno'], note: 'Attraversa Firenze e Pisa.' },
  { id: 'piave', nome: 'Piave', km: 220, foce: 'mare Adriatico', osm: ['Piave'], note: 'Il “fiume sacro alla Patria”, teatro di battaglie nella Prima guerra mondiale.' },
  { id: 'reno-it', nome: 'Reno', km: 212, foce: 'mare Adriatico', osm: ['Reno'], note: 'Fiume dell’Emilia-Romagna (da non confondere con il Reno europeo).' },
  { id: 'tagliamento', nome: 'Tagliamento', km: 178, foce: 'mare Adriatico', osm: ['Tagliamento'], note: 'Il principale fiume del Friuli, con un largo letto ghiaioso.' },
  { id: 'volturno', nome: 'Volturno', km: 175, foce: 'mar Tirreno', osm: ['Volturno'], note: 'Il fiume più lungo dell’Italia meridionale.' },
  { id: 'brenta', nome: 'Brenta', km: 174, foce: 'mare Adriatico', osm: ['Brenta'], note: 'Nasce dai laghi di Levico e Caldonazzo e attraversa Bassano del Grappa.' },
  { id: 'secchia', nome: 'Secchia', km: 172, foce: 'Po', osm: ['Secchia'], note: 'Affluente appenninico del Po, in Emilia.' },
  { id: 'ofanto', nome: 'Ofanto', km: 170, foce: 'mare Adriatico', osm: ['Ofanto'], note: 'Il principale fiume della Puglia, nasce in Campania.' },
  { id: 'ombrone', nome: 'Ombrone', km: 161, foce: 'mar Tirreno', osm: ['Ombrone'], note: 'Attraversa la Maremma, in Toscana.' },
  { id: 'dora-baltea', nome: 'Dora Baltea', km: 160, foce: 'Po', osm: ['Dora Baltea', 'Doire Baltée', 'Dora Baltea - Doire Baltée', 'Doire Baltée - Dora Baltea'], note: 'Attraversa tutta la Valle d’Aosta.' },
  { id: 'chiese', nome: 'Chiese', km: 160, foce: 'Oglio', osm: ['Chiese'], note: 'Attraversa il lago d’Idro.' },
  { id: 'liri-garigliano', nome: 'Liri-Garigliano', km: 158, foce: 'mar Tirreno', osm: ['Liri', 'Garigliano'], note: 'Nasce in Abruzzo e segna il confine tra Lazio e Campania.' },
  { id: 'basento', nome: 'Basento', km: 157, foce: 'mar Ionio', osm: ['Basento'], note: 'Il fiume più lungo della Basilicata, passa vicino a Potenza.' },
  { id: 'bormida', nome: 'Bormida', km: 154, foce: 'Tanaro', osm: ['Bormida'], note: 'Nasce in Liguria e scorre in Piemonte.' },
  { id: 'tirso', nome: 'Tirso', km: 153, foce: 'mar di Sardegna', osm: ['Tirso'], note: 'Il fiume più lungo della Sardegna, forma il lago Omodeo.' },
  { id: 'pescara', nome: 'Aterno-Pescara', km: 152, foce: 'mare Adriatico', osm: ['Aterno-Pescara', 'Pescara', 'Aterno'], note: 'Il fiume principale dell’Abruzzo, sfocia a Pescara.' },
  { id: 'panaro', nome: 'Panaro', km: 148, foce: 'Po', osm: ['Panaro'], note: 'Affluente del Po che passa vicino a Modena.' },
  { id: 'salso', nome: 'Imera Meridionale (Salso)', km: 144, foce: 'canale di Sicilia', osm: ['Imera Meridionale', 'Salso', 'Fiume Salso', 'Fiume Imera Meridionale'], note: 'Il fiume più lungo della Sicilia.' },
  { id: 'sesia', nome: 'Sesia', km: 138, foce: 'Po', osm: ['Sesia'], note: 'Nasce dal Monte Rosa e scorre in Piemonte.' },
  { id: 'agri', nome: 'Agri', km: 136, foce: 'mar Ionio', osm: ['Agri'], note: 'Fiume della Basilicata.' },
  { id: 'isonzo', nome: 'Isonzo', km: 136, foce: 'mare Adriatico', osm: ['Isonzo', 'Soča', 'Soča / Isonzo', 'Isonzo / Soča', 'Soča - Isonzo', 'Isonzo - Soča'], note: 'Nasce in Slovenia; sulle sue rive si combatterono 12 battaglie nella Prima guerra mondiale.' },
  { id: 'lambro', nome: 'Lambro', km: 130, foce: 'Po', osm: ['Lambro'], note: 'Attraversa la Brianza e la zona di Milano.' },
  { id: 'flumendosa', nome: 'Flumendosa', km: 127, foce: 'mar Tirreno', osm: ['Flumendosa'], note: 'Secondo fiume della Sardegna.' },
  { id: 'serchio', nome: 'Serchio', km: 126, foce: 'mar Ligure', osm: ['Serchio'], note: 'Attraversa la Garfagnana e la piana di Lucca.' },
  { id: 'taro', nome: 'Taro', km: 126, foce: 'Po', osm: ['Taro'], note: 'Affluente del Po in provincia di Parma.' },
  { id: 'dora-riparia', nome: 'Dora Riparia', km: 125, foce: 'Po', osm: ['Dora Riparia'], note: 'Scende dalla Valle di Susa e sfocia nel Po a Torino.' },
  { id: 'serio', nome: 'Serio', km: 124, foce: 'Adda', osm: ['Serio'], note: 'Fiume della provincia di Bergamo, forma le cascate del Serio.' },
  { id: 'metauro', nome: 'Metauro', km: 121, foce: 'mare Adriatico', osm: ['Metauro'], note: 'Il fiume principale delle Marche.' },
  { id: 'bradano', nome: 'Bradano', km: 120, foce: 'mar Ionio', osm: ['Bradano'], note: 'Scorre tra Basilicata e Puglia.' },
  { id: 'bacchiglione', nome: 'Bacchiglione', km: 118, foce: 'mare Adriatico', osm: ['Bacchiglione'], note: 'Attraversa Vicenza e Padova.' },
  { id: 'sangro', nome: 'Sangro', km: 117, foce: 'mare Adriatico', osm: ['Sangro'], note: 'Nasce nel Parco nazionale d’Abruzzo.' },
  { id: 'scrivia', nome: 'Scrivia', km: 117, foce: 'Po', osm: ['Scrivia'], note: 'Nasce in Liguria e scorre in Piemonte.' },
  { id: 'nera', nome: 'Nera', km: 116, foce: 'Tevere', osm: ['Nera'], note: 'Affluente del Tevere; forma la cascata delle Marmore con il Velino.' },
  { id: 'trebbia', nome: 'Trebbia', km: 115, foce: 'Po', osm: ['Trebbia'], note: 'Affluente del Po vicino a Piacenza.' },
  { id: 'coghinas', nome: 'Coghinas', km: 115, foce: 'mar di Sardegna', osm: ['Coghinas'], note: 'Fiume del nord della Sardegna.' },
  { id: 'tronto', nome: 'Tronto', km: 115, foce: 'mare Adriatico', osm: ['Tronto'], note: 'Segna il confine tra Marche e Abruzzo, passa per Ascoli Piceno.' },
  { id: 'simeto', nome: 'Simeto', km: 113, foce: 'mar Ionio', osm: ['Simeto', 'Fiume Simeto'], note: 'Il fiume principale della Sicilia orientale, scorre ai piedi dell’Etna.' },
  { id: 'livenza', nome: 'Livenza', km: 112, foce: 'mare Adriatico', osm: ['Livenza'], note: 'Fiume di risorgiva tra Friuli e Veneto.' },
  { id: 'fortore', nome: 'Fortore', km: 110, foce: 'mare Adriatico', osm: ['Fortore'], note: 'Scorre tra Campania, Molise e Puglia.' },
  { id: 'belice', nome: 'Belice', km: 107, foce: 'canale di Sicilia', osm: ['Belice', 'Fiume Belice'], note: 'Fiume della Sicilia occidentale.' },
  { id: 'platani', nome: 'Platani', km: 103, foce: 'canale di Sicilia', osm: ['Platani', 'Fiume Platani'], note: 'Fiume della Sicilia meridionale.' },
  { id: 'aniene', nome: 'Aniene', km: 99, foce: 'Tevere', osm: ['Aniene'], note: 'Affluente del Tevere che forma le cascate di Tivoli.' },
  { id: 'isarco', nome: 'Isarco', km: 96, foce: 'Adige', osm: ['Isarco', 'Eisack', 'Isarco - Eisack', 'Eisack - Isarco'], note: 'Affluente dell’Adige che attraversa Bressanone e Bolzano.' },
  { id: 'sinni', nome: 'Sinni', km: 94, foce: 'mar Ionio', osm: ['Sinni'], note: 'Fiume della Basilicata che forma l’invaso di Monte Cotugno.' },
  { id: 'biferno', nome: 'Biferno', km: 93, foce: 'mare Adriatico', osm: ['Biferno'], note: 'Il fiume principale del Molise.' },
  { id: 'crati', nome: 'Crati', km: 91, foce: 'mar Ionio', osm: ['Crati'], note: 'Il fiume più lungo della Calabria, passa per Cosenza.' },
  { id: 'chienti', nome: 'Chienti', km: 91, foce: 'mare Adriatico', osm: ['Chienti'], note: 'Fiume delle Marche.' },
  { id: 'esino', nome: 'Esino', km: 90, foce: 'mare Adriatico', osm: ['Esino'], note: 'Fiume delle Marche che sfocia vicino ad Ancona.' },
  { id: 'trigno', nome: 'Trigno', km: 85, foce: 'mare Adriatico', osm: ['Trigno'], note: 'Segna il confine tra Molise e Abruzzo.' },
  { id: 'neto', nome: 'Neto', km: 84, foce: 'mar Ionio', osm: ['Neto'], note: 'Secondo fiume della Calabria, nasce in Sila.' },
  { id: 'mincio', nome: 'Mincio', km: 75, foce: 'Po', osm: ['Mincio'], note: 'Emissario del lago di Garda, circonda Mantova formando i suoi laghi.' },
  { id: 'sele', nome: 'Sele', km: 64, foce: 'mar Tirreno', osm: ['Sele'], note: 'Fiume della Campania che sfocia nel golfo di Salerno.' },
  { id: 'magra', nome: 'Magra', km: 62, foce: 'mar Ligure', osm: ['Magra'], note: 'Fiume tra Toscana e Liguria.' },
  { id: 'alcantara', nome: 'Alcantara', km: 52, foce: 'mar Ionio', osm: ['Alcantara', 'Fiume Alcantara'], note: 'Famoso per le sue gole di lava basaltica.' },
]

/** Altri laghi italiani (punti) */
export const LAGHI_ITALIA_PUNTI = [
  { id: 'orta', nome: 'Lago d’Orta', km2: 18, coord: [8.40, 45.82], note: 'Detto anche Cusio, in Piemonte, con l’isola di San Giulio.' },
  { id: 'varese', nome: 'Lago di Varese', km2: 15, coord: [8.73, 45.82], note: 'Lago della provincia di Varese.' },
  { id: 'idro', nome: 'Lago d’Idro', km2: 11, coord: [10.53, 45.77], note: 'Lago alpino tra Lombardia e Trentino, attraversato dal Chiese.' },
  { id: 'caldonazzo', nome: 'Lago di Caldonazzo', km2: 6, coord: [11.26, 46.02], note: 'Il lago più grande interamente in Trentino; da qui nasce il Brenta.' },
  { id: 'resia', nome: 'Lago di Resia', km2: 7, coord: [10.52, 46.80], note: 'Lago artificiale in Alto Adige, famoso per il campanile che emerge dalle acque.' },
  { id: 'santa-croce', nome: 'Lago di Santa Croce', km2: 8, coord: [12.40, 46.12], note: 'Il lago più grande della provincia di Belluno, in Veneto.' },
  { id: 'cavazzo', nome: 'Lago di Cavazzo', km2: 1.2, coord: [13.07, 46.33], note: 'Il lago naturale più grande del Friuli-Venezia Giulia.' },
  { id: 'vico', nome: 'Lago di Vico', km2: 12, coord: [12.17, 42.32], note: 'Lago vulcanico nel Lazio, tra i più alti d’Italia.' },
  { id: 'campotosto', nome: 'Lago di Campotosto', km2: 14, coord: [13.38, 42.54], note: 'Lago artificiale in Abruzzo, ai piedi del Gran Sasso.' },
  { id: 'scanno', nome: 'Lago di Scanno', km2: 1, coord: [13.88, 41.91], note: 'Il lago naturale più grande dell’Abruzzo, a forma di cuore.' },
  { id: 'occhito', nome: 'Lago di Occhito', km2: 13, coord: [14.95, 41.58], note: 'Lago artificiale sul Fortore, tra Molise e Puglia.' },
  { id: 'varano', nome: 'Lago di Varano', km2: 60, coord: [15.75, 41.88], note: 'Laguna costiera del Gargano, in Puglia: il più grande lago del Sud.' },
  { id: 'lesina', nome: 'Lago di Lesina', km2: 51, coord: [15.43, 41.88], note: 'Laguna costiera della Puglia, sul Gargano.' },
  { id: 'monte-cotugno', nome: 'Lago di Monte Cotugno', km2: 17, coord: [16.21, 40.15], note: 'Grande invaso artificiale sul Sinni, in Basilicata.' },
  { id: 'arvo', nome: 'Lago Arvo', km2: 8, coord: [16.54, 39.24], note: 'Lago artificiale della Sila, in Calabria.' },
  { id: 'pergusa', nome: 'Lago di Pergusa', km2: 1.8, coord: [14.30, 37.52], note: 'L’unico lago naturale della Sicilia, vicino a Enna.' },
  { id: 'omodeo', nome: 'Lago Omodeo', km2: 22, coord: [8.92, 40.13], note: 'Lago artificiale sul Tirso, uno dei più grandi d’Italia.' },
  { id: 'massaciuccoli', nome: 'Lago di Massaciuccoli', km2: 7, coord: [10.33, 43.83], note: 'Lago costiero in Toscana, caro a Giacomo Puccini.' },
  { id: 'piediluco', nome: 'Lago di Piediluco', km2: 1.5, coord: [12.75, 42.53], note: 'Lago dell’Umbria vicino alla cascata delle Marmore.' },
  { id: 'averno', nome: 'Lago d’Averno', km2: 0.55, coord: [14.08, 40.84], note: 'Lago vulcanico dei Campi Flegrei: per gli antichi era la porta degli Inferi.' },
  { id: 'matese', nome: 'Lago del Matese', km2: 2, coord: [14.40, 41.41], note: 'Il lago carsico più alto d’Italia, in Campania.' },
  { id: 'fiastra', nome: 'Lago di Fiastra', km2: 2, coord: [13.16, 43.04], note: 'Lago artificiale dei Monti Sibillini, nelle Marche.' },
  { id: 'guardialfiera', nome: 'Lago di Guardialfiera', km2: 7, coord: [14.80, 41.80], note: 'Lago artificiale sul Biferno, il più grande del Molise.' },
  { id: 'suviana', nome: 'Lago di Suviana', km2: 1.5, coord: [11.05, 44.12], note: 'Lago artificiale dell’Appennino bolognese.' },
]

/** Altre vette italiane, almeno una per regione */
export const VETTE_ITALIA_EXTRA = [
  { id: 'bernina', nome: 'Pizzo Bernina', m: 4049, coord: [9.908, 46.382], dove: 'Alpi Retiche, tra Lombardia e Svizzera', note: 'La vetta più alta delle Alpi Orientali.' },
  { id: 'coglians', nome: 'Monte Coglians', m: 2780, coord: [12.88, 46.611], dove: 'Alpi Carniche, Friuli-Venezia Giulia', note: 'La vetta più alta del Friuli-Venezia Giulia.' },
  { id: 'saccarello', nome: 'Monte Saccarello', m: 2201, coord: [7.712, 44.061], dove: 'Alpi Liguri', note: 'La vetta più alta della Liguria.' },
  { id: 'prado', nome: 'Monte Prado', m: 2054, coord: [10.41, 44.249], dove: 'Appennino tosco-emiliano', note: 'La vetta più alta della Toscana.' },
  { id: 'amiata', nome: 'Monte Amiata', m: 1738, coord: [11.623, 42.888], dove: 'Toscana meridionale', note: 'Un antico vulcano spento, ricco di boschi di castagni.' },
  { id: 'vettore', nome: 'Monte Vettore', m: 2476, coord: [13.282, 42.82], dove: 'Monti Sibillini, tra Marche e Umbria', note: 'La vetta più alta dei Monti Sibillini.' },
  { id: 'terminillo', nome: 'Monte Terminillo', m: 2217, coord: [12.99, 42.471], dove: 'Appennino centrale, Lazio', note: 'La “montagna di Roma”, meta sciistica.' },
  { id: 'gorzano', nome: 'Monte Gorzano', m: 2458, coord: [13.418, 42.616], dove: 'Monti della Laga, al confine tra Lazio e Abruzzo', note: 'La vetta più alta del Lazio.' },
  { id: 'miletto', nome: 'Monte Miletto', m: 2050, coord: [14.375, 41.453], dove: 'Monti del Matese, Molise', note: 'La vetta più alta del Molise.' },
  { id: 'cervati', nome: 'Monte Cervati', m: 1898, coord: [15.483, 40.283], dove: 'Cilento, Campania', note: 'La vetta più alta della Campania.' },
  { id: 'cornacchia', nome: 'Monte Cornacchia', m: 1151, coord: [15.112, 41.452], dove: 'Monti Dauni, Puglia', note: 'La vetta più alta della Puglia.' },
  { id: 'sirino', nome: 'Monte Sirino', m: 2005, coord: [15.828, 40.135], dove: 'Appennino lucano, Basilicata', note: 'Montagna della Basilicata con il lago Laudemio.' },
  { id: 'dolcedorme', nome: 'Serra Dolcedorme', m: 2267, coord: [16.215, 39.893], dove: 'Massiccio del Pollino, Calabria', note: 'La vetta più alta della Calabria e dell’Appennino meridionale.' },
  { id: 'montalto', nome: 'Montalto (Aspromonte)', m: 1955, coord: [15.919, 38.159], dove: 'Aspromonte, Calabria', note: 'La vetta più alta dell’Aspromonte, nella punta dello stivale.' },
  { id: 'botte-donato', nome: 'Botte Donato (Sila)', m: 1928, coord: [16.441, 39.284], dove: 'Altopiano della Sila, Calabria', note: 'La vetta più alta della Sila.' },
  { id: 'fumaiolo', nome: 'Monte Fumaiolo', m: 1407, coord: [12.064, 43.786], dove: 'Appennino tosco-romagnolo, Emilia-Romagna', note: 'Dalle sue pendici nasce il Tevere.' },
  { id: 'carbonara', nome: 'Pizzo Carbonara (Madonie)', m: 1979, coord: [14.033, 37.884], dove: 'Madonie, Sicilia', note: 'La vetta più alta della Sicilia dopo l’Etna.' },
  { id: 'grappa', nome: 'Monte Grappa', m: 1775, coord: [11.8, 45.87], dove: 'Prealpi venete', note: 'Montagna simbolo della Prima guerra mondiale.' },
  { id: 'baldo', nome: 'Monte Baldo', m: 2218, coord: [10.84, 45.7], dove: 'Prealpi, tra Veneto e Trentino, sul lago di Garda', note: 'Detto “giardino d’Europa” per la ricchezza della sua flora.' },
  { id: 'adamello', nome: 'Adamello', m: 3539, coord: [10.495, 46.155], dove: 'Alpi Retiche meridionali, tra Lombardia e Trentino', note: 'Ospita il più grande ghiacciaio delle Alpi italiane.' },
  { id: 'pizzo-coca', nome: 'Pizzo Coca', m: 3050, coord: [10.01, 46.07], dove: 'Alpi Orobie, Lombardia', note: 'La vetta più alta delle Alpi Orobie.' },
  { id: 'montasio', nome: 'Jôf di Montasio', m: 2754, coord: [13.43, 46.44], dove: 'Alpi Giulie, Friuli-Venezia Giulia', note: 'Montagna simbolo delle Alpi Giulie italiane.' },
  { id: 'beigua', nome: 'Monte Beigua', m: 1287, coord: [8.57, 44.43], dove: 'Appennino ligure', note: 'Dà il nome a un geoparco UNESCO affacciato sul mare.' },
  { id: 'subasio', nome: 'Monte Subasio', m: 1290, coord: [12.68, 43.06], dove: 'Appennino umbro, sopra Assisi', note: 'Montagna di San Francesco, che domina Assisi.' },
  { id: 'cucco', nome: 'Monte Cucco', m: 1566, coord: [12.73, 43.38], dove: 'Appennino umbro-marchigiano, Umbria', note: 'Famoso per le grotte e il volo libero.' },
  { id: 'limbara', nome: 'Monte Limbara', m: 1359, coord: [9.17, 40.85], dove: 'Gallura, Sardegna', note: 'Massiccio granitico del nord della Sardegna.' },
]

/** Capoluoghi di provincia diversi dal nome della provincia (sigla → comune ISTAT) */
export const CAPOLUOGHI_SPECIALI = {
  AO: 'Aosta', FC: 'Forlì', PU: 'Pesaro', MS: 'Massa', VB: 'Verbania', MB: 'Monza', BT: 'Barletta', BZ: 'Bolzano',
  RE: 'Reggio nell\'Emilia', RC: 'Reggio di Calabria', OT: 'Olbia', OG: 'Tortolì', VS: 'Sanluri', CI: 'Carbonia',
}

/** Dettagli delle regioni italiane (codice ISTAT) */
export const DETTAGLI_REGIONI = {
  1: { mari: 'nessuno', rilievi: 'Alpi Occidentali (Monte Rosa, Monviso, Gran Paradiso), Langhe e Monferrato', prodotti: 'vini (Barolo, Barbaresco), nocciole, tartufo bianco d’Alba, riso, cioccolato', curiosita: 'Torino fu la prima capitale d’Italia (1861). Il Piemonte è la regione con più comuni dopo la Lombardia.' },
  2: { mari: 'nessuno', rilievi: 'Alpi Occidentali: Monte Bianco, Monte Rosa, Cervino, Gran Paradiso', prodotti: 'fontina, lardo di Arnad, mocetta, vini di montagna', curiosita: 'È la regione più piccola e meno popolata d’Italia; è bilingue (italiano e francese).' },
  3: { mari: 'nessuno', rilievi: 'Alpi Retiche (Pizzo Bernina), Prealpi, Pianura Padana', prodotti: 'risotto alla milanese, panettone, grana padano, gorgonzola, bresaola della Valtellina', curiosita: 'È la regione più popolata d’Italia e quella con più comuni. Ospita i laghi di Como, Iseo e parte del Garda e del Maggiore.' },
  4: { mari: 'nessuno', rilievi: 'Alpi Retiche, Dolomiti, Ortles', prodotti: 'mele, speck, vini, canederli, strudel', curiosita: 'È formata da due province autonome, Trento e Bolzano; in Alto Adige si parla soprattutto tedesco. Le Dolomiti sono Patrimonio UNESCO.' },
  5: { mari: 'mare Adriatico', rilievi: 'Dolomiti (Marmolada), Prealpi (Monte Grappa, Monte Baldo), Colli Euganei', prodotti: 'prosecco, radicchio di Treviso, baccalà alla vicentina, tiramisù, Asiago', curiosita: 'Venezia è costruita su 118 isolette nella laguna. Il Veneto è la regione più visitata dai turisti.' },
  6: { mari: 'mare Adriatico', rilievi: 'Alpi Carniche (Monte Coglians), Alpi Giulie, Carso', prodotti: 'prosciutto di San Daniele, frico, montasio, vini del Collio', curiosita: 'Vi si parlano italiano, friulano, sloveno e tedesco. Trieste è uno dei porti più importanti del Mediterraneo.' },
  7: { mari: 'mar Ligure', rilievi: 'Alpi Liguri (Monte Saccarello), Appennino ligure', prodotti: 'pesto, focaccia, olio taggiasco, farinata', curiosita: 'È una sottile striscia di terra tra monti e mare; le Cinque Terre sono Patrimonio UNESCO.' },
  8: { mari: 'mare Adriatico', rilievi: 'Appennino tosco-emiliano (Monte Cimone), Pianura Padana', prodotti: 'parmigiano reggiano, prosciutto di Parma, aceto balsamico, tortellini, piadina', curiosita: 'È la terra dei motori (Ferrari, Lamborghini, Ducati). Bologna ospita l’università più antica del mondo occidentale (1088).' },
  9: { mari: 'mar Ligure, mar Tirreno', rilievi: 'Appennino tosco-emiliano, Alpi Apuane, Monte Amiata', prodotti: 'Chianti, olio, bistecca alla fiorentina, pecorino, cantucci', curiosita: 'Firenze è la culla del Rinascimento; dal marmo di Carrara Michelangelo ricavò il David.' },
  10: { mari: 'nessuno', rilievi: 'Appennino umbro-marchigiano, Monti Sibillini', prodotti: 'tartufo nero, lenticchie di Castelluccio, olio, cioccolato di Perugia', curiosita: 'È il “cuore verde d’Italia”; ospita il lago Trasimeno e la cascata delle Marmore. Assisi è la città di San Francesco.' },
  11: { mari: 'mare Adriatico', rilievi: 'Appennino umbro-marchigiano, Monti Sibillini (Monte Vettore)', prodotti: 'olive all’ascolana, vincisgrassi, Verdicchio, ciauscolo', curiosita: 'È l’unica regione italiana con un nome al plurale. Urbino è Patrimonio UNESCO.' },
  12: { mari: 'mar Tirreno', rilievi: 'Appennino centrale (Terminillo), colli Albani, monti della Laga', prodotti: 'carbonara, amatriciana, cacio e pepe, pecorino romano, carciofi', curiosita: 'Roma è la capitale d’Italia e al suo interno si trova la Città del Vaticano. Nel Lazio ci sono molti laghi vulcanici.' },
  13: { mari: 'mare Adriatico', rilievi: 'Gran Sasso (Corno Grande), Maiella, monti della Laga', prodotti: 'arrosticini, confetti di Sulmona, zafferano dell’Aquila, Montepulciano d’Abruzzo', curiosita: 'È la “regione verde d’Europa”: un terzo del territorio è protetto da parchi.' },
  14: { mari: 'mare Adriatico', rilievi: 'Monti del Matese (Monte Miletto), Mainarde', prodotti: 'caciocavallo, tartufo, olio, pasta', curiosita: 'È la seconda regione più piccola; fino al 1963 formava un’unica regione con l’Abruzzo.' },
  15: { mari: 'mar Tirreno', rilievi: 'Appennino campano, Vesuvio, Monti Picentini, Cilento', prodotti: 'pizza napoletana, mozzarella di bufala, limoni di Sorrento, pastiera, babà', curiosita: 'È la regione più densamente popolata. Pompei, la Costiera Amalfitana e la Reggia di Caserta sono Patrimonio UNESCO.' },
  16: { mari: 'mare Adriatico, mar Ionio', rilievi: 'Gargano, Murge, Monti Dauni', prodotti: 'orecchiette, burrata, olio extravergine, pane di Altamura, taralli', curiosita: 'È la regione con la costa più lunga della penisola; Alberobello è famosa per i trulli.' },
  17: { mari: 'mar Tirreno, mar Ionio', rilievi: 'Appennino lucano (Monte Sirino), Pollino, Vulture', prodotti: 'peperoni cruschi, pane di Matera, Aglianico del Vulture, lucanica', curiosita: 'Matera, con i suoi Sassi, è una delle città abitate più antiche del mondo. Si chiama anche Lucania.' },
  18: { mari: 'mar Tirreno, mar Ionio', rilievi: 'Pollino, Sila, Serre, Aspromonte', prodotti: '’nduja, peperoncino, cipolla rossa di Tropea, liquirizia, bergamotto', curiosita: 'È la “punta dello stivale”; a Reggio Calabria si trovano i Bronzi di Riace.' },
  19: { mari: 'mar Tirreno, mar Ionio, canale di Sicilia', rilievi: 'Etna, Madonie, Nebrodi, Peloritani', prodotti: 'arancini, cannoli, cassata, granita, pistacchi di Bronte, arance rosse', curiosita: 'È la regione più grande d’Italia e l’isola più grande del Mediterraneo; l’Etna è il vulcano attivo più alto d’Europa.' },
  20: { mari: 'mar Tirreno, mar di Sardegna', rilievi: 'Gennargentu (Punta La Marmora), Limbara, Supramonte', prodotti: 'pecorino sardo, pane carasau, culurgiones, seadas, mirto', curiosita: 'È la seconda isola del Mediterraneo; vi si trovano i nuraghi, antiche torri di pietra, e vi si parla anche il sardo.' },
}

/**
 * Dettagli degli Stati europei (ADM0_A3).
 * km2: superficie; governo; ue: anno di ingresso; curiosita.
 */
export const DETTAGLI_STATI = {
  ALB: { km2: 28748, governo: 'repubblica parlamentare', curiosita: 'Le sue coste si affacciano sull’Adriatico e sullo Ionio, di fronte alla Puglia.' },
  AND: { km2: 468, governo: 'principato (coprincipato)', curiosita: 'Piccolo Stato sui Pirenei, ha due capi di Stato: il vescovo di Urgell e il presidente francese.' },
  AUT: { km2: 83879, governo: 'repubblica federale', ue: 1995, curiosita: 'È quasi tutta montuosa (Alpi); Vienna è la città della musica di Mozart e Strauss.' },
  BEL: { km2: 30528, governo: 'monarchia costituzionale', ue: 1957, curiosita: 'Bruxelles ospita le principali istituzioni dell’Unione europea; famoso per cioccolato e fumetti.' },
  BIH: { km2: 51197, governo: 'repubblica federale', curiosita: 'Il ponte di Mostar, ricostruito dopo la guerra, è Patrimonio UNESCO.' },
  BGR: { km2: 110994, governo: 'repubblica parlamentare', ue: 2007, curiosita: 'Usa l’alfabeto cirillico; è famosa per lo yogurt e l’olio di rose.' },
  BLR: { km2: 207600, governo: 'repubblica presidenziale', curiosita: 'È un Paese pianeggiante e ricco di foreste e paludi, senza sbocco sul mare.' },
  CHE: { km2: 41285, governo: 'repubblica federale (confederazione)', curiosita: 'Ha quattro lingue nazionali, tra cui l’italiano (Canton Ticino); è famosa per orologi, cioccolato e banche.' },
  CYP: { km2: 9251, governo: 'repubblica presidenziale', ue: 2004, curiosita: 'Isola del Mediterraneo orientale, divisa dal 1974 tra parte greca e parte turca.' },
  CZE: { km2: 78871, governo: 'repubblica parlamentare', ue: 2004, curiosita: 'Praga è detta “la città dalle cento torri”; il Paese è famoso per il vetro di Boemia.' },
  DEU: { km2: 357592, governo: 'repubblica federale', ue: 1957, curiosita: 'È lo Stato più popoloso dell’Unione europea e la sua maggiore economia; è formata da 16 Länder.' },
  DNK: { km2: 42933, governo: 'monarchia costituzionale', ue: 1973, curiosita: 'È formata dalla penisola dello Jutland e da centinaia di isole; qui sono nati i mattoncini LEGO.' },
  ESP: { km2: 505990, governo: 'monarchia costituzionale', ue: 1986, curiosita: 'Occupa gran parte della Penisola iberica; Madrid è una delle capitali più alte d’Europa.' },
  EST: { km2: 45339, governo: 'repubblica parlamentare', ue: 2004, curiosita: 'È uno dei Paesi più digitali del mondo: quasi tutti i servizi pubblici sono online.' },
  FIN: { km2: 338455, governo: 'repubblica parlamentare', ue: 1995, curiosita: 'È la “terra dei mille laghi” (in realtà oltre 180.000); in Lapponia vive Babbo Natale.' },
  FRA: { km2: 551695, governo: 'repubblica semipresidenziale', ue: 1957, curiosita: 'È lo Stato più esteso dell’Unione europea; Parigi, con la Torre Eiffel, è tra le città più visitate al mondo.' },
  GBR: { km2: 243610, governo: 'monarchia costituzionale', curiosita: 'È formato da Inghilterra, Scozia, Galles e Irlanda del Nord; è uscito dall’Unione europea nel 2020.' },
  GRC: { km2: 131957, governo: 'repubblica parlamentare', ue: 1981, curiosita: 'Ha migliaia di isole; Atene è la culla della democrazia e dei Giochi olimpici.' },
  HRV: { km2: 56594, governo: 'repubblica parlamentare', ue: 2013, curiosita: 'Ha più di mille isole sull’Adriatico; Dubrovnik è detta “la perla dell’Adriatico”.' },
  HUN: { km2: 93030, governo: 'repubblica parlamentare', ue: 2004, curiosita: 'Budapest è formata dall’unione di Buda e Pest, separate dal Danubio; qui è nato il cubo di Rubik.' },
  IRL: { km2: 70273, governo: 'repubblica parlamentare', ue: 1973, curiosita: 'È detta “l’isola di smeraldo” per i suoi prati verdi; il simbolo nazionale è il trifoglio.' },
  ISL: { km2: 103000, governo: 'repubblica parlamentare', curiosita: 'È un’isola di vulcani, ghiacciai e geyser; il suo parlamento è tra i più antichi del mondo (930).' },
  ITA: { km2: 302068, governo: 'repubblica parlamentare', ue: 1957, curiosita: 'È lo Stato con più siti Patrimonio UNESCO al mondo; al suo interno ci sono San Marino e il Vaticano.' },
  KOS: { km2: 10887, governo: 'repubblica parlamentare', curiosita: 'Ha dichiarato l’indipendenza dalla Serbia nel 2008, ma non tutti gli Stati la riconoscono.' },
  LIE: { km2: 160, governo: 'principato (monarchia costituzionale)', curiosita: 'Piccolo Stato alpino tra Svizzera e Austria, senza esercito.' },
  LTU: { km2: 65300, governo: 'repubblica semipresidenziale', ue: 2004, curiosita: 'È il più grande dei tre Paesi baltici; la sua lingua è tra le più antiche d’Europa.' },
  LUX: { km2: 2586, governo: 'granducato (monarchia costituzionale)', ue: 1957, curiosita: 'È uno degli Stati più ricchi del mondo e sede di istituzioni europee.' },
  LVA: { km2: 64589, governo: 'repubblica parlamentare', ue: 2004, curiosita: 'Più della metà del territorio è coperta da foreste; Riga è famosa per i palazzi liberty.' },
  MCO: { km2: 2, governo: 'principato (monarchia costituzionale)', curiosita: 'È il secondo Stato più piccolo del mondo; famoso per il Gran Premio di Formula 1.' },
  MDA: { km2: 33846, governo: 'repubblica parlamentare', curiosita: 'È un Paese agricolo tra Romania e Ucraina, famoso per le grandi cantine di vino.' },
  MKD: { km2: 25713, governo: 'repubblica parlamentare', curiosita: 'Il lago di Ocrida, condiviso con l’Albania, è uno dei più antichi d’Europa.' },
  MLT: { km2: 316, governo: 'repubblica parlamentare', ue: 2004, curiosita: 'È lo Stato più piccolo dell’Unione europea; ha templi preistorici più antichi delle piramidi.' },
  MNE: { km2: 13812, governo: 'repubblica parlamentare', curiosita: 'Il suo nome significa “montagna nera”; le bocche di Cattaro sono un fiordo sull’Adriatico.' },
  NLD: { km2: 41543, governo: 'monarchia costituzionale', ue: 1957, curiosita: 'Circa un quarto del territorio è sotto il livello del mare, protetto da dighe; famoso per tulipani e mulini.' },
  NOR: { km2: 385207, governo: 'monarchia costituzionale', curiosita: 'Le sue coste sono ricche di fiordi; d’estate al nord il Sole non tramonta mai (sole di mezzanotte).' },
  POL: { km2: 312696, governo: 'repubblica parlamentare', ue: 2004, curiosita: 'Patria di Copernico e Marie Curie; Cracovia ha uno dei centri storici più belli d’Europa.' },
  PRT: { km2: 92212, governo: 'repubblica semipresidenziale', ue: 1986, curiosita: 'È lo Stato più occidentale dell’Europa continentale; i suoi navigatori esplorarono il mondo.' },
  ROU: { km2: 238397, governo: 'repubblica semipresidenziale', ue: 2007, curiosita: 'La sua lingua deriva dal latino come l’italiano; la Transilvania è famosa per i castelli.' },
  RUS: { km2: 17098246, governo: 'repubblica federale presidenziale', curiosita: 'È lo Stato più esteso del mondo, tra Europa e Asia; la parte europea arriva fino agli Urali.' },
  SMR: { km2: 61, governo: 'repubblica parlamentare', curiosita: 'È una delle repubbliche più antiche del mondo (fondata, secondo la tradizione, nel 301).' },
  SRB: { km2: 77474, governo: 'repubblica parlamentare', curiosita: 'Belgrado sorge dove la Sava si getta nel Danubio; usa sia l’alfabeto cirillico sia quello latino.' },
  SVK: { km2: 49035, governo: 'repubblica parlamentare', ue: 2004, curiosita: 'Ha moltissimi castelli e i monti Tatra; fino al 1993 formava la Cecoslovacchia con la Repubblica Ceca.' },
  SVN: { km2: 20271, governo: 'repubblica parlamentare', ue: 2004, curiosita: 'Confina con l’Italia; più della metà del territorio è coperta da boschi.' },
  SWE: { km2: 450295, governo: 'monarchia costituzionale', ue: 1995, curiosita: 'Ogni anno a Stoccolma si consegnano i premi Nobel.' },
  UKR: { km2: 603550, governo: 'repubblica semipresidenziale', curiosita: 'È lo Stato più esteso interamente in Europa; è detta “granaio d’Europa” per le sue pianure coltivate.' },
  VAT: { km2: 0.44, governo: 'monarchia assoluta elettiva (il Papa)', curiosita: 'È lo Stato più piccolo del mondo, interamente circondato da Roma.' },
  TUR: { km2: 783562, governo: 'repubblica presidenziale', curiosita: 'Istanbul sorge su due continenti, divisi dallo stretto del Bosforo.' },
}

/** Mari su cui si affacciano gli Stati europei */
export const MARI_STATI = {
  ALB: 'mare Adriatico, mar Ionio', AUT: 'nessuno', BEL: 'mare del Nord', BIH: 'mare Adriatico (piccolo tratto)', BGR: 'mar Nero', BLR: 'nessuno',
  CHE: 'nessuno', CYP: 'mar Mediterraneo', CZE: 'nessuno', DEU: 'mare del Nord, mar Baltico', DNK: 'mare del Nord, mar Baltico', ESP: 'oceano Atlantico, mar Mediterraneo',
  EST: 'mar Baltico', FIN: 'mar Baltico', FRA: 'oceano Atlantico, canale della Manica, mar Mediterraneo', GBR: 'oceano Atlantico, mare del Nord, canale della Manica',
  GRC: 'mar Ionio, mar Egeo, mar Mediterraneo', HRV: 'mare Adriatico', HUN: 'nessuno', IRL: 'oceano Atlantico, mare d’Irlanda', ISL: 'oceano Atlantico, mar Glaciale Artico',
  ITA: 'mar Ligure, mar Tirreno, mar Ionio, mare Adriatico', KOS: 'nessuno', LIE: 'nessuno', LTU: 'mar Baltico', LUX: 'nessuno', LVA: 'mar Baltico', MCO: 'mar Mediterraneo',
  MDA: 'nessuno', MKD: 'nessuno', MLT: 'mar Mediterraneo', MNE: 'mare Adriatico', NLD: 'mare del Nord', NOR: 'mare del Nord, mare di Norvegia, mare di Barents',
  POL: 'mar Baltico', PRT: 'oceano Atlantico', ROU: 'mar Nero', RUS: 'mar Baltico, mar Nero, mar Caspio, mar Glaciale Artico', SMR: 'nessuno', SRB: 'nessuno',
  SVK: 'nessuno', SVN: 'mare Adriatico', SWE: 'mar Baltico, mare del Nord', UKR: 'mar Nero, mare d’Azov', VAT: 'nessuno', TUR: 'mar Nero, mar Egeo, mar Mediterraneo',
  AND: 'nessuno',
}

/** Suddivisioni: come raggruppare le unità amministrative di Natural Earth per alcuni Stati */
export const RAGGRUPPA_SUDDIVISIONI = { FRA: 'region', ESP: 'region', GBR: 'geonunit', SVN: 'region', LVA: 'region', MKD: 'region', MLT: 'region', KOS: 'region' }

/** Stati senza suddivisioni (troppo piccoli) */
export const SENZA_SUDDIVISIONI = new Set(['AND', 'LIE', 'MCO', 'SMR', 'VAT', 'MLT', 'LUX', 'CYP'])

/** Nomi italiani delle suddivisioni raggruppate */
export const NOMI_SUDDIVISIONI = {
  // Francia (regioni)
  'Hauts-de-France': 'Alta Francia', 'Grand Est': 'Grand Est', 'Provence-Alpes-Côte-d\'Azur': 'Provenza-Alpi-Costa Azzurra', 'Auvergne-Rhône-Alpes': 'Alvernia-Rodano-Alpi',
  'Nouvelle-Aquitaine': 'Nuova Aquitania', Occitanie: 'Occitania', 'Bourgogne-Franche-Comté': 'Borgogna-Franca Contea', 'Pays de la Loire': 'Paesi della Loira',
  Bretagne: 'Bretagna', Normandie: 'Normandia', Corse: 'Corsica', 'Centre-Val de Loire': 'Centro-Valle della Loira', 'Île-de-France': 'Île-de-France',
  // Spagna (comunità autonome)
  'Foral de Navarra': 'Navarra', 'País Vasco': 'Paesi Baschi', Aragón: 'Aragona', Cataluña: 'Catalogna', Extremadura: 'Estremadura', Andalucía: 'Andalusia',
  Galicia: 'Galizia', 'Castilla y León': 'Castiglia e León', Valenciana: 'Comunità Valenciana', Murcia: 'Murcia', Asturias: 'Asturie', Cantabria: 'Cantabria',
  'Canary Is.': 'Isole Canarie', 'Islas Baleares': 'Isole Baleari', 'La Rioja': 'La Rioja', 'Castilla-La Mancha': 'Castiglia-La Mancia', Madrid: 'Comunità di Madrid',
  Ceuta: 'Ceuta', Melilla: 'Melilla',
  // Regno Unito (nazioni)
  England: 'Inghilterra', Scotland: 'Scozia', Wales: 'Galles', 'Northern Ireland': 'Irlanda del Nord',
  // Lettonia
  Kurzeme: 'Curlandia', Zemgale: 'Semgallia', Vidzeme: 'Vidzeme', Latgale: 'Latgallia', Riga: 'Riga',
}

/** Nome del tipo di suddivisione per Stato (singolare) */
export const TIPO_SUDDIVISIONE = {
  FRA: 'regione', ESP: 'comunità autonoma', GBR: 'nazione', DEU: 'Land (Stato federato)', AUT: 'Land (Stato federato)', CHE: 'cantone', POL: 'voivodato',
  BEL: 'provincia', NLD: 'provincia', PRT: 'distretto', GRC: 'regione', SWE: 'contea', NOR: 'contea', FIN: 'regione', DNK: 'regione', IRL: 'contea',
  ROU: 'distretto', HUN: 'contea', CZE: 'regione', SVK: 'regione', SVN: 'regione statistica', HRV: 'regione', BGR: 'provincia', SRB: 'distretto',
  UKR: 'regione (oblast)', BLR: 'regione', RUS: 'soggetto federale', LTU: 'contea', LVA: 'regione', EST: 'contea', ALB: 'prefettura', MKD: 'regione',
  MNE: 'comune', BIH: 'entità/cantone', KOS: 'distretto', MDA: 'distretto', ISL: 'regione', TUR: 'provincia',
}

/** Regioni d'Europa come nel libro di 2ª media (Cipro e Turchia restano fuori) */
export const MACROREGIONI_EUROPA = {
  iberica: { nome: 'Regione iberica', stati: ['ESP', 'PRT', 'AND'], desc: 'Occupa la Penisola iberica, separata dal resto d’Europa dalla catena dei Pirenei.' },
  atlantica: { nome: 'Regione atlantica', stati: ['FRA', 'BEL', 'NLD', 'LUX', 'MCO'], desc: 'Si affaccia sull’oceano Atlantico e sul mare del Nord: è una delle aree più popolate e sviluppate d’Europa.' },
  britannica: { nome: 'Regione britannica', stati: ['GBR', 'IRL'], desc: 'È formata dalle Isole britanniche: Gran Bretagna, Irlanda e tante isole minori.' },
  germanica: { nome: 'Regione germanica', stati: ['DEU', 'AUT', 'CHE', 'LIE'], desc: 'Nel cuore dell’Europa, dalle pianure del Nord fino alle Alpi; vi si parla soprattutto tedesco.' },
  nordica: { nome: 'Regione nordica', stati: ['DNK', 'NOR', 'SWE', 'FIN', 'ISL', 'EST', 'LVA', 'LTU'], desc: 'Comprende Scandinavia, Finlandia, Islanda e Paesi baltici: clima freddo, foreste, laghi e fiordi.' },
  balcanica: { nome: 'Regione balcanica', stati: ['SVN', 'HRV', 'BIH', 'SRB', 'KOS', 'MNE', 'MKD', 'ALB', 'BGR', 'GRC'], desc: 'Occupa la Penisola balcanica, montuosa e affacciata su Adriatico, Ionio, Egeo e mar Nero.' },
  'centro-orientale': { nome: 'Regione centro-orientale', stati: ['POL', 'CZE', 'SVK', 'HUN', 'ROU', 'UKR', 'MDA', 'BLR'], desc: 'Grandi pianure attraversate da Vistola, Danubio e Dnepr, tra i Carpazi e il mar Nero.' },
  russia: { nome: 'Russia europea', stati: ['RUS'], desc: 'La parte europea della Russia, dalla Pianura sarmatica fino agli Urali.' },
  italiana: { nome: 'Regione italiana', stati: ['ITA', 'SMR', 'VAT', 'MLT'], desc: 'Italia, San Marino, Città del Vaticano e Malta (studiati nel volume di prima).' },
}

/** Aree geografiche del mondo come nel libro di 3ª media (Stati assegnati per sotto-regione ONU, con eccezioni) */
export const MACROAREE_MONDO = {
  'africa-settentrionale': { nome: 'Africa settentrionale', subregioni: ['Northern Africa'], desc: 'Si affaccia sul Mediterraneo ed è occupata in gran parte dal deserto del Sahara; la popolazione è soprattutto araba e berbera.' },
  'africa-centrale': { nome: 'Africa centrale', subregioni: ['Western Africa', 'Middle Africa', 'Eastern Africa'], desc: 'Attraversata dall’Equatore: foreste pluviali, savane, grandi fiumi (Niger, Congo) e i grandi laghi della Rift Valley.' },
  'africa-meridionale': { nome: 'Africa meridionale', subregioni: ['Southern Africa'], stati: ['ZMB', 'ZWE', 'MOZ', 'MWI', 'MDG', 'AGO', 'COM'], desc: 'A sud dell’Equatore: altopiani, savane, i deserti del Kalahari e del Namib e grandi ricchezze minerarie.' },
  'medio-oriente': { nome: 'Medio Oriente', subregioni: ['Western Asia'], stati: ['IRN'], desc: 'Tra Mediterraneo, mar Rosso e golfo Persico: deserti, petrolio e luoghi sacri per ebrei, cristiani e musulmani.' },
  'asia-centrale': { nome: 'Asia centrale', subregioni: ['Central Asia'], stati: ['AFG'], desc: 'Regione lontana dai mari, con steppe, deserti e alte montagne; vi passava l’antica Via della Seta.' },
  'subcontinente-indiano': { nome: 'Subcontinente indiano', subregioni: ['Southern Asia'], desc: 'Separato dal resto dell’Asia dall’Himalaya; è una delle zone più popolate della Terra, con il clima dei monsoni.' },
  'estremo-oriente': { nome: 'Sudest asiatico ed Estremo Oriente', subregioni: ['Eastern Asia', 'South-Eastern Asia'], desc: 'Dalla Cina al Giappone fino alle isole dell’Indonesia: grandi pianure fluviali, risaie, metropoli e arcipelaghi.' },
  'america-anglosassone': { nome: 'America anglosassone', subregioni: ['Northern America'], desc: 'Canada e Stati Uniti, colonizzati soprattutto da inglesi (e francesi in Canada); vi si parla soprattutto inglese.' },
  'america-latina': { nome: 'America latina', subregioni: ['Central America', 'Caribbean', 'South America'], desc: 'Dal Messico alla Terra del Fuoco: colonizzata da spagnoli e portoghesi, vi si parlano soprattutto spagnolo e portoghese.' },
}

/** Stati del mondo studiati in 3ª media (oltre a quelli europei) */
export const DETTAGLI_MONDO = {
  HTI: { km2: 27750, governo: 'repubblica semipresidenziale', lingua: 'francese, creolo haitiano', moneta: 'gourde', curiosita: 'Occupa la parte occidentale dell’isola di Hispaniola; nel 1804 divenne la prima repubblica nata da una rivolta di schiavi.' },
  DOM: { km2: 48671, governo: 'repubblica presidenziale', lingua: 'spagnolo', moneta: 'peso dominicano', curiosita: 'Occupa i due terzi orientali dell’isola di Hispaniola; Santo Domingo è la più antica città fondata dagli europei nelle Americhe.' },
  MAR: { km2: 446550, governo: 'monarchia costituzionale', lingua: 'arabo, berbero', moneta: 'dirham marocchino', curiosita: 'È separato dalla Spagna solo dallo stretto di Gibilterra (14 km) ed è attraversato dalla catena dell’Atlante.' },
  EGY: { km2: 1001450, governo: 'repubblica presidenziale', lingua: 'arabo', moneta: 'sterlina egiziana', curiosita: 'Quasi tutti gli abitanti vivono lungo il Nilo e nel suo delta; a Giza si trovano le grandi piramidi.' },
  NGA: { km2: 923768, governo: 'repubblica federale presidenziale', lingua: 'inglese (ufficiale), hausa, yoruba, igbo', moneta: 'naira', curiosita: 'È lo Stato più popoloso dell’Africa; il fiume Niger forma un grande delta sul golfo di Guinea.' },
  KEN: { km2: 580367, governo: 'repubblica presidenziale', lingua: 'swahili, inglese', moneta: 'scellino keniota', curiosita: 'È attraversato dall’Equatore e dalla Rift Valley; è famoso per i parchi naturali e i safari.' },
  ZMB: { km2: 752612, governo: 'repubblica presidenziale', lingua: 'inglese', moneta: 'kwacha zambiano', curiosita: 'Sul fiume Zambesi, al confine con lo Zimbabwe, si trovano le spettacolari cascate Vittoria.' },
  ZAF: { km2: 1221037, governo: 'repubblica parlamentare', lingua: '12 lingue ufficiali, tra cui zulu, xhosa, afrikaans e inglese', moneta: 'rand', curiosita: 'Ha tre capitali (Pretoria, Città del Capo e Bloemfontein); qui Nelson Mandela guidò la lotta contro l’apartheid.' },
  TUR: { km2: 783562, governo: 'repubblica presidenziale', lingua: 'turco', moneta: 'lira turca', curiosita: 'Istanbul sorge su due continenti, divisi dallo stretto del Bosforo.' },
  ISR: { km2: 22072, governo: 'repubblica parlamentare', lingua: 'ebraico, arabo', moneta: 'nuovo shekel', curiosita: 'Gerusalemme è una città sacra per ebrei, cristiani e musulmani; il mar Morto è il punto più basso delle terre emerse.' },
  PSX: { km2: 6020, governo: 'Autorità Nazionale Palestinese', lingua: 'arabo', moneta: 'nuovo shekel israeliano, dinaro giordano', curiosita: 'Comprendono la Cisgiordania e la Striscia di Gaza.' },
  IRN: { km2: 1648195, governo: 'repubblica islamica', lingua: 'persiano (farsi)', moneta: 'rial iraniano', curiosita: 'È l’erede dell’antico Impero persiano ed è ricco di petrolio e gas naturale.' },
  IND: { km2: 3287263, governo: 'repubblica federale parlamentare', lingua: 'hindi, inglese e molte altre lingue', moneta: 'rupia indiana', curiosita: 'È lo Stato più popoloso del mondo; il Gange è il fiume sacro degli induisti.' },
  PAK: { km2: 881913, governo: 'repubblica federale parlamentare', lingua: 'urdu, inglese', moneta: 'rupia pakistana', curiosita: 'È attraversato dal fiume Indo; sul suo territorio si trova il K2, la seconda montagna della Terra.' },
  IDN: { km2: 1904569, governo: 'repubblica presidenziale', lingua: 'indonesiano', moneta: 'rupia indonesiana', curiosita: 'È lo Stato-arcipelago più grande del mondo, con oltre 17.000 isole.' },
  CHN: { km2: 9596961, governo: 'repubblica popolare (partito unico)', lingua: 'cinese mandarino', moneta: 'renminbi (yuan)', curiosita: 'È uno degli Stati più popolosi e più estesi del mondo; la Grande Muraglia è lunga migliaia di chilometri.' },
  JPN: { km2: 377975, governo: 'monarchia costituzionale', lingua: 'giapponese', moneta: 'yen', curiosita: 'È formato da quattro isole principali e migliaia di isole minori; terremoti e vulcani, come il Fuji, sono frequenti.' },
  CAN: { km2: 9984670, governo: 'monarchia costituzionale federale', lingua: 'inglese, francese', moneta: 'dollaro canadese', curiosita: 'È il secondo Stato più esteso del mondo e ha più laghi di qualunque altro Paese.' },
  USA: { km2: 9833520, governo: 'repubblica federale presidenziale', lingua: 'inglese', moneta: 'dollaro statunitense', curiosita: 'È formato da 50 Stati ed è la prima potenza economica del mondo.' },
  MEX: { km2: 1964375, governo: 'repubblica federale presidenziale', lingua: 'spagnolo', moneta: 'peso messicano', curiosita: 'Sul suo territorio fiorirono le civiltà dei Maya e degli Aztechi.' },
  CUB: { km2: 109884, governo: 'repubblica socialista (partito unico)', lingua: 'spagnolo', moneta: 'peso cubano', curiosita: 'È l’isola più grande dei Caraibi.' },
  BRA: { km2: 8515767, governo: 'repubblica federale presidenziale', lingua: 'portoghese', moneta: 'real', curiosita: 'È lo Stato più grande del Sud America e ospita gran parte della foresta amazzonica.' },
  PER: { km2: 1285216, governo: 'repubblica presidenziale', lingua: 'spagnolo, quechua, aymara', moneta: 'sol', curiosita: 'Sulle Ande si trova Machu Picchu, antica città degli Inca.' },
  ARG: { km2: 2780400, governo: 'repubblica federale presidenziale', lingua: 'spagnolo', moneta: 'peso argentino', curiosita: 'Vi si trova l’Aconcagua, la vetta più alta d’America; la Pampa è una grande pianura erbosa.' },
  AUS: { km2: 7692024, governo: 'monarchia costituzionale federale', lingua: 'inglese', moneta: 'dollaro australiano', curiosita: 'È l’unico Stato che occupa un intero continente; vi vivono animali unici come canguri e koala.' },
  NZL: { km2: 268021, governo: 'monarchia costituzionale', lingua: 'inglese, maori', moneta: 'dollaro neozelandese', curiosita: 'È formata da due isole principali, l’Isola del Nord e l’Isola del Sud, ricche di vulcani e ghiacciai.' },
}

/** Grandi Stati del mondo di cui si mostrano le suddivisioni interne (Stati federati, province…) */
export const SUDDIVISIONI_MONDO = {
  USA: 'Stato federato', CAN: 'provincia o territorio', MEX: 'Stato federato', BRA: 'Stato federato', ARG: 'provincia',
  IND: 'Stato o territorio', CHN: 'provincia o regione', AUS: 'Stato o territorio', ZAF: 'provincia', NGA: 'Stato federato',
}
