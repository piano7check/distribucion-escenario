import { VOICE_ORDER } from './voices'

// slotVoices: { [slotId]: voiceCode } — el director reclasificó esa posición
// del escenario a otra región. Devuelve el diagrama con esas voces aplicadas,
// sin tocar la data original.
export function applySlotVoices(diagram, slotVoices) {
  if (!slotVoices || Object.keys(slotVoices).length === 0) return diagram
  return {
    ...diagram,
    slots: diagram.slots.map((slot) =>
      slotVoices[slot.id] ? { ...slot, voice: slotVoices[slot.id] } : slot
    ),
  }
}

export function buildPools(roster) {
  const eligible = roster.filter((p) => p.voice && !p.onLeave)
  const pools = {}
  for (const voice of VOICE_ORDER) {
    pools[voice] = eligible.filter((p) => p.voice === voice)
  }
  pools.S = eligible.filter((p) => p.voice === 'S1' || p.voice === 'S2')
  pools.C = eligible.filter((p) => p.voice === 'Mz' || p.voice === 'Ca')
  return pools
}

// Algunos diagramas mezclan voces exactas (S1, S2, Mz, Ca...) con genéricas
// (S, C) en la misma parte — p. ej. la Cuarta Parte. Como el pool 'S' incluye
// a la misma gente que los pools 'S1'/'S2', hay que llevar un registro global
// de quién ya fue ubicado en este diagrama para no ponerlo en dos posiciones
// a la vez. Los slots se recorren en el orden del diagrama (las filas con
// voces exactas van primero), así que esas se llenan antes que las genéricas.
export function computeDefaultAssignment(diagram, pools) {
  const cursors = {}
  const used = new Set()
  const assignment = {}
  for (const slot of diagram.slots) {
    const pool = pools[slot.voice] || []
    let idx = cursors[slot.voice] || 0
    while (idx < pool.length && used.has(pool[idx].id)) {
      idx++
    }
    if (idx < pool.length) {
      assignment[slot.id] = pool[idx].id
      used.add(pool[idx].id)
      cursors[slot.voice] = idx + 1
    } else {
      assignment[slot.id] = null
      cursors[slot.voice] = idx
    }
  }
  return assignment
}

// overrides: { [slotId]: personId | 'EMPTY' } — undefined means "use default"
export function computeEffectiveAssignment(defaultAssignment, overrides) {
  const effective = {}
  for (const slotId of Object.keys(defaultAssignment)) {
    const override = overrides[slotId]
    if (override === undefined) {
      effective[slotId] = defaultAssignment[slotId]
    } else if (override === 'EMPTY') {
      effective[slotId] = null
    } else {
      effective[slotId] = override
    }
  }
  return effective
}

// Assigns personId to slotId. If personId already occupies another slot in
// this diagram, the two positions are swapped instead of duplicating them.
export function assignPersonToSlot(defaultAssignment, overrides, slotId, personId) {
  const effective = computeEffectiveAssignment(defaultAssignment, overrides)
  const next = { ...overrides }
  const previousOccupant = effective[slotId]
  const personCurrentSlot = Object.keys(effective).find(
    (sid) => sid !== slotId && effective[sid] === personId
  )

  next[slotId] = personId

  if (personCurrentSlot) {
    next[personCurrentSlot] = previousOccupant || 'EMPTY'
  }

  return next
}

export function clearSlot(overrides, slotId) {
  return { ...overrides, [slotId]: 'EMPTY' }
}

export function resetSlot(overrides, slotId) {
  const next = { ...overrides }
  delete next[slotId]
  return next
}
