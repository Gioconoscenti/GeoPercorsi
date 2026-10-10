// Scarica da OpenStreetMap (Overpass) le geometrie dei fiumi italiani elencati in curated-dettaglio.mjs.
// Risultato in scripts/.cache/it_fiumi_osm.json (GeoJSON). Dati © OpenStreetMap contributors, ODbL.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FIUMI_ITALIA } from './curated-dettaglio.mjs'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(DIR, '.cache', 'it_fiumi_osm.json')
const API = 'https://overpass-api.de/api/interpreter'
// i nomi dei fiumi non contengono caratteri speciali delle espressioni regolari
const esc = (s) => s

async function overpass(q) {
  for (let tentativo = 1; tentativo <= 3; tentativo++) {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'User-Agent': 'GeoPercorsi/0.1 (progetto scolastico)', Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(q),
    })
    if (res.ok) return res.json()
    console.warn(`  Overpass ${res.status}, nuovo tentativo tra 20 s…`)
    await new Promise((r) => setTimeout(r, 20000))
  }
  throw new Error('Overpass non risponde')
}

/** linee [lon,lat][] da un elemento Overpass con "out geom" */
function linee(el) {
  if (el.type === 'way') return el.geometry ? [el.geometry.map((p) => [p.lon, p.lat])] : []
  return (el.members ?? []).filter((m) => m.type === 'way' && m.geometry && (!m.role || m.role === 'main_stream' || m.role === 'side_stream' || m.role === ''))
    .map((m) => m.geometry.map((p) => [p.lon, p.lat]))
}

// scarica solo i fiumi non ancora in cache (--forza per riscaricare tutto)
const esistenti = fs.existsSync(OUT) && !process.argv.includes('--forza') ? JSON.parse(fs.readFileSync(OUT, 'utf8')).features : []
const DA_FARE = FIUMI_ITALIA.filter((f) => !esistenti.some((e) => e.properties.id === f.id))
if (!DA_FARE.length) {
  console.log('fiumi OSM già tutti in cache (usa --forza per riscaricarli)')
  process.exit(0)
}

const nomi = [...new Set(DA_FARE.flatMap((f) => f.osm))]
const regex = '^(' + nomi.map(esc).join('|') + ')$'
console.log('scarico le relazioni dei fiumi da OpenStreetMap…')
const rel = await overpass(`[out:json][timeout:300];area["ISO3166-1"="IT"][admin_level=2]->.it;relation["waterway"="river"]["name"~"${regex}"](area.it);out geom;`)

const perFiume = new Map()
for (const el of rel.elements) {
  const f = DA_FARE.find((x) => x.osm.includes(el.tags?.name))
  if (!f) continue
  const l = linee(el)
  if (!perFiume.has(f.id)) perFiume.set(f.id, [])
  perFiume.get(f.id).push(...l)
}

const mancanti = DA_FARE.filter((f) => !perFiume.has(f.id))
if (mancanti.length) {
  console.log('senza relazione, uso le singole vie:', mancanti.map((f) => f.nome).join(', '))
  const r2 = '^(' + [...new Set(mancanti.flatMap((f) => f.osm))].map(esc).join('|') + ')$'
  const ways = await overpass(`[out:json][timeout:300];area["ISO3166-1"="IT"][admin_level=2]->.it;way["waterway"="river"]["name"~"${r2}"](area.it);out geom;`)
  for (const el of ways.elements) {
    const f = mancanti.find((x) => x.osm.includes(el.tags?.name))
    if (!f) continue
    if (!perFiume.has(f.id)) perFiume.set(f.id, [])
    perFiume.get(f.id).push(...linee(el))
  }
}

const features = [...esistenti, ...[...perFiume.entries()].map(([id, coords]) => ({ type: 'Feature', properties: { id }, geometry: { type: 'MultiLineString', coordinates: coords } }))]
fs.writeFileSync(OUT, JSON.stringify({ type: 'FeatureCollection', features }))
const ancora = FIUMI_ITALIA.filter((f) => !features.some((e) => e.properties.id === f.id))
console.log(`✓ ${features.length} fiumi salvati` + (ancora.length ? ` · non trovati: ${ancora.map((f) => f.nome).join(', ')}` : ''))
