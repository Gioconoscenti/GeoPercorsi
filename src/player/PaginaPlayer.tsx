import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../data/db'
import { Player, type ModoPlayer } from './Player'

export function PaginaPlayer({ modo }: { modo: ModoPlayer }) {
  const { id } = useParams()
  const nav = useNavigate()
  const percorso = useLiveQuery(() => db.percorsi.get(id ?? ''), [id], null)
  if (percorso === null) return null
  if (!percorso) return <div className="p-8">Percorso non trovato.</div>
  return <Player percorso={percorso} modo={modo} onEsci={() => (history.length > 1 ? nav(-1) : nav('/'))} />
}
