import { db } from './db'

let inCorso: Promise<void> | null = null

/** Al primo avvio carica i percorsi d'esempio, organizzati come i capitoli dei libri di testo */
async function seedCapitoli() {
  if (await db.impostazioni.get('esempi-v2')) return
  const { percorsiCapitoli, TITOLI_ESEMPI_V1 } = await import('./capitoli')
  // le attività si generano dai dati delle carte: si preparano prima della transazione
  const nuovi = await percorsiCapitoli()
  await db.transaction('rw', db.percorsi, db.impostazioni, async () => {
    if (await db.impostazioni.get('esempi-v2')) return
    // i vecchi esempi si tolgono solo se non sono mai stati modificati
    const vecchi = await db.percorsi.filter((p) => TITOLI_ESEMPI_V1.includes(p.titolo) && p.aggiornato - p.creato < 5000).toArray()
    await db.percorsi.bulkDelete(vecchi.map((p) => p.id))
    await db.percorsi.bulkPut(nuovi)
    await db.impostazioni.put({ chiave: 'esempi-v2', valore: Date.now() })
  })
}

/** Temi di approfondimento e carte mute: si aggiungono una sola volta, anche a chi ha già i capitoli */
async function seedExtra() {
  if (await db.impostazioni.get('esempi-v3')) return
  const { percorsiExtra } = await import('./capitoli-extra')
  const nuovi = await percorsiExtra()
  await db.transaction('rw', db.percorsi, db.impostazioni, async () => {
    if (await db.impostazioni.get('esempi-v3')) return
    // la home ordina per data di modifica: i nuovi vanno dopo tutto ciò che c'è già, nell'ordine in cui sono scritti
    const piuVecchio = await db.percorsi.orderBy('aggiornato').first()
    const base = Math.min(Date.now(), piuVecchio?.aggiornato ?? Date.now())
    nuovi.forEach((p, i) => { p.creato = p.aggiornato = base - (i + 1) * 1000 })
    await db.percorsi.bulkPut(nuovi)
    await db.impostazioni.put({ chiave: 'esempi-v3', valore: Date.now() })
  })
}

export function seedSeServe() {
  inCorso ??= (async () => {
    await seedCapitoli()
    await seedExtra()
  })().catch((e) => {
    inCorso = null
    console.error('Esempi non caricati', e)
  })
  return inCorso
}
