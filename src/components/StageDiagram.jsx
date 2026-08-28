import { useMemo, useState } from 'react'
import ZoomPane from './ZoomPane'
import PersonCircle from './PersonCircle'
import SlotEditor from './SlotEditor'
import RegionEditor from './RegionEditor'
import VoicePanel from './VoicePanel'
import './StageDiagram.css'
import stageDiagrams from '../data/slots'
import {
  computeDefaultAssignment,
  computeEffectiveAssignment,
  applySlotVoices,
  assignPersonToSlot,
  clearSlot,
  resetSlot,
} from '../lib/assignment'
import { buildRosterById } from '../lib/rosterIndex'

import bgParte13 from '../assets/parte1-3.svg?raw'
import bgParte2 from '../assets/parte2.svg?raw'
import bgParte4 from '../assets/parte4.svg?raw'

const BACKGROUNDS = { parte1_3: bgParte13, segunda: bgParte2, cuarta: bgParte4 }

function innerSvg(raw) {
  return raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
}

export default function StageDiagram({
  diagramKey,
  editable,
  overrides,
  setOverrides,
  slotVoices,
  roster,
  pools,
  onAddPerson,
  onRemovePerson,
  onChangeSlotVoice,
}) {
  const baseDiagram = stageDiagrams[diagramKey]
  const diagram = useMemo(() => applySlotVoices(baseDiagram, slotVoices), [baseDiagram, slotVoices])
  const bgInner = useMemo(() => innerSvg(BACKGROUNDS[diagramKey]), [diagramKey])
  const rosterById = useMemo(() => buildRosterById(roster), [roster])
  const defaultAssignment = useMemo(() => computeDefaultAssignment(diagram, pools), [diagram, pools])
  const effective = useMemo(
    () => computeEffectiveAssignment(defaultAssignment, overrides),
    [defaultAssignment, overrides]
  )
  // Dos selecciones independientes: tocar un círculo del escenario solo
  // permite cambiar la región/voz de esa posición; tocar una fila del panel
  // "Regiones de voces" abre la asignación de personas (buscar, reemplazar,
  // vaciar, eliminar).
  const [regionSlot, setRegionSlot] = useState(null)
  const [personSlot, setPersonSlot] = useState(null)

  const handleAssign = (personId) => {
    setOverrides((prev) => assignPersonToSlot(defaultAssignment, prev, personSlot.id, personId))
    setPersonSlot(null)
  }
  const handleClear = () => {
    setOverrides((prev) => clearSlot(prev, personSlot.id))
    setPersonSlot(null)
  }
  const handleResetSlot = () => {
    setOverrides((prev) => resetSlot(prev, personSlot.id))
    setPersonSlot(null)
  }
  const handleRemovePerson = (personId) => {
    onRemovePerson(personId)
    setPersonSlot(null)
  }
  const handleChangeSlotVoice = (newVoice) => {
    onChangeSlotVoice(regionSlot.id, newVoice)
    setRegionSlot(null)
  }
  return (
    <>
      <div className="stage-diagram__layout">
        <div className="stage-diagram__main">
          <ZoomPane resetKey={diagramKey} aspectRatio={baseDiagram.width / baseDiagram.height}>
            <svg viewBox={baseDiagram.viewBox} xmlns="http://www.w3.org/2000/svg">
              <g dangerouslySetInnerHTML={{ __html: bgInner }} />
              <g>
                {diagram.slots.map((slot) => (
                  <PersonCircle
                    key={slot.id}
                    slot={slot}
                    person={effective[slot.id] ? rosterById[effective[slot.id]] : null}
                    editable={editable}
                    onSelect={setRegionSlot}
                  />
                ))}
              </g>
            </svg>
          </ZoomPane>
        </div>

        <VoicePanel
          diagram={diagram}
          roster={roster}
          effective={effective}
          editable={editable}
          selectedSlotId={personSlot?.id}
          onSelectSlot={setPersonSlot}
          onAddPerson={onAddPerson}
          onRemovePerson={handleRemovePerson}
        />
      </div>

      {regionSlot && (
        <RegionEditor
          slot={regionSlot}
          person={effective[regionSlot.id] ? rosterById[effective[regionSlot.id]] : null}
          editable={editable}
          onChangeSlotVoice={handleChangeSlotVoice}
          onClose={() => setRegionSlot(null)}
        />
      )}

      {personSlot && (
        <SlotEditor
          slot={personSlot}
          roster={roster}
          effectiveAssignment={effective}
          hasOverride={overrides[personSlot.id] !== undefined}
          editable={editable}
          onAssign={handleAssign}
          onClear={handleClear}
          onResetSlot={handleResetSlot}
          onRemovePerson={handleRemovePerson}
          onClose={() => setPersonSlot(null)}
        />
      )}
    </>
  )
}
