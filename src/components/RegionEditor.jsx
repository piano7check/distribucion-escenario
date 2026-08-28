import { VOICE_ORDER, VOICE_LABELS, voiceFillColor } from '../lib/voices'
import { displayId } from '../lib/format'
import './RegionEditor.css'

export default function RegionEditor({ slot, person, editable, onChangeSlotVoice, onClose }) {
  return (
    <div className="region-editor__backdrop" onClick={onClose}>
      <div className="region-editor" onClick={(e) => e.stopPropagation()}>
        <div className="region-editor__header">
          <div>
            <h3>Posición: {slot.voice}</h3>
            <p className="region-editor__subtitle">{VOICE_LABELS[slot.voice] || slot.voice}</p>
          </div>
          <button type="button" className="region-editor__close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {person ? (
          <div className="region-editor__current">
            <span className="region-editor__current-num">#{displayId(person)}</span>
            <div className="region-editor__current-info">
              <p className="region-editor__current-name">{person.name}</p>
              <p className="region-editor__current-meta">{VOICE_LABELS[person.voice] || person.voice}</p>
            </div>
          </div>
        ) : (
          <p className="region-editor__vacant">Posición vacía.</p>
        )}

        {editable && (
          <>
            <p className="region-editor__label">Elegir región/voz para esta posición</p>

            <div className="region-editor__swatches">
              {VOICE_ORDER.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`region-editor__swatch${v === slot.voice ? ' region-editor__swatch--selected' : ''}`}
                  onClick={() => onChangeSlotVoice(v)}
                  disabled={v === slot.voice}
                >
                  <span className="region-editor__swatch-dot" style={{ background: voiceFillColor(v) }} />
                  {VOICE_LABELS[v] || v}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
