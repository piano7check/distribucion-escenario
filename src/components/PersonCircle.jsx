import { voiceFillColor, readableTextColor } from '../lib/voices'
import { displayId } from '../lib/format'
import './PersonCircle.css'

const RADIUS = 12.5
const EMPTY_LABEL_COLOR = '#4a5568'

export default function PersonCircle({ slot, person, editable, onSelect }) {
  const displayVoice = person ? person.voice : slot.voice
  const fill = voiceFillColor(displayVoice)
  const textColor = readableTextColor(fill)
  const isEmpty = !person

  return (
    <g
      className={`person-circle person-circle--clickable${
        editable ? ' person-circle--editable' : ''
      }${isEmpty ? ' person-circle--empty' : ''}`}
      transform={`translate(${slot.x}, ${slot.y})`}
      onClick={() => onSelect(slot)}
      tabIndex={0}
      role="button"
      aria-label={
        person
          ? `${person.name} — ${person.voice} #${displayId(person)}`
          : `Posición vacía (${slot.voice})`
      }
    >
      {isEmpty ? (
        <circle r={RADIUS} fill="#ffffff" stroke={fill} strokeWidth="1.4" strokeDasharray="2.6 2" />
      ) : (
        <circle r={RADIUS} fill={fill} stroke="#ffffff" strokeWidth="1" />
      )}

      {isEmpty ? (
        <text textAnchor="middle" dominantBaseline="middle" fontSize="7.5" fontWeight="600" fill={EMPTY_LABEL_COLOR}>
          {slot.voice}
        </text>
      ) : (
        <>
          <text textAnchor="middle" y="-2.6" fontSize="6.6" fontWeight="700" fill={textColor}>
            {person.voice}
          </text>
          <text textAnchor="middle" y="6.6" fontSize="6.6" fontWeight="500" fill={textColor}>
            #{displayId(person)}
          </text>
        </>
      )}
    </g>
  )
}

export { RADIUS }
