import { useMemo, useState } from 'react'
import { VOICE_LABELS, VOICE_FAMILY, voiceFillColor } from '../lib/voices'
import { displayId } from '../lib/format'
import './VoicePanel.css'

const GROUP_ORDER = ['S1', 'S2', 'S', 'Mz', 'Ca', 'C', 'T1', 'T2', 'Br', 'Bj']

function groupSlots(slots) {
  const groups = new Map()
  for (const slot of slots) {
    if (!groups.has(slot.voice)) groups.set(slot.voice, [])
    groups.get(slot.voice).push(slot)
  }
  return new Map(
    Array.from(groups.entries()).sort((a, b) => GROUP_ORDER.indexOf(a[0]) - GROUP_ORDER.indexOf(b[0]))
  )
}

function AddPersonForm({ voice, onAdd, onCancel }) {
  const [name, setName] = useState('')
  const options = VOICE_FAMILY[voice] || [voice]
  const [subVoice, setSubVoice] = useState(options[0])

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ name, voice: subVoice })
    setName('')
  }

  return (
    <form className="voice-panel__add-form" onSubmit={submit}>
      <input
        type="text"
        placeholder="Nombre completo…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      {options.length > 1 && (
        <select value={subVoice} onChange={(e) => setSubVoice(e.target.value)}>
          {options.map((v) => (
            <option key={v} value={v}>
              {VOICE_LABELS[v] || v}
            </option>
          ))}
        </select>
      )}
      <div className="voice-panel__add-actions">
        <button type="submit" className="voice-panel__add-submit" disabled={!name.trim()}>
          Agregar
        </button>
        <button type="button" className="voice-panel__add-cancel" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default function VoicePanel({
  diagram,
  roster,
  effective,
  editable,
  selectedSlotId,
  onSelectSlot,
  onAddPerson,
  onRemovePerson,
}) {
  const [query, setQuery] = useState('')
  const [expandedVoice, setExpandedVoice] = useState(null)
  const [addingVoice, setAddingVoice] = useState(null)

  const groups = useMemo(() => groupSlots(diagram.slots), [diagram])
  const rosterById = useMemo(() => Object.fromEntries(roster.map((p) => [p.id, p])), [roster])

  const q = query.trim().toLowerCase()
  // Al buscar se muestran todos los grupos con coincidencias, sin importar
  // cuál esté expandido; sin búsqueda, solo una región abierta a la vez.
  const isSearching = q.length > 0

  const toggle = (voice) => {
    setExpandedVoice((prev) => (prev === voice ? null : voice))
    setAddingVoice(null)
  }

  const handleRemoveClick = (person) => {
    if (window.confirm(`¿Quitar a ${person.name} del listado general de integrantes?`)) {
      onRemovePerson(person.id)
    }
  }

  return (
    <aside className="voice-panel">
      <div className="voice-panel__header">
        <h3>Regiones de voces</h3>
        <p className="voice-panel__hint">
          {editable
            ? 'Toca una posición para reasignarla, o agrega/quita integrantes de la región.'
            : 'Toca una posición para ver quién está.'}
        </p>
      </div>

      <input
        className="voice-panel__search"
        type="text"
        placeholder="Buscar nombre o número…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="voice-panel__groups">
        {Array.from(groups.entries()).map(([voice, slots]) => {
          const filled = slots.filter((s) => effective[s.id]).length
          const isCollapsed = isSearching ? false : expandedVoice !== voice
          const rows = q
            ? slots.filter((s) => {
                const p = effective[s.id] ? rosterById[effective[s.id]] : null
                if (!p) return false
                return p.name.toLowerCase().includes(q) || String(p.id).toLowerCase().includes(q)
              })
            : slots

          if (q && rows.length === 0) return null

          return (
            <div key={voice} className="voice-panel__group">
              <button
                type="button"
                className="voice-panel__group-header"
                onClick={() => toggle(voice)}
                style={{ '--voice-color': voiceFillColor(voice) }}
              >
                <span className="voice-panel__group-dot" />
                <span className="voice-panel__group-title">{VOICE_LABELS[voice] || voice}</span>
                <span className="voice-panel__group-count">
                  {filled}/{slots.length}
                </span>
                <span className={`voice-panel__chevron${isCollapsed ? ' voice-panel__chevron--collapsed' : ''}`}>
                  ▾
                </span>
              </button>

              {!isCollapsed && (
                <>
                  <ul className="voice-panel__rows">
                    {rows.map((slot) => {
                      const person = effective[slot.id] ? rosterById[effective[slot.id]] : null
                      const isSelected = slot.id === selectedSlotId

                      return (
                        <li key={slot.id}>
                          <button
                            type="button"
                            className={`voice-panel__row${person ? '' : ' voice-panel__row--empty'}${
                              isSelected ? ' voice-panel__row--selected' : ''
                            }`}
                            onClick={() => onSelectSlot(slot)}
                          >
                            {person ? (
                              <>
                                <span className="voice-panel__row-num">#{displayId(person)}</span>
                                <span className="voice-panel__row-name">{person.name}</span>
                              </>
                            ) : (
                              <span className="voice-panel__row-name voice-panel__row-name--empty">
                                Posición vacía
                              </span>
                            )}
                          </button>
                          {editable && person && (
                            <button
                              type="button"
                              className="voice-panel__row-remove"
                              title={`Quitar a ${person.name} del listado`}
                              aria-label={`Quitar a ${person.name} del listado`}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveClick(person)
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </li>
                      )
                    })}
                  </ul>

                  {editable &&
                    (addingVoice === voice ? (
                      <AddPersonForm
                        voice={voice}
                        onAdd={({ name, voice: subVoice }) => {
                          onAddPerson({ name, voice: subVoice })
                        }}
                        onCancel={() => setAddingVoice(null)}
                      />
                    ) : (
                      <button
                        type="button"
                        className="voice-panel__add-toggle"
                        onClick={() => setAddingVoice(voice)}
                      >
                        + Agregar integrante
                      </button>
                    ))}
                </>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
