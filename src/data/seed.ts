import { db } from './db'

let inCorso: Promise<void> | null = null

/** Al primo avvio carica i percorsi d'esempio, organizzati come i capitoli dei libri di testo */
export function seedSeServe() {
  inCorso ??= (async () => {
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
  })().catch((e) => {
    inCorso = null
    console.error('Esempi non caricati', e)
  })
  return inCorso
}
