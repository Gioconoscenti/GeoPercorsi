import { useMemo } from 'react'
import { useGeo } from './useGeo'
import type { Area } from '../types'

const GRUPPI: Record<Area, { livello: string; titolo: string; ordina?: boolean }[]> = {
  italia: [{ livello: 'regioni', titolo: 'Regioni', ordina: true }],
  europa: [{ livello: 'macroregioni', titolo: 'Regioni d’Europa' }, { livello: 'stati', titolo: 'Stati', ordina: true }],
  mondo: [{ livello: 'continenti', titolo: 'Continenti' }, { livello: 'macroaree', titolo: 'Aree geografiche' }, { livello: 'stati', titolo: 'Stati', ordina: true }],
}

/** Aree su cui fare lo zoom, raggruppate (regioni, regioni d'Europa, continenti, Stati…) */
export function useAreeFocus(area: Area) {
  const { data } = useGeo(area, 'politica')
  return useMemo(() => {
    if (!data) return []
    return GRUPPI[area].map((g) => {
      const voci = (data.perLivello.get(g.livello) ?? []).filter((f) => f.properties.id && f.properties.nome)
        .map((f) => ({ id: f.properties.id!, nome: f.properties.nome! }))
      if (g.ordina) voci.sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
      return { titolo: g.titolo, voci }
    }).filter((g) => g.voci.length)
  }, [data, area])
}

export function SceltaFocus({ area, valore, onChange, className }: { area: Area; valore?: string; onChange: (id?: string) => void; className?: string }) {
  const gruppi = useAreeFocus(area)
  return (
    <select className={className ?? 'campo'} value={valore ?? ''} onChange={(e) => onChange(e.target.value || undefined)}>
      <option value="">{{ italia: 'Tutta l’Italia', europa: 'Tutta l’Europa', mondo: 'Tutto il mondo' }[area]}</option>
      {gruppi.map((g) => (
        <optgroup key={g.titolo} label={g.titolo}>
          {g.voci.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </optgroup>
      ))}
    </select>
  )
}
