import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import baseRoster from '../data/roster'

function mapRow(row) {
  return {
    id: row.id,
    name: row.name,
    group: row.group_name,
    voice: row.voice,
    since: row.since,
    note: row.note,
    onLeave: row.on_leave,
  }
}

function toRow(person, sortOrder) {
  return {
    id: person.id,
    name: person.name,
    group_name: person.group || 'B1',
    voice: person.voice ?? null,
    since: person.since ?? null,
    note: person.note ?? null,
    on_leave: !!person.onLeave,
    sort_order: sortOrder,
  }
}

function nextNumericId(roster) {
  let max = 0
  for (const p of roster) {
    const n = Number(p.id)
    if (Number.isFinite(n) && n > max) max = n
  }
  return String(max + 1)
}

export default function useRemoteRoster() {
  const [roster, setRosterState] = useState([])
  const [loaded, setLoaded] = useState(false)
  const rosterRef = useRef(roster)
  rosterRef.current = roster

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('roster').select('*').order('sort_order', { ascending: true })
    if (error) {
      // eslint-disable-next-line no-console
      console.error('No se pudo cargar el listado de integrantes:', error.message)
      setLoaded(true)
      return
    }
    setRosterState(data.map(mapRow))
    setLoaded(true)
  }, [])

  useEffect(() => {
    let active = true
    load()

    // Ante cualquier cambio se vuelve a pedir la lista completa ordenada —
    // es una tabla chica (~140 filas) y así no hay que reconstruir a mano
    // el orden ni parchear inserciones/borrados uno por uno.
    const channel = supabase
      .channel('roster-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'roster' }, () => {
        if (active) load()
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [load])

  const addPerson = useCallback(async ({ name, voice, group }) => {
    const trimmed = name.trim()
    if (!trimmed) return null
    const current = rosterRef.current
    const newId = nextNumericId(current)
    const sortOrder = current.length
      ? Math.max(...current.map((_, i) => i)) + 1
      : 0
    const row = toRow({ id: newId, name: trimmed, voice, group: group || 'B1' }, sortOrder)
    const { error } = await supabase.from('roster').insert(row)
    if (error) console.error('No se pudo agregar el integrante:', error.message) // eslint-disable-line no-console
    return newId
  }, [])

  const removePerson = useCallback(async (id) => {
    const { error } = await supabase.from('roster').delete().eq('id', id)
    if (error) console.error('No se pudo quitar el integrante:', error.message) // eslint-disable-line no-console
  }, [])

  const resetRoster = useCallback(async () => {
    const { error: deleteError } = await supabase.from('roster').delete().neq('id', '__never__')
    if (deleteError) {
      console.error('No se pudo restablecer el listado:', deleteError.message) // eslint-disable-line no-console
      return
    }
    const rows = baseRoster.map((p, i) => toRow(p, i))
    const { error: insertError } = await supabase.from('roster').insert(rows)
    if (insertError) console.error('No se pudo restablecer el listado:', insertError.message) // eslint-disable-line no-console
  }, [])

  const replaceRoster = useCallback(async (nextRoster) => {
    if (!Array.isArray(nextRoster)) return
    const { error: deleteError } = await supabase.from('roster').delete().neq('id', '__never__')
    if (deleteError) {
      console.error('No se pudo importar el listado:', deleteError.message) // eslint-disable-line no-console
      return
    }
    const rows = nextRoster.map((p, i) => toRow(p, i))
    const { error: insertError } = await supabase.from('roster').insert(rows)
    if (insertError) console.error('No se pudo importar el listado:', insertError.message) // eslint-disable-line no-console
  }, [])

  return { roster, addPerson, removePerson, resetRoster, replaceRoster, loaded }
}
