import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapView } from '../geo/MapView'
import { SceltaFocus } from '../geo/SceltaFocus'
import { conFocus } from '../geo/aree'
import { nuovaMappa } from '../lib/fabbrica'
import { NOMI_AREE, type Area, type MappaConfig } from '../types'

/** Esplorazione libera delle mappe, utile alla LIM */
export function Atlante() {
  const { area = 'italia' } = useParams()
  const [config, setConfig] = useState<MappaConfig>(() => nuovaMappa(area as Area))
  const cambiaArea = (a: Area) => setConfig({ ...nuovaMappa(a, config.tipo), etichette: config.etichette })
  return (
    <div className="h-full flex flex-col">
      <header className="flex flex-wrap items-center gap-3 px-4 py-2 bg-white border-b border-slate-200">
        <Link to="/" className="btn-ghost">← Home</Link>
        <h1 className="text-lg font-extrabold">Atlante</h1>
        <div className="flex rounded-lg border border-slate-300 overflow-hidden ml-2">
          {(['italia', 'europa', 'mondo'] as Area[]).map((a) => (
            <button key={a} onClick={() => cambiaArea(a)} className={'px-3 py-1 text-sm font-semibold ' + (config.area === a ? 'bg-slate-800 text-white' : 'bg-white hover:bg-slate-50')}>
              {NOMI_AREE[a]}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          🔍 Zoom su
          <SceltaFocus area={config.area} valore={config.focus} onChange={(id) => setConfig(conFocus(config, id))} className="campo w-56" />
        </label>
        <span className="text-sm text-slate-500 ml-auto hidden xl:block">Clicca su un elemento per vedere la scheda • rotellina o pizzico per lo zoom</span>
      </header>
      <div className="flex-1 min-h-0">
        <MapView key={config.area + (config.focus ?? '')} config={config} onConfigChange={setConfig} controlli scheda />
      </div>
    </div>
  )
}
