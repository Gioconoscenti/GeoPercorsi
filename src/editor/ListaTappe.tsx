import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { EditorApi } from './Editor'
import type { Tappa } from '../types'
import { nuovoId } from '../lib/id'
import { NOMI_ATTIVITA } from '../lib/fabbrica'

function riassunto(t: Tappa) {
  const icone = t.elementi.map((e) => (e.tipo === 'attivita' ? NOMI_ATTIVITA[e.attivita.tipo].icona : { testo: '🔤', immagine: '🖼️', video: '🎬', audio: '🎧', pdf: '📄', hotspot: 'ℹ️', pulsante: '🔘', mappa: '🗺️' }[e.tipo]))
  return [...new Set(icone)].join(' ')
}

function Voce({ t, i, api }: { t: Tappa; i: number; api: EditorApi }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: t.id })
  const attiva = api.tappa.id === t.id
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      style={{ transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined, transition, zIndex: isDragging ? 10 : undefined }}
      onClick={() => api.vaiATappa(t.id)}
      className={'group rounded-xl border-2 p-2 cursor-pointer bg-white select-none ' + (attiva ? 'border-indigo-500 shadow' : 'border-transparent hover:border-slate-300') + (isDragging ? ' shadow-lg' : '')}>
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 shrink-0 rounded-md bg-slate-100 text-slate-600 grid place-items-center text-xs font-bold">{i + 1}</span>
        <span className="font-semibold text-sm truncate flex-1">{t.titolo || 'Senza titolo'}</span>
      </div>
      <div className="mt-1 h-10 rounded-md border border-slate-200 text-xs px-1.5 py-1 overflow-hidden text-slate-500" style={{ background: t.sfondo }}>
        {riassunto(t) || 'vuota'}
      </div>
    </div>
  )
}

export function ListaTappe({ api }: { api: EditorApi }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const tappe = api.percorso.tappe
  const fine = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return
    api.aggiornaPercorso((p) => {
      const a = p.tappe.findIndex((t) => t.id === e.active.id)
      const b = p.tappe.findIndex((t) => t.id === e.over!.id)
      return { ...p, tappe: arrayMove(p.tappe, a, b) }
    })
  }
  const duplica = () => {
    const copia = structuredClone(api.tappa)
    copia.id = nuovoId()
    copia.titolo += ' (copia)'
    copia.elementi.forEach((e) => (e.id = nuovoId()))
    api.aggiungiTappa(copia)
  }
  const elimina = () => {
    if (tappe.length <= 1 || !confirm(`Eliminare la tappa “${api.tappa.titolo}”?`)) return
    const i = tappe.findIndex((t) => t.id === api.tappa.id)
    api.aggiornaPercorso((p) => ({ ...p, tappe: p.tappe.filter((t) => t.id !== api.tappa.id) }))
    api.vaiATappa(tappe[i === 0 ? 1 : i - 1].id)
  }
  return (
    <aside className="w-52 shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col">
      <div className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 flex items-center">
        Tappe <span className="ml-auto font-normal normal-case">trascina per riordinare</span>
      </div>
      <div className="flex-1 overflow-auto px-2 flex flex-col gap-1.5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={fine}>
          <SortableContext items={tappe.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tappe.map((t, i) => <Voce key={t.id} t={t} i={i} api={api} />)}
          </SortableContext>
        </DndContext>
      </div>
      <div className="p-2 border-t border-slate-200 flex flex-col gap-1">
        <button className="btn-primario justify-center" onClick={() => api.aggiungiTappa()}>＋ Nuova tappa</button>
        <div className="flex gap-1">
          <button className="btn-ghost flex-1 justify-center text-xs" onClick={duplica}>📄 Duplica</button>
          <button className="btn-pericolo flex-1 justify-center text-xs" onClick={elimina} disabled={tappe.length <= 1}>🗑️ Elimina</button>
        </div>
      </div>
    </aside>
  )
}
