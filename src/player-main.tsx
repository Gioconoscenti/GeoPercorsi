// Punto di ingresso del file HTML autonomo per gli alunni
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { setRuntime } from './lib/runtime'
import { standaloneRuntime } from './lib/runtime-standalone'
import { Player } from './player/Player'

function AppAlunno() {
  const dati = window.__GEOPERCORSO__
  if (!dati) return <div className="p-8 text-center">Nessun percorso incluso in questo file.</div>
  // aggiungendo "?lim" all'indirizzo il docente apre la modalità presentazione
  return <Player percorso={dati.percorso} modo={location.search.includes('lim') ? 'lim' : 'alunno'} />
}

if (window.__GEOPERCORSO__) setRuntime(standaloneRuntime(window.__GEOPERCORSO__))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppAlunno />
  </StrictMode>,
)
