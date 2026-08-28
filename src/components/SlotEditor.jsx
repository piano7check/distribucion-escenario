import { useMemo, useState } from 'react'
import { VOICE_FAMILY, VOICE_LABELS } from '../lib/voices'
import { displayId } from '../lib/format'
import './SlotEditor.css'

function relevantVoices(slotVoice) {
  if (VOICE_FAMILY[slotVoice]) return VOICE_FAMILY[slotVoice]
  return [slotVoice]
}

export default function SlotEditor({
  slot,
  roster,
  effectiveAssignment,
  hasOverride,
  editable,
  onAssign,
  onClear,
  onResetSlot,
  onRemovePerson,
  onClose,
}) {
  const [query, setQuery] = useState('')

  const occupiedBy = useMemo(() => {
    const map = {}
    for (const [sId, pId] of Object.entries(effectiveAssignment)) {
      if (pId) map[pId] = sId
    }
    return map
  }, [effectiveAssignment])

  const currentPersonId = effectiveAssignment[slot.id] || null
  const currentPerson = currentPersonId ? roster.find((p) => p.id === currentPersonId) : null
  const wanted = relevantVoices(slot.voice)

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return roster
      .filter((p) => !p.onLeave)
      .filter((p) => p.voice && wanted.includes(p.voice))
      .filter((p) => {
        if (!q) return true
        return p.name.toLowerCase().includes(q) || String(p.id).toLowerCase().includes(q)
      })
      .sort((a, b) => {
        const aHere = a.id === currentPersonId ? -1 : 0
        const bHere = b.id === currentPersonId ? -1 : 0
        if (aHere !== bHere) return aHere - bHere
        return a.name.localeCompare(b.name, 'es')
      })
  }, [roster, query, wanted, currentPersonId])

  return (
    <div className="slot-editor__backdrop" onClick={onClose}>
      <div className="slot-editor" onClick={(e) => e.stopPropagation()}>
        <div className="slot-editor__header">
          <div>
            <h3>Posición: {slot.voice}</h3>
            <p className="slot-editor__subtitle">
              {VOICE_LABELS[slot.voice] || slot.voice}
              {wanted.length > 1 ? ` (${wanted.join(' / ')})` : ''}
            </p>
          </div>
          <button type="button" className="slot-editor__close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {currentPerson ? (
          <div className="slot-editor__current">
            <span className="slot-editor__current-num">#{displayId(currentPerson)}</span>
            <div className="slot-editor__current-info">
              <p className="slot-editor__current-name">{currentPerson.name}</p>
              <p className="slot-editor__current-meta">
                {VOICE_LABELS[currentPerson.voice] || currentPerson.voice}
                {currentPerson.note ? ` · ${currentPerson.note}` : ''}
              </p>
            </div>
          </div>
        ) : (
          <p className="slot-editor__vacant">Posición vacía.</p>
        )}

        {editable && (
          <>
            <input
              className="slot-editor__search"
              type="text"
              placeholder="Buscar por nombre o número…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />

            {query.trim() && (
              <ul className="slot-editor__list">
                {candidates.length === 0 && <li className="slot-editor__empty">Sin resultados.</li>}
                {candidates.map((p) => {
                  const isCurrent = p.id === currentPersonId
                  const occupiedElsewhere = occupiedBy[p.id] && occupiedBy[p.id] !== slot.id
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        className={`slot-editor__candidate${isCurrent ? ' slot-editor__candidate--current' : ''}`}
                        onClick={() => onAssign(p.id)}
                      >
                        <span className="slot-editor__candidate-num">#{displayId(p)}</span>
                        <span className="slot-editor__candidate-name">{p.name}</span>
                        <span className="slot-editor__candidate-voice">{p.voice}</span>
                        {occupiedElsewhere && <span className="slot-editor__badge">intercambiar</span>}
                        {isCurrent && <span className="slot-editor__badge slot-editor__badge--current">aquí</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="slot-editor__actions">
              <button type="button" className="slot-editor__action" onClick={onClear} disabled={!currentPersonId}>
                Vaciar posición
              </button>
              <button type="button" className="slot-editor__action" onClick={onResetSlot} disabled={!hasOverride}>
                Restaurar automático
              </button>
            </div>

            {currentPerson && (
              <>
                <button
                  type="button"
                  className="slot-editor__remove"
                  onClick={() => {
                    if (
                      window.confirm(
                        `¿Eliminar a ${currentPerson.name} del listado general de integrantes? Esta acción no borra su historial, pero ya no aparecerá disponible para asignar.`
                      )
                    ) {
                      onRemovePerson(currentPerson.id)
                    }
                  }}
                >
                  Eliminar del listado general
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
