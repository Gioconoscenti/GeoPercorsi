import type { Attivita } from '../types'
import type { Risultato } from './correzione'
import { Quiz } from './Quiz'
import { Abbina, Completa, Flashcard, Ordina, VeroFalso } from './Semplici'
import { Coordinate, Etichette, Trova } from './GiochiMappa'
import { Grafico } from './Grafico'

export function AttivitaView({ att, onRisultato, statico }: { att: Attivita; onRisultato?: (r: Risultato) => void; statico?: boolean }) {
  const p = { onRisultato, statico }
  switch (att.tipo) {
    case 'quiz': return <Quiz att={att} {...p} />
    case 'vf': return <VeroFalso att={att} {...p} />
    case 'abbina': return <Abbina att={att} {...p} />
    case 'completa': return <Completa att={att} {...p} />
    case 'ordina': return <Ordina att={att} {...p} />
    case 'flashcard': return <Flashcard att={att} {...p} />
    case 'trova': return <Trova att={att} {...p} />
    case 'etichette': return <Etichette att={att} {...p} />
    case 'coordinate': return <Coordinate att={att} {...p} />
    case 'grafico': return <Grafico att={att} {...p} />
  }
}

/** Le attività che danno un punteggio */
export const conPunteggio = (a: Attivita) => a.tipo !== 'flashcard'
