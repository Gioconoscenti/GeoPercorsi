import { normalizza } from '../attivita/correzione'
import type { Percorso } from '../types'

export interface Corrispondenza {
  /** il percorso risponde alla ricerca */
  ok: boolean
  /** se le parole non stanno nel titolo o nella descrizione: la prima tappa che le contiene */
  tappa?: string
}

/**
 * Cerca nel titolo, nella descrizione e nei titoli delle tappe, senza badare a maiuscole e accenti.
 * Servono tutte le parole scritte (in qualunque ordine): "carta lombardia" trova "Carta muta fisica – Lombardia".
 */
export function cercaPercorso(p: Percorso, ricerca: string): Corrispondenza {
  const parole = normalizza(ricerca).split(' ').filter(Boolean)
  if (!parole.length) return { ok: true }
  const principale = normalizza(`${p.titolo} ${p.descrizione}`)
  if (parole.every((w) => principale.includes(w))) return { ok: true }
  const tappe = p.tappe.map((t) => ({ titolo: t.titolo, n: normalizza(t.titolo) }))
  const tutto = `${principale} ${tappe.map((t) => t.n).join(' ')}`
  if (!parole.every((w) => tutto.includes(w))) return { ok: false }
  // la tappa che contiene più parole, tra quelle che ne hanno almeno una
  const migliore = tappe
    .map((t) => ({ titolo: t.titolo, punti: parole.filter((w) => t.n.includes(w)).length }))
    .filter((t) => t.punti > 0)
    .sort((a, b) => b.punti - a.punti)[0]
  return { ok: true, tappa: migliore?.titolo }
}
