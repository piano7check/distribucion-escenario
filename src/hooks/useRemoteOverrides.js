import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Respaldo de un mapa { [diagramKey]: { [slotId]: value } } en una tabla de
// Supabase con la forma (diagram_key, slot_id, value). Se usa tanto para
// quién ocupa cada posición (position_overrides) como para la región/voz de
// cada posición (slot_voice_overrides) — ambas comparten esta misma forma.
// Las escrituras solo disparan la mutación en Supabase; el estado local se
// actualiza a partir del eco de Realtime, así todos los guías conectados
// ven los mismos cambios al instante.
export default function useRemoteOverrides(diagramKey, table) {
  const [all, setAllState] = useState({})
  const [loaded, setLoaded] = useState(false)
  const allRef = useRef(all)
  allRef.current = all

  useEffect(() => {
    let active = true

    async function load() {
      const { data, error } = await supabase.from(table).select('diagram_key, slot_id, value')
      if (!active) return
      if (error) {
        // eslint-disable-next-line no-console
        console.error(`No se pudo cargar ${table}:`, error.message)
        setLoaded(true)
        return
      }
      const grouped = {}
      for (const row of data) {
        grouped[row.diagram_key] ??= {}
        grouped[row.diagram_key][row.slot_id] = row.value
      }
      setAllState(grouped)
      setLoaded(true)
    }
    load()

    const channel = supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        setAllState((prev) => {
          const next = { ...prev }
          if (payload.eventType === 'DELETE') {
            const old = payload.old
            const diagramMap = { ...(next[old.diagram_key] || {}) }
            delete diagramMap[old.slot_id]
            next[old.diagram_key] = diagramMap
          } else {
            const row = payload.new
            const diagramMap = { ...(next[row.diagram_key] || {}) }
            diagramMap[row.slot_id] = row.value
            next[row.diagram_key] = diagramMap
          }
          return next
        })
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [table])

  const applyDiagramMap = useCallback(
    async (key, nextMap) => {
      const prevMap = allRef.current[key] || {}
      const upserts = []
      const deletes = []
      for (const slotId of Object.keys(nextMap)) {
        if (prevMap[slotId] !== nextMap[slotId]) {
          upserts.push({ diagram_key: key, slot_id: slotId, value: String(nextMap[slotId]) })
        }
      }
      for (const slotId of Object.keys(prevMap)) {
        if (!(slotId in nextMap)) deletes.push(slotId)
      }
      if (upserts.length) {
        const { error } = await supabase.from(table).upsert(upserts, { onConflict: 'diagram_key,slot_id' })
        if (error) console.error(`Error guardando ${table}:`, error.message) // eslint-disable-line no-console
      }
      for (const slotId of deletes) {
        const { error } = await supabase.from(table).delete().eq('diagram_key', key).eq('slot_id', slotId)
        if (error) console.error(`Error borrando de ${table}:`, error.message) // eslint-disable-line no-console
      }
    },
    [table]
  )

  const setOverrides = useCallback(
    (updater) => {
      const prevMap = allRef.current[diagramKey] || {}
      const nextMap = typeof updater === 'function' ? updater(prevMap) : updater
      applyDiagramMap(diagramKey, nextMap)
    },
    [diagramKey, applyDiagramMap]
  )

  const setAllOverrides = useCallback(
    (updater) => {
      const prevAll = allRef.current
      const nextAll = typeof updater === 'function' ? updater(prevAll) : updater
      const keys = new Set([...Object.keys(prevAll), ...Object.keys(nextAll)])
      for (const key of keys) {
        applyDiagramMap(key, nextAll[key] || {})
      }
    },
    [applyDiagramMap]
  )

  const resetDiagram = useCallback(() => {
    applyDiagramMap(diagramKey, {})
  }, [diagramKey, applyDiagramMap])

  return {
    overrides: all[diagramKey] || {},
    setOverrides,
    resetDiagram,
    allOverrides: all,
    setAllOverrides,
    loaded,
  }
}
