import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { EditorApi } from './Editor'
import type { Tappa } from '../types'
import { nuovoId } from '../lib/id'
import { NOMI_ATTIVITA } from '../lib/fabbrica'
import { toast } from '../ui/Toast'

function riassunto(t: Tappa) {
  const icone = t.elementi.map((e) => (e.tipo === 'attivita' ? NOMI_ATTIVITA[e.attivita.tipo].icona : { testo: '🔤', immagine: '🖼️', video: '🎬', audio: '🎧', pdf: '📄', hotspot: 'ℹ️', pulsante: '🔘', mappa: '🗺️' }[e.tipo]))
  return [...new Set(icone)].join(' ')
}

function Voce({ t, i, api, compatta }: { t: Tappa; i: number; api: EditorApi; compatta: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: t.id })
  const attiva = api.tappa.id === t.id
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      style={{ transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined, transition, zIndex: isDragging ? 10 : undefined }}
      onClick={() => api.vaiATappa(t.id)}
      title={t.titolo || 'Senza titolo'}
      className={'group rounded-xl border-2 p-2 cursor-pointer bg-white select-none ' + (attiva ? 'border-indigo-500 shadow' : 'border-transparent hover:border-slate-300') + (isDragging ? ' shadow-lg' : '')}>
      {compatta ? (
        <div className="flex flex-col items-center gap-1">
          <span className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 grid place-items-center text-sm font-bold">{i + 1}</span>
          <span className="w-full h-7 rounded-md border border-slate-200 text-[10px] leading-tight overflow-hidden text-center" style={{ background: t.sfondo }}>{riassunto(t)}</span>
        </div>
      ) : (<>
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 shrink-0 rounded-md bg-slate-100 text-slate-600 grid place-items-center text-xs font-bold">{i + 1}</span>
        <span className="font-semibold text-sm truncate flex-1">{t.titolo || 'Senza titolo'}</span>
      </div>
      <div className="mt-1 h-10 rounded-md border border-slate-200 text-xs px-1.5 py-1 overflow-hidden text-slate-500" style={{ background: t.sfondo }}>
        {riassunto(t) || 'vuota'}
      </div>
      </>)}
    </div>
  )
}

export function ListaTappe({ api, compatta = false, onCompatta }: { api: EditorApi; compatta?: boolean; onCompatta?: () => void }) {
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
    if (tappe.length <= 1) return
    const tolta = api.tappa
    const i = tappe.findIndex((t) => t.id === tolta.id)
    api.aggiornaPercorso((p) => ({ ...p, tappe: p.tappe.filter((t) => t.id !== tolta.id) }))
    api.vaiATappa(tappe[i === 0 ? 1 : i - 1].id)
    toast(`Tappa “${tolta.titolo || 'senza titolo'}” eliminata`, {
      azione: {
        etichetta: 'Annulla',
        fn: () => {
          api.aggiornaPercorso((p) => ({ ...p, tappe: [...p.tappe.slice(0, i), tolta, ...p.tappe.slice(i)] }))
          api.vaiATappa(tolta.id)
        },
      },
    })
  }
  return (
    <aside className={(compatta ? 'w-20' : 'w-52') + ' shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col'}>
      <div className="px-2 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1">
        {!compatta && <span className="pl-1 flex-1" title="Trascina le tappe per riordinarle">Tappe <span className="font-normal normal-case">· trascina</span></span>}
        {onCompatta && (
          <button className={'w-8 h-8 rounded-lg hover:bg-slate-200 text-base normal-case ' + (compatta ? 'mx-auto' : '')} onClick={onCompatta}
            title={compatta ? 'Allarga l’elenco delle tappe' : 'Restringi l’elenco delle tappe'} aria-label={compatta ? 'Allarga l’elenco delle tappe' : 'Restringi l’elenco delle tappe'}>
            {compatta ? '»' : '«'}
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto px-2 flex flex-col gap-1.5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={fine}>
          <SortableContext items={tappe.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tappe.map((t, i) => <Voce key={t.id} t={t} i={i} api={api} compatta={compatta} />)}
          </SortableContext>
        </DndContext>
      </div>
      <div className="p-2 border-t border-slate-200 flex flex-col gap-1">
        <button className="btn-primario justify-center" onClick={() => api.aggiungiTappa()} title="Nuova tappa" aria-label="Nuova tappa">＋{!compatta && ' Nuova tappa'}</button>
        <div className={'flex gap-1 ' + (compatta ? 'flex-col' : '')}>
          <button className="btn-ghost flex-1 justify-center text-xs" onClick={duplica} title="Duplica la tappa" aria-label="Duplica la tappa">📄{!compatta && ' Duplica'}</button>
          <button className="btn-pericolo flex-1 justify-center text-xs" onClick={elimina} disabled={tappe.length <= 1} title="Elimina la tappa" aria-label="Elimina la tappa">🗑️{!compatta && ' Elimina'}</button>
        </div>
      </div>
    </aside>
  )
}
