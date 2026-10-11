# GeoPercorsi 🧭

Webapp per lezioni di geografia interattive nella scuola secondaria di primo grado, ispirata a Genially:
**1ª media → Italia**, **2ª media → Europa**, **3ª media → Continenti**.

## Avvio

**Il modo più semplice:** doppio clic su `Avvia-GeoPercorsi.bat`. La prima volta installa Node.js se manca (con winget, oppure apre la pagina di download), poi le librerie, e apre l’app nel browser.
**Manuale per i docenti:** `Manuale-GeoPercorsi.html` (si apre con un doppio clic e si stampa in PDF), oppure il pulsante **📘 Guida** nell’app. Il testo si modifica in `public/manuale.html`, poi si ricopia nella cartella principale.

Per passare l’app a un collega basta copiargli la cartella del progetto, anche senza `node_modules`.
Per chiudere l’app chiudi la finestra nera.

Da terminale:

```bash
npm install
npm run dev        # apre l'app su http://localhost:5173
```

> Nota: la cartella del progetto contiene `&` (`M&E`), che rompe i comandi `npx` e i collegamenti in `node_modules/.bin` su Windows.
> Per questo gli script in `package.json` richiamano direttamente `node node_modules/...`. Usa sempre `npm run …`.

Altri comandi:

| Comando | A cosa serve |
|---|---|
| `npm run build` | versione pubblicabile in `dist/` (es. su GitHub Pages) |
| `npm run build:player` | ricostruisce il player usato per il “file per gli alunni” (lo fa già `dev`) |
| `npm test` | test della correzione delle attività e dei pacchetti |
| `npm run geo` | rigenera le carte in `public/geo/` (scarica i dati in `scripts/.cache`, i fiumi italiani da OpenStreetMap) |

## Cosa si può fare

- **Atlante**: carte di Italia, Europa e Mondo, ognuna **politica** e **fisica**, con livelli da accendere/spegnere
  (regioni, province, capoluoghi, Stati, capitali, continenti, montagne, vette, vulcani, pianure, altopiani, deserti,
  fiumi, laghi, mari, isole, penisole, golfi e stretti, fasce climatiche, paralleli). Ogni elemento ha una scheda in italiano.
- **Zoom su una regione o uno Stato** (atlante, mappe e giochi): province e capoluoghi di provincia per l’Italia, regioni interne
  (Länder, cantoni, comunità autonome…) e città principali per l’Europa, con fiumi, laghi e vette di quella zona.
  Schede di dettaglio: per le regioni capoluogo, province, comuni, densità, confini, mari, rilievi, fiumi, laghi, prodotti tipici, curiosità;
  per gli Stati superficie, governo, ingresso nell’UE, confini, mari, fiumi, rilievi, vetta più alta, suddivisioni, curiosità.
- **Strumenti del geografo**: reticolato con i gradi, coordinate del punto sotto il cursore, rosa dei venti, scala grafica,
  fusi orari teorici, meridiano di Greenwich e linea del cambiamento di data.
- **Regioni d’Europa del libro di 2ª** (iberica, atlantica, britannica, germanica, nordica, balcanica, centro-orientale, Russia)
  e **aree geografiche del mondo del libro di 3ª** (Africa settentrionale/centrale/meridionale, Medio Oriente, Subcontinente indiano,
  Sudest asiatico ed Estremo Oriente, America anglosassone e latina), con zoom e schede degli Stati studiati.
- **44 percorsi d’esempio** creati al primo avvio: 22 come i capitoli dei libri (7 per la 1ª, 9 per la 2ª, 6 per la 3ª), 3 approfondimenti
  (terremoti e vulcani, clima e biomi con climogrammi, Unione europea) e 19 serie di **carte mute** (Italia per regione, Europa per Stato, mondo per area).
  Chi ha già l’app li riceve una sola volta, in fondo all’elenco.
- **Ricerca dei percorsi** nella pagina iniziale: titolo, descrizione e titoli delle tappe, senza badare a maiuscole e accenti (tasto / per scrivere subito, Esc per svuotare).
- **Percorsi** fatti di **tappe** (16:9) con: testi, immagini, video (file o YouTube), audio, PDF sfogliabili,
  punti informativi, pulsanti (anche per percorsi a bivi), mappe con colori e contenuti agganciati alle aree.
- **Attività**: quiz, vero/falso, abbinamenti, completa il testo, metti in ordine, flashcard,
  **trova sulla mappa**, **etichette sulla mappa** (carte mute), **clicca le coordinate** e **leggi il grafico**
  (istogramma, barre, torta, climogramma o tabella con domande, come nelle prove INVALSI).
- **✨ Genera dalla mappa**: crea in un clic quiz su capitali e capoluoghi di provincia, bandiere, record (più alto/lungo/grande),
  “che cos’è?”, “dove si trova?”, “chi confina con chi?”, coordinate, punti cardinali, distanze, fusi orari,
  giochi di localizzazione ed etichette, grafici (altezze, lunghezze, superfici, abitanti) e carte mute. Con “Solo in” si generano
  giochi su una singola regione o un singolo Stato (es. “Trova le province della Lombardia”, “Le regioni della Francia”).
- **Presenta** (LIM): schermo intero, frecce/telecomando, timer.
- **Alunno**: nome, punteggio, riepilogo finale stampabile. Su telefono le tappe si impilano in verticale.
- **Condivisione senza server**:
  - *File per gli alunni*: un unico `.html` con tutto dentro (anche le carte), si apre offline; aggiungendo `?lim` all'indirizzo si apre in modalità presentazione.
  - *Pacchetto `.geopercorso`*: copia modificabile da reimportare o scambiare con i colleghi.

I percorsi restano nel browser (IndexedDB): esporta i pacchetti come copia di sicurezza.

## Struttura

```
scripts/      build-geo.mjs (genera le carte), curated*.mjs (dati in italiano curati a mano),
              dettaglio.mjs (in quale regione/Stato sta ogni elemento, confini), scarica-fiumi-osm.mjs
public/geo/   carte TopoJSON {italia,europa,mondo}/{politica,fisica}.json
public/flags/ bandiere SVG · public/pdfjs/ risorse di pdf.js
src/geo/      MapView (carta interattiva), livelli, proiezioni, stili
src/attivita/ attività, correzione (con test), generatori dalle carte
src/editor/   editor dei percorsi
src/player/   presentazione e modalità alunno
src/export/   pacchetti .geopercorso e file HTML autonomo
```

Dati cartografici: [Natural Earth](https://www.naturalearthdata.com/) (pubblico dominio),
confini ISTAT di regioni, province e comuni via [openpolis/geojson-italy](https://github.com/openpolis/geojson-italy) (CC BY 4.0),
fiumi italiani © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL),
bandiere [flag-icons](https://github.com/lipis/flag-icons) (MIT). Misure arrotondate a uso scolastico.
