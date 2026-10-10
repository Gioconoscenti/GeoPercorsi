import { HashRouter, Route, Routes } from 'react-router-dom'
import { Home } from './Home'
import { Atlante } from './Atlante'
import { Editor } from '../editor/Editor'
import { PaginaPlayer } from '../player/PaginaPlayer'

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/atlante/:area" element={<Atlante />} />
        <Route path="/modifica/:id" element={<Editor />} />
        <Route path="/presenta/:id" element={<PaginaPlayer modo="lim" />} />
        <Route path="/gioca/:id" element={<PaginaPlayer modo="alunno" />} />
      </Routes>
    </HashRouter>
  )
}
