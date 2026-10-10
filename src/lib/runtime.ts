import { useEffect, useState } from 'react'
import type { Topology } from 'topojson-specification'
import type { Area, TipoMappa } from '../types'

/**
 * Astrae da dove arrivano mappe, file e bandiere:
 * - nell'app del docente: IndexedDB + cartella public/
 * - nel file HTML per gli alunni: dati incorporati nella pagina
 */
export interface Runtime {
  assetUrl(id: string): Promise<string | undefined>
  assetInfo(id: string): Promise<{ nome: string; mime: string } | undefined>
  pdfPagine(id: string): Promise<string[] | undefined>
  loadGeo(area: Area, tipo: TipoMappa): Promise<Topology>
  flagUrl(code: string): string
}

let runtime: Runtime | null = null
export function setRuntime(r: Runtime) {
  runtime = r
}
export function getRuntime(): Runtime {
  if (!runtime) throw new Error('Runtime non inizializzato')
  return runtime
}

export function useAssetUrl(id?: string) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    let vivo = true
    setUrl(undefined)
    if (id) getRuntime().assetUrl(id).then((u) => vivo && setUrl(u))
    return () => {
      vivo = false
    }
  }, [id])
  return url
}

/** Cache di Promise per evitare caricamenti doppi */
export function memo<K, V>(fn: (k: K) => Promise<V>) {
  const cache = new Map<string, Promise<V>>()
  return (k: K) => {
    const key = JSON.stringify(k)
    if (!cache.has(key)) cache.set(key, fn(k).catch((e) => { cache.delete(key); throw e }))
    return cache.get(key)!
  }
}
