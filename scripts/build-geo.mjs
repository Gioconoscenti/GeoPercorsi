// Genera public/geo/{italia,europa,mondo}/{politica,fisica}.json (TopoJSON)
// a partire da Natural Earth + ISTAT/openpolis (scaricati in scripts/.cache) e dai dati curati.
// Uso: npm run geo
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mapshaper from 'mapshaper'
import * as C from './curated.mjs'
import * as D from './curated-dettaglio.mjs'
import { appartenenza, contenitori, lunghezzaKm, vicini } from './dettaglio.mjs'
import { geoArea, geoCentroid } from 'd3-geo'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const CACHE = path.join(DIR, '.cache')
const OUT = path.join(DIR, '..', 'public', 'geo')
const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/'
const SOURCES = {
  ne_10m_admin_0_countries: NE, ne_50m_admin_0_countries: NE, ne_10m_rivers_lake_centerlines: NE,
  ne_10m_rivers_europe: NE, ne_10m_lakes: NE, ne_10m_lakes_europe: NE, ne_10m_geography_regions_polys: NE,
  ne_10m_geography_marine_polys: NE, ne_10m_land: NE, ne_50m_land: NE, ne_10m_populated_places: NE,
  ne_10m_geography_regions_elevation_points: NE, ne_10m_admin_1_states_provinces: NE,
  it_regions: 'https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_regions.geojson#',
  it_provinces: 'https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_provinces.geojson#',
}

async function load(name) {
  const file = path.join(CACHE, name + '.geojson')
  if (!fs.existsSync(file)) {
    fs.mkdirSync(CACHE, { recursive: true })
    const src = SOURCES[name]
    const url = src.endsWith('#') ? src.slice(0, -1) : src + name + '.geojson'
    console.log('scarico', url)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Download fallito ${url}`)
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  }
  return JSON.parse(fs.readFileSync(file, 'utf8')).features
}

const fmt = (n) => Math.round(n).toLocaleString('it-IT')
const fc = (features) => ({ type: 'FeatureCollection', features })
const feat = (geometry, properties) => ({ type: 'Feature', geometry, properties })
const pt = (coord, properties) => feat({ type: 'Point', coordinates: coord }, properties)
const poly = (ring, properties) => feat({ type: 'Polygon', coordinates: [ring] }, properties)

function bbox(g) {
  const b = [180, 90, -180, -90]
  const walk = (c) => {
    if (typeof c[0] === 'number') {
      b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1])
    } else c.forEach(walk)
  }
  walk(g.coordinates)
  return b
}
const intersects = (g, box) => {
  const b = bbox(g)
  return b[2] > box[0] && b[0] < box[2] && b[3] > box[1] && b[1] < box[3]
}

/** Unisce feature (linee) con lo stesso id in un'unica MultiLineString */
function mergeLines(features) {
  const map = new Map()
  for (const f of features) {
    const id = f.properties.id
    const lines = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates
    if (!map.has(id)) map.set(id, feat({ type: 'MultiLineString', coordinates: [] }, f.properties))
    map.get(id).geometry.coordinates.push(...lines)
  }
  return [...map.values()]
}

/** Esegue mapshaper e restituisce il TopoJSON */
async function topo(layers, { clip, simplify = '10%', extra = '' }) {
  const inputs = {}
  const names = []
  for (const [name, features] of Object.entries(layers)) {
    if (!features.length) continue
    inputs[name + '.json'] = fc(features)
    names.push(name + '.json')
  }
  const clipCmd = clip ? `-clip bbox=${clip.join(',')} target=* remove-slivers` : ''
  const cmd = `-i ${names.join(' ')} combine-files ${clipCmd} -simplify ${simplify} keep-shapes stats target=* ${extra} -o out.json format=topojson quantization=60000 precision=0.0001`
  const out = await mapshaper.applyCommands(cmd, inputs)
  return out['out.json']
}

function write(area, tipo, content) {
  const dir = path.join(OUT, area)
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, tipo + '.json')
  fs.writeFileSync(file, content)
  console.log(`✓ ${area}/${tipo}.json  ${(fs.statSync(file).size / 1024).toFixed(0)} KB`)
}

// ---------- caricamento sorgenti ----------
const [countries10, countries50, riversWorld, riversEu, lakes10, lakesEu, regionsPolys, marine, land10, land50, places, itRegions, itProv, elevPoints] =
  await Promise.all(['ne_10m_admin_0_countries', 'ne_50m_admin_0_countries', 'ne_10m_rivers_lake_centerlines', 'ne_10m_rivers_europe',
    'ne_10m_lakes', 'ne_10m_lakes_europe', 'ne_10m_geography_regions_polys', 'ne_10m_geography_marine_polys', 'ne_10m_land', 'ne_50m_land',
    'ne_10m_populated_places', 'it_regions', 'it_provinces', 'ne_10m_geography_regions_elevation_points'].map(load))

const BOX = {
  italia: [-14, 27, 40, 56],
  europa: [-50, 22, 100, 84],
}

// ---------- livelli fisici comuni ----------
function fiumi(area, box) {
  const list = C.FIUMI.filter((r) => r.aree.includes(area))
  const byName = new Map()
  list.forEach((r) => r.ne.forEach((n) => byName.set(n, r)))
  const src = area === 'italia' ? [...riversEu, ...riversWorld] : riversWorld.concat(area === 'europa' ? riversEu : [])
  const out = []
  for (const f of src) {
    const p = f.properties
    if (!f.geometry || (p.featurecla && !/River/i.test(p.featurecla))) continue
    const r = byName.get(p.name) ?? byName.get(p.name_en)
    if (!r) continue
    // il Reno italiano esiste solo nel livello europeo con lo stesso nome del fiume emiliano
    if (r.id === 'reno-it' && !intersects(f.geometry, BOX.italia)) continue
    if (box && !intersects(f.geometry, box)) continue
    out.push(feat(f.geometry, {
      id: 'fiume-' + r.id, nome: r.nome, livello: 'fiumi', tipo: 'fiume', val: r.km,
      i_Lunghezza: fmt(r.km) + ' km', i_Sfocia_in: r.foce, desc: r.note,
    }))
  }
  // evita duplicati di tratti (rivers_europe e globale): tiene il primo sorgente per id
  const seen = new Map()
  for (const f of out) {
    const key = f.properties.id + JSON.stringify(f.geometry.coordinates[0]?.slice?.(0, 1))
    if (!seen.has(key)) seen.set(key, f)
  }
  return mergeLines([...seen.values()])
}

function laghi(area) {
  const list = C.LAGHI.filter((l) => l.aree.includes(area))
  const out = []
  for (const l of list) {
    const props = { id: 'lago-' + l.id, nome: l.nome, livello: 'laghi', tipo: 'lago', val: l.km2, i_Superficie: fmt(l.km2) + ' km²', desc: l.note }
    if (l.poligono) { out.push(poly(l.poligono, props)); continue }
    const parts = [...lakesEu, ...lakes10].filter((f) => l.ne.includes(f.properties.name) && f.geometry)
    if (!parts.length) { console.warn('  lago non trovato:', l.nome); continue }
    // tiene solo la geometria più dettagliata (prima occorrenza)
    out.push(feat(parts[0].geometry, props))
  }
  return out
}

function vette(area) {
  return C.VETTE.filter((v) => v.aree.includes(area)).map((v) =>
    pt(v.coord, {
      id: (v.tipo === 'vulcano' ? 'vulcano-' : 'vetta-') + v.id, nome: v.nome, livello: v.tipo === 'vulcano' ? 'vulcani' : 'vette',
      tipo: v.tipo, val: v.m, i_Altezza: fmt(v.m) + ' m', i_Dove: v.dove, desc: v.note,
    }))
}

const CLASSI = {
  'Range/mtn': ['rilievi', 'catena montuosa'], Foothills: ['rilievi', 'colline'],
  Plain: ['pianure', 'pianura'], Lowland: ['pianure', 'bassopiano'], Basin: ['pianure', 'bacino'], Delta: ['pianure', 'delta'], Wetlands: ['pianure', 'zona umida'], Tundra: ['pianure', 'tundra'],
  Plateau: ['altopiani', 'altopiano'],
  Desert: ['deserti', 'deserto'],
  Island: ['isole', 'isola'], 'Island group': ['isole', 'arcipelago'],
  Peninsula: ['penisole', 'penisola'], 'Pen/cape': ['penisole', 'penisola'],
}

function aree(filter) {
  const out = []
  for (const f of regionsPolys) {
    const p = f.properties
    const cls = CLASSI[p.FEATURECLA]
    if (!cls || !f.geometry || !filter(p, f)) continue
    const nome = C.RINOMINA[p.NAME] ?? p.NAME_IT ?? p.NAME
    const id = 'area-' + String(p.NE_ID)
    out.push(feat(f.geometry, { id, nome: nome.charAt(0).toUpperCase() + nome.slice(1), livello: cls[0], tipo: cls[1], desc: C.NOTE_AREE[p.NAME] ?? '' }))
  }
  return out
}

function mari(filter) {
  return marine.filter((f) => f.geometry && f.properties.name && filter(f.properties, f)).map((f) => {
    const p = f.properties
    const tipo = { ocean: 'oceano', sea: 'mare', bay: 'baia', gulf: 'golfo', channel: 'canale', strait: 'stretto', sound: 'stretto', lagoon: 'laguna', fjord: 'fiordo', inlet: 'insenatura' }[p.featurecla?.toLowerCase()] ?? 'mare'
    const nome = (p.name_it || p.name)
    return feat(f.geometry, { id: 'mare-' + p.ne_id, nome: nome.charAt(0).toUpperCase() + nome.slice(1), livello: 'mari', tipo })
  })
}

const terra = (src, box) => src.filter((f) => !box || intersects(f.geometry, box)).map((f) => feat(f.geometry, { livello: 'terra' }))

// ======================= ITALIA =======================
const nomeRegione = (cod) => C.REGIONI[cod].nome
const elencoNomi = (ids, nomi) => ids.map((id) => nomi.get(id)).filter(Boolean).join(', ')

/** Aggiunge a ogni feature l'elenco delle aree (regioni/Stati) in cui si trova */
function assegna(features, conts, nomi, etichetta) {
  for (const f of features) {
    const ids = appartenenza(f, conts)
    if (!ids.length) continue
    f.properties.in = ids.join(',')
    f.properties['i_' + etichetta] = elencoNomi(ids, nomi)
  }
  return features
}

/** Comuni ISTAT (per i conteggi e la posizione dei capoluoghi di provincia) */
async function caricaComuni() {
  const tutti = []
  for (let r = 1; r <= 20; r++) {
    const file = path.join(CACHE, `it_comuni_${r}.geojson`)
    if (!fs.existsSync(file)) {
      const url = `https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_R_${r}_municipalities.geojson`
      console.log('scarico', url)
      const res = await fetch(url)
      if (!res.ok) throw new Error('Download fallito ' + url)
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
    }
    tutti.push(...JSON.parse(fs.readFileSync(file, 'utf8')).features)
  }
  return tutti
}

function fiumiItaliaOsm() {
  const file = path.join(CACHE, 'it_fiumi_osm.json')
  if (!fs.existsSync(file)) {
    console.warn('  ⚠ fiumi OSM non scaricati: esegui "node scripts/scarica-fiumi-osm.mjs" (uso Natural Earth)')
    return null
  }
  const geo = JSON.parse(fs.readFileSync(file, 'utf8')).features
  return D.FIUMI_ITALIA.map((r) => {
    const g = geo.find((x) => x.properties.id === r.id)
    if (!g) return null
    return feat(g.geometry, { id: 'fiume-' + r.id, nome: r.nome, livello: 'fiumi', tipo: 'fiume', val: r.km, i_Lunghezza: '≈ ' + fmt(r.km) + ' km', i_Sfocia_in: r.foce, desc: r.note })
  }).filter(Boolean)
}

async function italia() {
  const box = BOX.italia
  const comuni = await caricaComuni()
  const nomiRegioni = new Map(Object.entries(C.REGIONI).map(([cod, r]) => ['regione-' + cod, r.nome]))
  const contRegioni = await contenitori(itRegions, (f) => 'regione-' + f.properties.reg_istat_code_num)

  // ---------- fisica (prima, così le regioni sanno quali fiumi e monti contengono) ----------
  const pianure = C.PIANURE_ITALIA.map((p) => poly(p.poligono, { id: 'pianura-' + p.id, nome: p.nome, livello: 'pianure', tipo: 'pianura', val: p.km2, i_Superficie: '≈ ' + fmt(p.km2) + ' km²', desc: p.note }))
  const rilievi = aree((p, f) => p.FEATURECLA === 'Range/mtn' && intersects(f.geometry, [6, 37.5, 18.5, 47]) && ['ALPS', 'APPENNINI', 'Calabria', 'Jura', 'Dinaric Alps'].includes(p.NAME))
  const isole = aree((p) => ['Sicilia', 'Sardegna', 'Corse', 'Malta'].includes(p.NAME) && p.FEATURECLA === 'Island').map((f) => {
    const extra = { Sicilia: [25832, 'La più grande isola del Mediterraneo.'], Sardegna: [24100, 'Seconda isola del Mediterraneo per superficie.'], Corsica: [8680, 'Isola francese a nord della Sardegna.'], Malta: [316, 'Isola principale dello Stato di Malta.'] }[f.properties.nome]
    if (extra) Object.assign(f.properties, { val: extra[0], i_Superficie: fmt(extra[0]) + ' km²', desc: extra[1] })
    return f
  })
  const isoleMinori = C.ISOLE_ITALIA.map((i) => pt(i.coord, { id: 'isola-' + i.id, nome: i.nome, livello: 'isole', tipo: i.km2 ? 'isola' : 'arcipelago', ...(i.km2 ? { val: i.km2, i_Superficie: fmt(i.km2) + ' km²' } : {}), desc: i.note }))
  const coste = C.COSTE_ITALIA.map((c) => pt(c.coord, { id: 'costa-' + c.id, nome: c.nome, livello: 'coste', tipo: c.tipo, desc: c.note }))
  const fiumiIt = fiumiItaliaOsm() ?? fiumi('italia', box)
  const laghiIt = [
    ...laghi('italia'),
    ...D.LAGHI_ITALIA_PUNTI.map((l) => pt(l.coord, { id: 'lago-' + l.id, nome: l.nome, livello: 'laghi', tipo: 'lago', val: l.km2, i_Superficie: fmt(l.km2) + ' km²', desc: l.note })),
  ]
  const tutteVette = [
    ...vette('italia'),
    ...D.VETTE_ITALIA_EXTRA.map((v) => pt(v.coord, { id: 'vetta-' + v.id, nome: v.nome, livello: 'vette', tipo: 'vetta', val: v.m, i_Altezza: fmt(v.m) + ' m', i_Dove: v.dove, desc: v.note })),
  ]
  const fisici = [...pianure, ...rilievi, ...isole, ...isoleMinori, ...coste, ...fiumiIt, ...laghiIt, ...tutteVette]
  assegna(fisici, contRegioni, nomiRegioni, 'Regioni')
  const confini = itRegions.map((f) => feat(f.geometry, { livello: 'confini', ref: 'regione-' + f.properties.reg_istat_code_num }))
  const mariIt = mari((p, f) => intersects(f.geometry, box) && !/ocean/i.test(p.featurecla))

  write('italia', 'fisica', await topo({
    mari: mariIt, terra: terra(land10, box), confini, pianure, rilievi, isole, laghi: laghiIt, fiumi: fiumiIt,
    isole_p: isoleMinori, coste, vette: tutteVette.filter((v) => v.properties.livello === 'vette'), vulcani: tutteVette.filter((v) => v.properties.livello === 'vulcani'),
  }, { clip: box, simplify: '8%' }))

  // ---------- politica ----------
  const comuniPerProv = new Map()
  const comuniPerReg = new Map()
  for (const c of comuni) {
    const p = c.properties
    comuniPerProv.set(p.prov_acr, (comuniPerProv.get(p.prov_acr) ?? 0) + 1)
    comuniPerReg.set(p.reg_istat_code_num, (comuniPerReg.get(p.reg_istat_code_num) ?? 0) + 1)
  }
  const provPerReg = new Map()
  itProv.forEach((f) => provPerReg.set(f.properties.reg_istat_code_num, (provPerReg.get(f.properties.reg_istat_code_num) ?? 0) + 1))

  // elementi fisici principali per regione
  const principali = (lista, id, n, ordina = true) => {
    const x = lista.filter((f) => f.properties.in?.split(',').includes(id))
    if (ordina) x.sort((a, b) => (b.properties.val ?? 0) - (a.properties.val ?? 0))
    return x.slice(0, n).map((f) => f.properties.nome).join(', ')
  }

  const regioni = itRegions.map((f) => {
    const cod = f.properties.reg_istat_code_num
    const r = C.REGIONI[cod]
    const d = D.DETTAGLI_REGIONI[cod]
    const id = 'regione-' + cod
    return feat(f.geometry, {
      id, nome: r.nome, livello: 'regioni', tipo: 'regione', cap: r.capoluogo, val: r.superficie,
      i_Capoluogo: r.capoluogo, i_Superficie: fmt(r.superficie) + ' km²', i_Abitanti: '≈ ' + fmt(r.popolazione),
      i_Densità: '≈ ' + fmt(r.popolazione / r.superficie) + ' ab./km²', i_Statuto: r.statuto,
      i_Province: String(provPerReg.get(cod) ?? ''), i_Comuni: fmt(comuniPerReg.get(cod) ?? 0),
      i_Mari: d.mari, i_Rilievi: d.rilievi, i_Fiumi_principali: principali(fiumiIt, id, 4) || '—',
      i_Laghi: principali(laghiIt, id, 3) || '—', i_Prodotti_tipici: d.prodotti, desc: d.curiosita,
    })
  })

  const province = itProv.map((f) => {
    const p = f.properties
    const cap = D.CAPOLUOGHI_SPECIALI[p.prov_acr] ?? p.prov_name
    return feat(f.geometry, {
      id: 'provincia-' + p.prov_acr, nome: p.prov_name, livello: 'province', tipo: 'provincia', cap: cap.replace(/'/g, '’'), in: 'regione-' + p.reg_istat_code_num,
      i_Sigla: p.prov_acr, i_Capoluogo: cap.replace(/'/g, '’'), i_Comuni: fmt(comuniPerProv.get(p.prov_acr) ?? 0), i_Regione: nomeRegione(p.reg_istat_code_num),
    })
  })

  // capoluoghi di provincia: posizione = centro del territorio comunale
  const capRegionali = new Set(Object.values(C.REGIONI).map((r) => r.capoluogo))
  const capoluoghiProv = itProv.map((f) => {
    const p = f.properties
    const nomeCap = D.CAPOLUOGHI_SPECIALI[p.prov_acr] ?? p.prov_name
    const com = comuni.find((c) => c.properties.prov_acr === p.prov_acr && (c.properties.name === nomeCap || c.properties.name.split('/')[0] === nomeCap))
    if (!com) { console.warn('  capoluogo non trovato:', nomeCap); return null }
    const nomeBello = nomeCap === 'Reggio nell\'Emilia' ? 'Reggio Emilia' : nomeCap === 'Reggio di Calabria' ? 'Reggio Calabria' : nomeCap
    return pt(geoCentroid(com), {
      id: 'capoluogo-' + p.prov_acr, nome: nomeBello.replace(/'/g, '’'), livello: 'capoluoghi', tipo: 'capoluogo di provincia', in: 'regione-' + p.reg_istat_code_num,
      ...(capRegionali.has(nomeBello) || capRegionali.has(nomeCap) ? { dup: 1 } : {}),
      i_Provincia: p.prov_name + ' (' + p.prov_acr + ')', i_Regione: nomeRegione(p.reg_istat_code_num),
    })
  }).filter(Boolean)

  const capoluoghi = Object.entries(C.REGIONI).map(([cod, r]) => pt(r.coord, { id: 'citta-' + r.capoluogo.toLowerCase().replace(/\W+/g, '-'), nome: r.capoluogo, livello: 'citta', tipo: 'capoluogo di regione', in: 'regione-' + cod, i_Regione: r.nome }))
  capoluoghi.push(...['VAT', 'SMR'].map((c) => {
    const s = C.STATI_EUROPA[c]
    const pl = places.find((p) => p.properties.ADM0_A3 === c && p.properties.ADM0CAP === 1)
    return pt([pl.properties.LONGITUDE, pl.properties.LATITUDE], { id: 'citta-' + c.toLowerCase(), nome: s.capitale, livello: 'citta', tipo: 'capitale (Stato indipendente)' })
  }))
  const contesto = countries10.filter((f) => f.properties.ADM0_A3 !== 'ITA' && intersects(f.geometry, box))
    .map((f) => feat(f.geometry, { livello: 'contesto', nome: C.STATI_EUROPA[f.properties.ADM0_A3]?.nome ?? f.properties.NAME_IT }))

  const t = JSON.parse(await topo({ mari: mariIt, contesto, regioni, province, citta: capoluoghi, capoluoghi: capoluoghiProv }, { clip: box, simplify: '6%' }))
  // confini tra regioni (e con gli Stati vicini)
  for (const [, v] of vicini(t, ['regioni', 'contesto'], 'regioni')) {
    v.g.properties.i_Confina_con = v.nomi.join(', ') || 'nessuna regione (isola)'
    v.g.properties.vicini = v.ids.join(',')
  }
  write('italia', 'politica', JSON.stringify(t))
}

// ======================= EUROPA =======================
function capitaleCoord(a3, nome) {
  const cands = places.filter((p) => p.properties.ADM0_A3 === a3)
  const pl = cands.find((p) => [p.properties.NAME_IT, p.properties.NAME].includes(nome)) ?? cands.find((p) => p.properties.ADM0CAP === 1)
  return pl ? [pl.properties.LONGITUDE, pl.properties.LATITUDE] : null
}

/** Suddivisioni interne degli Stati europei (regioni, Länder, cantoni…) */
async function suddivisioni(box) {
  const admin1 = await load('ne_10m_admin_1_states_provinces')
  const gruppi = new Map()
  for (const f of admin1) {
    const p = f.properties
    const a3 = p.adm0_a3
    if (!C.STATI_EUROPA[a3] || a3 === 'ITA' || D.SENZA_SUDDIVISIONI.has(a3) || !f.geometry || !intersects(f.geometry, box)) continue
    // la Francia d'oltremare e le Canarie restano fuori dalla carta d'Europa
    if (a3 === 'FRA' && !intersects(f.geometry, [-6, 41, 10, 52])) continue
    const campo = D.RAGGRUPPA_SUDDIVISIONI[a3]
    const chiave = campo ? p[campo] : p.adm1_code
    if (!chiave) continue
    const k = a3 + '|' + chiave
    if (!gruppi.has(k)) {
      const nome = campo ? (D.NOMI_SUDDIVISIONI[chiave] ?? chiave) : (p.name_it || p.name)
      gruppi.set(k, { a3, nome, parti: [] })
    }
    gruppi.get(k).parti.push(f)
  }
  const input = []
  let i = 0
  for (const g of gruppi.values()) {
    i++
    for (const f of g.parti) input.push(feat(f.geometry, { k: String(i), a3: g.a3, nome: g.nome }))
  }
  // per l'Italia si usano le regioni ISTAT
  for (const f of itRegions) { i++; input.push(feat(f.geometry, { k: String(i), a3: 'ITA', nome: C.REGIONI[f.properties.reg_istat_code_num].nome })) }
  const diss = JSON.parse((await mapshaper.applyCommands('-i in.json -dissolve k copy-fields=a3,nome -o out.json format=geojson', { 'in.json': fc(input) }))['out.json'])
  return diss.features.filter((f) => f.geometry).map((f) => {
    const a3 = f.properties.a3
    const nome = String(f.properties.nome).replace(/^(\p{Ll})/u, (c) => c.toUpperCase())
    return feat(f.geometry, {
      id: 'sudd-' + a3 + '-' + f.properties.k, nome, livello: 'suddivisioni', tipo: D.TIPO_SUDDIVISIONE[a3] ?? 'regione', in: 'stato-' + a3,
      i_Stato: C.STATI_EUROPA[a3].nome,
    })
  })
}

/** Fiumi europei: quelli curati + tutti quelli con nome di Natural Earth abbastanza lunghi */
function fiumiEuropa(box) {
  const curati = fiumi('europa', box)
  const giaVisti = new Set(C.FIUMI.flatMap((r) => r.ne))
  const gruppi = new Map()
  for (const f of [...riversEu, ...riversWorld]) {
    const p = f.properties
    if (!f.geometry || !p.name || giaVisti.has(p.name) || (p.featurecla && !/River/i.test(p.featurecla)) || !intersects(f.geometry, box)) continue
    const nome = p.name_it || p.name
    if (!gruppi.has(nome)) gruppi.set(nome, [])
    gruppi.get(nome).push(f)
  }
  const altri = []
  for (const [nome, parti] of gruppi) {
    const linea = feat({ type: 'MultiLineString', coordinates: parti.flatMap((f) => (f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates)) }, {})
    const km = lunghezzaKm(linea)
    if (km < 180) continue
    linea.properties = { id: 'fiume-ne-' + nome.toLowerCase().replace(/[^a-z0-9]+/g, '-'), nome, livello: 'fiumi', tipo: 'fiume', minore: 1, val: Math.round(km / 10) * 10, i_Lunghezza: '≈ ' + fmt(Math.round(km / 10) * 10) + ' km (in Europa)' }
    altri.push(linea)
  }
  return [...curati, ...altri]
}

function laghiEuropa(box) {
  const curati = laghi('europa')
  const giaVisti = new Set(C.LAGHI.flatMap((l) => l.ne ?? []))
  const visti = new Set()
  const altri = []
  for (const f of [...lakesEu, ...lakes10]) {
    const p = f.properties
    if (!f.geometry || !p.name || giaVisti.has(p.name) || visti.has(p.name) || !intersects(f.geometry, box) || !/Lake/i.test(p.featurecla ?? 'Lake')) continue
    const km2 = geoArea(f) * 6371 * 6371
    if (km2 < 150 || km2 > 400000) continue
    visti.add(p.name)
    const nome = p.name_it ? 'Lago ' + p.name_it.replace(/^(lago|lake)\s+/i, '') : p.name
    altri.push(feat(f.geometry, { id: 'lago-ne-' + p.ne_id, nome, livello: 'laghi', tipo: 'lago', minore: 1, val: Math.round(km2), i_Superficie: '≈ ' + fmt(km2) + ' km²' }))
  }
  return [...curati, ...altri]
}

function vetteEuropa(box) {
  const curate = vette('europa')
  const nomiCurati = new Set(C.VETTE.map((v) => v.nome.toLowerCase()))
  const altre = elevPoints.filter((f) => {
    const p = f.properties
    return p.elevation > 300 && (p.name_it || p.name) && intersects(f.geometry, box) && ['Europe'].includes(p.region) && !nomiCurati.has((p.name_it || p.name).toLowerCase())
  }).map((f) => {
    const p = f.properties
    const nome = p.name_it || p.name
    return pt(f.geometry.coordinates, { id: 'vetta-ne-' + p.ne_id, nome: nome.charAt(0).toUpperCase() + nome.slice(1), livello: 'vette', tipo: 'vetta', minore: 1, val: p.elevation, i_Altezza: fmt(p.elevation) + ' m' })
  })
  return [...curate, ...altre]
}

/** Unisce le geometrie che hanno la stessa chiave (es. gli Stati di una macro-regione) */
async function dissolvi(features, chiave) {
  const input = fc(features.filter((f) => chiave(f)).map((f) => feat(f.geometry, { k: chiave(f) })))
  const out = JSON.parse((await mapshaper.applyCommands('-i in.json -dissolve k -o out.json format=geojson', { 'in.json': input }))['out.json'])
  return new Map(out.features.filter((x) => x.geometry).map((x) => [x.properties.k, x.geometry]))
}

/** Aggiunge a "in" anche i gruppi (macro-regioni, continenti…) degli Stati già presenti */
function aggiungiGruppi(features, gruppiDi) {
  for (const f of features) {
    if (!f.properties.in) continue
    const ids = f.properties.in.split(',')
    f.properties.in = [...new Set([...ids, ...ids.flatMap((id) => gruppiDi.get(id) ?? [])])].join(',')
  }
  return features
}

/** Regioni d'Europa del libro: Stato (ADM0_A3) → id della macro-regione */
const MACRO_DI = new Map(Object.entries(D.MACROREGIONI_EUROPA).flatMap(([k, m]) => m.stati.map((a3) => [a3, 'macro-' + k])))

async function europa() {
  const box = BOX.europa
  const stati = []
  const contesto = []
  const capitali = []
  for (const f of countries10) {
    if (!intersects(f.geometry, box)) continue
    const a3 = f.properties.ADM0_A3
    const s = C.STATI_EUROPA[a3]
    if (!s) { contesto.push(feat(f.geometry, { livello: 'contesto', nome: f.properties.NAME_IT })); continue }
    const d = D.DETTAGLI_STATI[a3] ?? {}
    stati.push(feat(f.geometry, {
      id: 'stato-' + a3, nome: s.nome, livello: 'stati', tipo: 'Stato', cap: s.capitale, flag: f.properties.ISO_A2_EH?.toLowerCase(),
      val: f.properties.POP_EST, i_Capitale: s.capitale, i_Superficie: d.km2 ? fmt(d.km2) + ' km²' : undefined,
      i_Abitanti: '≈ ' + fmt(f.properties.POP_EST), i_Lingua: s.lingua, i_Moneta: s.moneta, i_Governo: d.governo,
      i_Unione_europea: s.ue ? `sì${d.ue ? ' (dal ' + d.ue + ')' : ''}` : 'no', i_Mari: D.MARI_STATI[a3],
      desc: [d.curiosita, s.nota].filter(Boolean).join(' '),
      ...(MACRO_DI.has(a3) ? { in: MACRO_DI.get(a3), i_Regione_europea: D.MACROREGIONI_EUROPA[MACRO_DI.get(a3).slice(6)].nome } : {}),
    }))
    const c = capitaleCoord(a3, s.capitale)
    if (c) capitali.push(pt(c, { id: 'capitale-' + a3, nome: s.capitale, livello: 'citta', tipo: 'capitale', in: 'stato-' + a3, i_Stato: s.nome }))
  }

  // altre città importanti: le 4 più popolose di ogni Stato (esclusa la capitale)
  const grandiCitta = []
  for (const a3 of Object.keys(C.STATI_EUROPA)) {
    const cap = C.STATI_EUROPA[a3].capitale
    const lista = places.filter((p) => p.properties.ADM0_A3 === a3 && p.properties.ADM0CAP !== 1 && ![p.properties.NAME_IT, p.properties.NAME].includes(cap))
      .filter((p) => intersects({ type: 'Point', coordinates: [p.properties.LONGITUDE, p.properties.LATITUDE] }, [-25, 34, 66, 72]))
      .sort((a, b) => b.properties.POP_MAX - a.properties.POP_MAX).slice(0, a3 === 'RUS' ? 6 : 4)
    for (const p of lista) {
      const pr = p.properties
      grandiCitta.push(pt([pr.LONGITUDE, pr.LATITUDE], {
        id: 'citta-' + a3 + '-' + pr.NE_ID, nome: pr.NAME_IT || pr.NAME, livello: 'grandi_citta', tipo: 'città', in: 'stato-' + a3,
        val: pr.POP_MAX, i_Stato: C.STATI_EUROPA[a3].nome, i_Abitanti: '≈ ' + fmt(pr.POP_MAX) + ' (area urbana)',
      }))
    }
  }

  // ---------- regioni d'Europa (macro-regioni del libro) ----------
  const gruppiDi = new Map([...MACRO_DI].map(([a3, m]) => ['stato-' + a3, [m]]))
  const geomMacro = await dissolvi(stati, (f) => MACRO_DI.get(f.properties.id.slice(6)))
  const macroregioni = Object.entries(D.MACROREGIONI_EUROPA).map(([k, m], i) => {
    const membri = stati.filter((s) => m.stati.includes(s.properties.id.slice(6)))
    const km2 = m.stati.reduce((t, a3) => t + (D.DETTAGLI_STATI[a3]?.km2 ?? 0), 0)
    const ab = membri.reduce((t, s) => t + (s.properties.val ?? 0), 0)
    return feat(geomMacro.get('macro-' + k), {
      id: 'macro-' + k, nome: m.nome, livello: 'macroregioni', tipo: 'regione europea', _c: i,
      i_Stati: membri.map((s) => s.properties.nome).sort((a, b) => a.localeCompare(b, 'it')).join(', '), i_Numero_di_Stati: String(membri.length),
      // della Russia conta solo la parte europea (circa 4 milioni di km² e 110 milioni di abitanti)
      i_Superficie: '≈ ' + fmt(k === 'russia' ? 3995000 : km2) + ' km²', i_Abitanti: '≈ ' + fmt(k === 'russia' ? 110000000 : ab), desc: m.desc,
    })
  }).filter((f) => f.geometry)
  aggiungiGruppi([...capitali, ...grandiCitta], gruppiDi)

  // ---------- fisica ----------
  const contStati = await contenitori(stati, (f) => f.properties.id)
  const nomiStati = new Map(stati.map((f) => [f.properties.id, f.properties.nome]))
  const inEu = (p, f) => intersects(f.geometry, box) && (p.REGION === 'Europe' || p.NAME === 'APPENNINI')
  const rilievi = aree((p, f) => p.FEATURECLA === 'Range/mtn' && inEu(p, f) && (p.SCALERANK <= 5 || ['ALPS', 'APPENNINI', 'Dinaric Alps', 'PYRENEES'].includes(p.NAME)))
  const pianure = [
    ...aree((p, f) => ['Plain', 'Lowland', 'Basin', 'Delta', 'Plateau', 'Tundra'].includes(p.FEATURECLA) && inEu(p, f) && p.SCALERANK <= 5 && p.NAME !== 'PENÍNSULA IBÉRICA'),
    ...C.PIANURE_ITALIA.filter((p) => p.aree.includes('europa')).map((p) => poly(p.poligono, { id: 'pianura-' + p.id, nome: p.nome, livello: 'pianure', tipo: 'pianura', desc: p.note })),
  ]
  const penisole = aree((p, f) => ['Peninsula', 'Pen/cape'].includes(p.FEATURECLA) && inEu(p, f) && p.SCALERANK <= 5)
  penisole.push(...aree((p) => ['SCANDINAVIA', 'PENÍNSULA IBÉRICA', 'BALKAN PEN.'].includes(p.NAME)).filter((f) => !penisole.some((x) => x.properties.id === f.properties.id)))
  const isole = aree((p, f) => ['Island', 'Island group'].includes(p.FEATURECLA) && intersects(f.geometry, box) && p.SCALERANK <= 5 && p.REGION !== 'Africa' && p.REGION !== 'Asia')
  const fiumiEu = fiumiEuropa(box)
  const laghiEu = laghiEuropa(box)
  const tutteVette = vetteEuropa(box)
  aggiungiGruppi(assegna([...rilievi, ...pianure, ...penisole, ...isole, ...fiumiEu, ...laghiEu, ...tutteVette], contStati, nomiStati, 'Stati'), gruppiDi)
  const confini = [
    ...stati.map((f) => feat(f.geometry, { livello: 'confini', ref: f.properties.id })),
    // contorni delle regioni d'Europa, per lo zoom sulla carta fisica
    ...macroregioni.map((f) => feat(f.geometry, { livello: 'confini', ref: f.properties.id, gruppo: 1 })),
  ]
  const mariEu = mari((p, f) => intersects(f.geometry, box) && (p.scalerank <= 3 || /Tyrrhenian|Adriatic|Ionian|Aegean|Ligurian|Balearic|Bothnia|Finland|Biscay|English Channel|Irish/.test(p.name)))
  write('europa', 'fisica', await topo({
    mari: mariEu, terra: terra(land10, box), confini, pianure, rilievi, penisole, isole, laghi: laghiEu, fiumi: fiumiEu,
    vette: tutteVette.filter((v) => v.properties.livello === 'vette'), vulcani: tutteVette.filter((v) => v.properties.livello === 'vulcani'),
  }, { clip: box, simplify: '6%' }))

  // elementi fisici principali per Stato
  const principali = (lista, id, n) => lista.filter((f) => f.properties.in?.split(',').includes(id))
    .sort((a, b) => (b.properties.val ?? lunghezzaKm(b)) - (a.properties.val ?? lunghezzaKm(a))).slice(0, n).map((f) => f.properties.nome).join(', ')
  for (const s of stati) {
    const id = s.properties.id
    s.properties.i_Fiumi_principali = principali(fiumiEu, id, 4) || '—'
    s.properties.i_Rilievi = rilievi.filter((f) => f.properties.in?.split(',').includes(id)).map((f) => f.properties.nome).slice(0, 4).join(', ') || 'pianeggiante'
    const vetta = tutteVette.filter((f) => f.properties.in?.split(',').includes(id)).sort((a, b) => b.properties.val - a.properties.val)[0]
    if (vetta) s.properties.i_Vetta_più_alta = `${vetta.properties.nome} (${fmt(vetta.properties.val)} m)`
  }

  const sudd = await suddivisioni(box)
  const nSudd = new Map()
  sudd.forEach((f) => nSudd.set(f.properties.in, (nSudd.get(f.properties.in) ?? 0) + 1))
  aggiungiGruppi(sudd, gruppiDi)
  for (const s of stati) if (nSudd.get(s.properties.id)) s.properties.i_Suddivisioni = `${nSudd.get(s.properties.id)} (${D.TIPO_SUDDIVISIONE[s.properties.id.slice(6)] ?? 'regioni'})`

  const t = JSON.parse(await topo({ mari: mariEu, contesto, macroregioni, stati, suddivisioni: sudd, citta: capitali, grandi_citta: grandiCitta }, { clip: box, simplify: '5%' }))
  for (const [, v] of vicini(t, ['stati', 'contesto'], 'stati')) {
    v.g.properties.i_Confina_con = v.nomi.join(', ') || 'nessuno Stato (isola)'
    v.g.properties.vicini = v.ids.join(',')
  }
  write('europa', 'politica', JSON.stringify(t))
}

// ======================= MONDO =======================
function bande() {
  const T = 23.44, P = 66.56
  const zone = [
    { id: 'glaciale-artica', nome: 'Zona glaciale artica', da: P, a: 89.9, desc: 'Fredda tutto l’anno; il Sole resta sotto l’orizzonte per mesi (notte polare).' },
    { id: 'temperata-boreale', nome: 'Zona temperata boreale', da: T, a: P, desc: 'Quattro stagioni ben distinte; qui si trova l’Europa.' },
    { id: 'torrida', nome: 'Zona torrida', da: -T, a: T, desc: 'Tra i due tropici: fa caldo tutto l’anno e il Sole può essere allo zenit.' },
    { id: 'temperata-australe', nome: 'Zona temperata australe', da: -P, a: -T, desc: 'Stagioni invertite rispetto all’emisfero nord.' },
    { id: 'glaciale-antartica', nome: 'Zona glaciale antartica', da: -89.9, a: -P, desc: 'Comprende l’Antartide, coperta dai ghiacci.' },
  ]
  const out = []
  for (const z of zone) {
    const coords = []
    // anello in senso orario (convenzione d3-geo): bordo nord da ovest a est, poi bordo sud da est a ovest
    for (let x = -180; x <= 180; x += 5) coords.push([x, z.a])
    for (let x = 180; x >= -180; x -= 5) coords.push([x, z.da])
    coords.push(coords[0])
    out.push(feat({ type: 'Polygon', coordinates: [coords] }, { id: 'fascia-' + z.id, nome: z.nome, livello: 'fasce', tipo: 'fascia climatica', desc: z.desc }))
  }
  return out
}

function paralleli() {
  const lines = [
    ['equatore', 'Equatore', 0, 'Divide la Terra in emisfero nord (boreale) ed emisfero sud (australe).'],
    ['tropico-cancro', 'Tropico del Cancro', 23.44, 'Il parallelo più a nord dove il Sole può essere allo zenit.'],
    ['tropico-capricorno', 'Tropico del Capricorno', -23.44, 'Il parallelo più a sud dove il Sole può essere allo zenit.'],
    ['circolo-artico', 'Circolo polare artico', 66.56, 'Oltre questo parallelo ci sono giorni di luce e di buio continui.'],
    ['circolo-antartico', 'Circolo polare antartico', -66.56, 'Delimita la zona glaciale antartica.'],
  ]
  return lines.map(([id, nome, lat, desc]) => feat({ type: 'LineString', coordinates: Array.from({ length: 73 }, (_, i) => [-180 + i * 5, lat]) },
    { id: 'parallelo-' + id, nome, livello: 'paralleli', tipo: 'parallelo', i_Latitudine: `${Math.abs(lat)}° ${lat > 0 ? 'N' : lat < 0 ? 'S' : ''}`.trim(), desc }))
    .concat(meridiani())
}

/** Meridiano fondamentale e linea del cambiamento di data (stesso livello dei paralleli) */
function meridiani() {
  const linea = (lon) => Array.from({ length: 37 }, (_, i) => [lon, -90 + i * 5])
  return [
    feat({ type: 'LineString', coordinates: linea(0) }, { id: 'meridiano-greenwich', nome: 'Meridiano di Greenwich', livello: 'paralleli', tipo: 'meridiano',
      i_Longitudine: '0°', desc: 'Il meridiano fondamentale: passa per l’Osservatorio di Greenwich, a Londra. Da qui si misura la longitudine verso est e verso ovest.' }),
    feat({ type: 'LineString', coordinates: linea(179.9) }, { id: 'linea-data', nome: 'Linea del cambiamento di data', livello: 'paralleli', tipo: 'meridiano',
      i_Longitudine: '180°', desc: 'Segue in gran parte il meridiano di 180°: attraversandola verso ovest si va avanti di un giorno, verso est si torna indietro di un giorno.' }),
  ]
}

/** Fusi orari teorici: 24 spicchi di 15° a partire dal meridiano di Greenwich */
function fusi() {
  const out = []
  for (let k = -12; k <= 12; k++) {
    const x0 = Math.max(-180, k * 15 - 7.5)
    const x1 = Math.min(180, k * 15 + 7.5)
    if (x1 - x0 < 1) continue
    const ring = []
    // anello in senso orario: bordo ovest dal basso verso l'alto, poi bordo est dall'alto verso il basso
    for (let y = -89; y <= 89; y += 2) ring.push([x0, y])
    for (let y = 89; y >= -89; y -= 2) ring.push([x1, y])
    ring.push(ring[0])
    const nome = k === 0 ? 'UTC (ora di Greenwich)' : `UTC${k > 0 ? '+' : '−'}${Math.abs(k)}`
    const ora = (12 + k + 24) % 24
    out.push(feat({ type: 'Polygon', coordinates: [ring] }, {
      id: 'fuso-' + k, nome: 'Fuso ' + nome, livello: 'fusi', tipo: 'fuso orario (teorico)', val: k, _c: (k + 12) % 2,
      i_Differenza: k === 0 ? 'nessuna' : `${k > 0 ? '+' : '−'}${Math.abs(k)} ore rispetto a Greenwich`,
      i_Ora: `quando a Greenwich è mezzogiorno qui sono le ${String(ora).padStart(2, '0')}:00${k === 12 || k === -12 ? ' (ma di un giorno diverso)' : ''}`,
      desc: 'I fusi teorici sono spicchi larghi 15°: la Terra ruota di 15° ogni ora. Gli Stati però spesso seguono confini diversi e usano l’ora legale.',
    }))
  }
  return out
}

/** Area geografica (del libro) di uno Stato del mondo */
function macroareaDi(p) {
  for (const [k, m] of Object.entries(D.MACROAREE_MONDO)) if (m.stati?.includes(p.ADM0_A3)) return k
  for (const [k, m] of Object.entries(D.MACROAREE_MONDO)) if (m.subregioni.includes(p.SUBREGION) && !(k === 'subcontinente-indiano' && ['IRN', 'AFG'].includes(p.ADM0_A3))) {
    // gli Stati assegnati a mano all'Africa meridionale non restano nell'Africa centrale
    if (k === 'africa-centrale' && D.MACROAREE_MONDO['africa-meridionale'].stati.includes(p.ADM0_A3)) continue
    return k
  }
  return null
}

async function mondo() {
  const stati = []
  const capitali = []
  const gruppiDi = new Map()
  for (const f of countries50) {
    const p = f.properties
    const cont = C.CONTINENTI[p.CONTINENT]
    if (!cont) continue
    const a3 = p.ADM0_A3
    const eu = C.STATI_EUROPA[a3]
    const d = { ...(D.DETTAGLI_STATI[a3] ?? {}), ...(D.DETTAGLI_MONDO[a3] ?? {}) }
    const nome = eu?.nome ?? p.NAME_IT ?? p.NAME
    const plc = places.filter((x) => x.properties.ADM0_A3 === a3 && x.properties.ADM0CAP === 1).sort((a, b) => b.properties.POP_MAX - a.properties.POP_MAX)[0]
    const capitale = eu?.capitale ?? plc?.properties.NAME_IT ?? plc?.properties.NAME
    const macro = macroareaDi(p)
    const gruppi = ['continente-' + cont.id, ...(macro ? ['macro-' + macro] : [])]
    gruppiDi.set('stato-' + a3, gruppi)
    const km2 = d.km2 ?? Math.round(geoArea(f) * 6371 * 6371)
    stati.push(feat(f.geometry, {
      id: 'stato-' + a3, nome, livello: 'stati', tipo: 'Stato', cont: cont.id, cap: capitale, flag: p.ISO_A2_EH?.toLowerCase(), val: p.POP_EST,
      in: gruppi.join(','), i_Continente: cont.nome, ...(macro ? { i_Area_geografica: D.MACROAREE_MONDO[macro].nome } : {}),
      ...(capitale ? { i_Capitale: capitale } : {}), i_Superficie: (d.km2 ? '' : '≈ ') + fmt(km2) + ' km²', i_Abitanti: '≈ ' + fmt(p.POP_EST),
      ...(d.lingua ?? eu?.lingua ? { i_Lingua: d.lingua ?? eu.lingua } : {}), ...(d.moneta ?? eu?.moneta ? { i_Moneta: d.moneta ?? eu.moneta } : {}),
      ...(d.governo ? { i_Governo: d.governo } : {}), ...(d.curiosita ? { desc: d.curiosita } : {}),
      ...(D.DETTAGLI_MONDO[a3] ? { studiato: 1 } : {}),
    }))
    if (plc && capitale && p.POP_EST > 0) capitali.push(pt([plc.properties.LONGITUDE, plc.properties.LATITUDE], { id: 'capitale-' + a3, nome: capitale, livello: 'citta', tipo: 'capitale', in: 'stato-' + a3, i_Stato: nome }))
  }

  // altre città: per gli Stati studiati le 4 più popolose, per gli altri solo le metropoli oltre i 5 milioni
  const grandiCitta = []
  for (const s of stati) {
    const a3 = s.properties.id.slice(6)
    const studiato = !!D.DETTAGLI_MONDO[a3]
    const lista = places.filter((p) => p.properties.ADM0_A3 === a3 && p.properties.ADM0CAP !== 1 && ![p.properties.NAME_IT, p.properties.NAME].includes(s.properties.cap))
      .filter((p) => studiato || p.properties.POP_MAX >= 5000000)
      .sort((a, b) => b.properties.POP_MAX - a.properties.POP_MAX).slice(0, studiato ? 4 : 2)
    for (const p of lista) {
      const pr = p.properties
      grandiCitta.push(pt([pr.LONGITUDE, pr.LATITUDE], {
        id: 'citta-' + a3 + '-' + pr.NE_ID, nome: pr.NAME_IT || pr.NAME, livello: 'grandi_citta', tipo: 'città', in: 'stato-' + a3,
        val: pr.POP_MAX, i_Stato: s.properties.nome, i_Abitanti: '≈ ' + fmt(pr.POP_MAX) + ' (area urbana)',
      }))
    }
  }

  // continenti e aree geografiche per dissoluzione degli Stati
  const geomCont = await dissolvi(countries50.filter((f) => C.CONTINENTI[f.properties.CONTINENT]), (f) => f.properties.CONTINENT)
  const continenti = [...geomCont].map(([k, g]) => {
    const c = C.CONTINENTI[k]
    return feat(g, { id: 'continente-' + c.id, nome: c.nome, livello: 'continenti', tipo: 'continente', val: c.superficie,
      i_Superficie: '≈ ' + fmt(c.superficie) + ' km²', i_Abitanti: c.popolazione ? '≈ ' + fmt(c.popolazione) : 'nessun abitante permanente',
      i_Stati: String(stati.filter((s) => s.properties.cont === c.id && s.properties.val > 0).length), desc: c.nota })
  })
  const geomMacro = await dissolvi(countries50.filter((f) => C.CONTINENTI[f.properties.CONTINENT]), (f) => macroareaDi(f.properties))
  const macroaree = Object.entries(D.MACROAREE_MONDO).map(([k, m], i) => {
    const membri = stati.filter((s) => s.properties.in.split(',').includes('macro-' + k) && s.properties.val > 0)
    return feat(geomMacro.get(k), {
      id: 'macro-' + k, nome: m.nome, livello: 'macroaree', tipo: 'area geografica', _c: i,
      i_Numero_di_Stati: String(membri.length), i_Abitanti: '≈ ' + fmt(membri.reduce((t, s) => t + s.properties.val, 0)),
      i_Stati_studiati: membri.filter((s) => s.properties.studiato).map((s) => s.properties.nome).join(', ') || '—', desc: m.desc,
    })
  }).filter((f) => f.geometry)

  // suddivisioni interne dei grandi Stati
  const admin1 = await load('ne_10m_admin_1_states_provinces')
  const sudd = admin1.filter((f) => D.SUDDIVISIONI_MONDO[f.properties.adm0_a3] && f.geometry).map((f) => {
    const p = f.properties
    // il nome italiano del Distretto di Columbia è "Washington", come lo Stato di Washington
    const nome = p.iso_3166_2 === 'US-DC' ? 'Distretto di Columbia' : String(p.name_it || p.name).replace(/^(\p{Ll})/u, (c) => c.toUpperCase())
    return feat(f.geometry, { id: 'sudd-' + p.adm1_code, nome, livello: 'suddivisioni', tipo: D.SUDDIVISIONI_MONDO[p.adm0_a3], in: 'stato-' + p.adm0_a3,
      i_Stato: stati.find((s) => s.properties.id === 'stato-' + p.adm0_a3)?.properties.nome })
  })
  const nSudd = new Map()
  sudd.forEach((f) => nSudd.set(f.properties.in, (nSudd.get(f.properties.in) ?? 0) + 1))
  for (const s of stati) if (nSudd.get(s.properties.id)) s.properties.i_Suddivisioni = `${nSudd.get(s.properties.id)} (${D.SUDDIVISIONI_MONDO[s.properties.id.slice(6)]})`
  aggiungiGruppi([...capitali, ...grandiCitta, ...sudd], gruppiDi)

  // ---------- fisica ----------
  const contStati = await contenitori(stati, (f) => f.properties.id)
  const nomiStati = new Map(stati.map((f) => [f.properties.id, f.properties.nome]))
  const sr = (n) => (p) => p.SCALERANK <= n
  const principali = ['ALPS', 'URAL MOUNTAINS', 'HIMALAYAS', 'ANDES', 'ROCKY MOUNTAINS', 'APPALACHIAN MTS.', 'ATLAS MOUNTAINS', 'CAUCASUS MTS.', 'GREAT DIVIDING RANGE', 'ETHIOPIAN HIGHLANDS', 'DRAKENSBERG', 'PYRENEES']
  const rilievi = [
    ...aree((p) => p.FEATURECLA === 'Range/mtn' && (p.SCALERANK <= 1 || principali.includes(p.NAME))),
    // catene minori: compaiono con lo zoom
    ...aree((p) => p.FEATURECLA === 'Range/mtn' && p.SCALERANK > 1 && p.SCALERANK <= 3 && !principali.includes(p.NAME) && p.REGION !== 'Antarctica').map((f) => ((f.properties.minore = 1), f)),
  ]
  const pianure = aree((p) => ['Plain', 'Lowland', 'Basin'].includes(p.FEATURECLA) && sr(2)(p)).map((f, i, a) => f)
  const altopiani = aree((p) => p.FEATURECLA === 'Plateau' && sr(2)(p))
  const deserti = aree((p) => p.FEATURECLA === 'Desert' && (sr(2)(p) || ['KALAHARI DESERT', 'NAMIB DESERT', 'DESIERTO DE ATACAMA', 'RUB’ AL KHALI', 'GREAT VICTORIA DESERT', 'GREAT SANDY DESERT', 'THAR DESERT'].includes(p.NAME)))
  const penisole = aree((p) => ['Peninsula', 'Pen/cape'].includes(p.FEATURECLA) && sr(2)(p))
  const isole = aree((p) => ['Island', 'Island group'].includes(p.FEATURECLA) && sr(2)(p))
  // gli elementi con scalerank 2 sono "minori": compaiono con lo zoom
  for (const f of [...pianure, ...altopiani, ...deserti, ...penisole, ...isole]) {
    const ne = regionsPolys.find((r) => 'area-' + r.properties.NE_ID === f.properties.id)
    if (ne && ne.properties.SCALERANK > 1 && !['KALAHARI DESERT', 'NAMIB DESERT', 'DESIERTO DE ATACAMA', 'RUB’ AL KHALI', 'GREAT VICTORIA DESERT', 'GREAT SANDY DESERT', 'THAR DESERT'].includes(ne.properties.NAME)) f.properties.minore = 1
  }
  // fiumi: quelli curati + i fiumi con nome di Natural Earth abbastanza lunghi (minori)
  const curati = fiumi('mondo')
  const giaVisti = new Set(C.FIUMI.flatMap((r) => r.ne))
  const gruppiFiumi = new Map()
  for (const f of riversWorld) {
    const p = f.properties
    if (!f.geometry || !p.name || giaVisti.has(p.name) || (p.featurecla && !/River/i.test(p.featurecla)) || p.scalerank > 6) continue
    if (!gruppiFiumi.has(p.name)) gruppiFiumi.set(p.name, [])
    gruppiFiumi.get(p.name).push(f)
  }
  const altriFiumi = []
  for (const [nome, parti] of gruppiFiumi) {
    const linea = feat({ type: 'MultiLineString', coordinates: parti.flatMap((f) => (f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates)) }, {})
    const km = lunghezzaKm(linea)
    if (km < 600) continue
    linea.properties = { id: 'fiume-ne-' + nome.toLowerCase().replace(/[^a-z0-9]+/g, '-'), nome, livello: 'fiumi', tipo: 'fiume', minore: 1, val: Math.round(km / 50) * 50, i_Lunghezza: '≈ ' + fmt(Math.round(km / 50) * 50) + ' km (tratto principale)' }
    altriFiumi.push(linea)
  }
  const fiumiW = [...curati, ...altriFiumi]
  const laghiW = [...laghi('mondo'), ...[...lakes10].filter((f) => {
    const p = f.properties
    if (!f.geometry || !p.name || C.LAGHI.some((l) => l.ne?.includes(p.name))) return false
    const km2 = geoArea(f) * 6371 * 6371
    return km2 > 2500 && km2 < 400000
  }).filter((f, i, a) => a.findIndex((x) => x.properties.name === f.properties.name) === i).map((f) => {
    const p = f.properties
    const km2 = geoArea(f) * 6371 * 6371
    const nome = p.name_it ? 'Lago ' + p.name_it.replace(/^(lago|lake)\s+/i, '') : p.name
    return feat(f.geometry, { id: 'lago-ne-' + p.ne_id, nome, livello: 'laghi', tipo: 'lago', minore: 1, val: Math.round(km2), i_Superficie: '≈ ' + fmt(km2) + ' km²' })
  })]
  const nomiVette = new Set(C.VETTE.map((v) => v.nome.toLowerCase()))
  const vetteW = [...vette('mondo'), ...elevPoints.filter((f) => {
    const p = f.properties
    return p.elevation > 2500 && (p.name_it || p.name) && !nomiVette.has((p.name_it || p.name).toLowerCase())
  }).map((f) => {
    const p = f.properties
    const nome = p.name_it || p.name
    return pt(f.geometry.coordinates, { id: 'vetta-ne-' + p.ne_id, nome: nome.charAt(0).toUpperCase() + nome.slice(1), livello: 'vette', tipo: 'vetta', minore: 1, val: p.elevation, i_Altezza: fmt(p.elevation) + ' m' })
  })]
  aggiungiGruppi(assegna([...rilievi, ...pianure, ...altopiani, ...deserti, ...penisole, ...isole, ...fiumiW, ...laghiW, ...vetteW], contStati, nomiStati, 'Stati'), gruppiDi)

  // riepilogo fisico nelle schede degli Stati
  const dentroDi = (lista, id) => lista.filter((f) => f.properties.in?.split(',').includes(id))
  for (const s of stati) {
    const id = s.properties.id
    const fz = dentroDi(fiumiW, id).sort((a, b) => (b.properties.val ?? lunghezzaKm(b)) - (a.properties.val ?? lunghezzaKm(a))).slice(0, 4).map((f) => f.properties.nome)
    if (fz.length) s.properties.i_Fiumi_principali = fz.join(', ')
    const rz = dentroDi(rilievi, id).slice(0, 4).map((f) => f.properties.nome)
    if (rz.length) s.properties.i_Rilievi = rz.join(', ')
    const vetta = dentroDi(vetteW, id).sort((a, b) => b.properties.val - a.properties.val)[0]
    if (vetta) s.properties.i_Vetta_più_alta = `${vetta.properties.nome} (${fmt(vetta.properties.val)} m)`
  }

  const confini = [
    ...stati.map((f) => feat(f.geometry, { livello: 'confini', ref: f.properties.id })),
    // contorni di continenti e aree geografiche, per lo zoom sulla carta fisica
    ...continenti.map((f) => feat(f.geometry, { livello: 'confini', ref: f.properties.id, gruppo: 1 })),
    ...macroaree.map((f) => feat(f.geometry, { livello: 'confini', ref: f.properties.id, gruppo: 1 })),
  ]
  const mariW = mari((p) => p.scalerank <= 1 || ['Mediterranean Sea', 'Black Sea', 'Caspian Sea', 'Red Sea', 'Baltic Sea', 'North Sea'].includes(p.name))
  write('mondo', 'fisica', await topo({
    mari: mariW, terra: terra(land50), confini, fasce: bande(), pianure, altopiani, deserti, rilievi, penisole, isole,
    laghi: laghiW, fiumi: fiumiW, vette: vetteW.filter((v) => v.properties.livello === 'vette'),
    vulcani: vetteW.filter((v) => v.properties.livello === 'vulcani'), paralleli: paralleli(),
  }, { simplify: '10%' }))

  const oceani = mari((p) => p.featurecla === 'ocean')
  const t = JSON.parse(await topo({
    mari: oceani, continenti, macroaree, stati, suddivisioni: sudd, citta: capitali, grandi_citta: grandiCitta, paralleli: paralleli(), fusi: fusi(),
  }, { simplify: '12%' }))
  for (const [, v] of vicini(t, ['stati'], 'stati')) {
    if (v.nomi.length) v.g.properties.i_Confina_con = v.nomi.join(', ')
    v.g.properties.vicini = v.ids.join(',')
  }
  write('mondo', 'politica', JSON.stringify(t))
}

await italia()
await europa()
await mondo()

// bandiere SVG (solo Stati presenti nelle mappe)
const flagsDir = path.join(DIR, '..', 'public', 'flags')
fs.mkdirSync(flagsDir, { recursive: true })
const flagSrc = path.join(DIR, '..', 'node_modules', 'flag-icons', 'flags', '4x3')
let nFlags = 0
for (const f of fs.readdirSync(flagSrc)) { fs.copyFileSync(path.join(flagSrc, f), path.join(flagsDir, f)); nFlags++ }
console.log(`✓ ${nFlags} bandiere copiate`)

// pdf.js: worker, font, codifiche e moduli WASM serviti come file statici
const PDFJS = path.join(DIR, "..", "node_modules", "pdfjs-dist")
const PDF_OUT = path.join(DIR, "..", "public", "pdfjs")
fs.mkdirSync(PDF_OUT, { recursive: true })
fs.copyFileSync(path.join(PDFJS, "build", "pdf.worker.min.mjs"), path.join(PDF_OUT, "pdf.worker.min.mjs"))
for (const d of ["standard_fonts", "wasm", "cmaps", "iccs"]) fs.cpSync(path.join(PDFJS, d), path.join(PDF_OUT, d), { recursive: true })
console.log("✓ risorse pdf.js copiate")
