import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { setRuntime } from './lib/runtime'
import { appRuntime } from './lib/runtime-app'
import { App } from './app/App'

setRuntime(appRuntime)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
