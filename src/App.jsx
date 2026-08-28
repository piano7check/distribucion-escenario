import { useMemo, useRef, useState } from 'react'
import StageDiagram from './components/StageDiagram'
import LoginModal from './components/LoginModal'
import useAuth from './hooks/useAuth'
import useRemoteOverrides from './hooks/useRemoteOverrides'
import useRemoteRoster from './hooks/useRemoteRoster'
import stageDiagrams from './data/slots'
import {
  computeDefaultAssignment,
  computeEffectiveAssignment,
  applySlotVoices,
  resetSlot,
} from './lib/assignment'
import { buildPools } from './lib/rosterIndex'
import './App.css'

const ESCENARIOS = [
  { id: 'parte1_3', label: '1ª y 3ª Parte', title: 'Concierto de Primavera 2026 — Primera / Tercera Parte' },
  { id: 'parte2', diagramKey: 'segunda', label: '2ª Parte', title: 'Concierto de Primavera 2026 — Segunda Parte' },
  { id: 'parte4', diagramKey: 'cuarta', label: '4ª Parte', title: 'Concierto de Primavera 2026 — Cuarta Parte (Ambos Coros)' },
]

function App() {
  const [activeId, setActiveId] = useState(ESCENARIOS[0].id)
  const [editable, setEditable] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const active = ESCENARIOS.find((e) => e.id === activeId)
  const diagramKey = active.diagramKey || active.id

  const { user, signIn, signOut } = useAuth()
  // Modo edición real: exige sesión iniciada, sin importar lo que diga el
  // checkbox local (por si la sesión expira mientras estaba activado).
  const editableEffective = editable && !!user

  const { overrides, setOverrides, resetDiagram, allOverrides, setAllOverrides } = useRemoteOverrides(
    diagramKey,
    'position_overrides'
  )
  const {
    overrides: slotVoices,
    setOverrides: setSlotVoices,
    resetDiagram: resetSlotVoicesDiagram,
    allOverrides: allSlotVoices,
    setAllOverrides: setAllSlotVoices,
  } = useRemoteOverrides(diagramKey, 'slot_voice_overrides')
  const { roster, addPerson, removePerson, resetRoster, replaceRoster } = useRemoteRoster()
  const pools = useMemo(() => buildPools(roster), [roster])
  const fileInputRef = useRef(null)

  const stats = useMemo(() => {
    const diagram = applySlotVoices(stageDiagrams[diagramKey], slotVoices)
    const defaultAssignment = computeDefaultAssignment(diagram, pools)
    const effective = computeEffectiveAssignment(defaultAssignment, overrides)
    const total = diagram.slots.length
    const filled = diagram.slots.filter((s) => effective[s.id]).length
    return { total, filled }
  }, [diagramKey, overrides, slotVoices, pools])

  const hasOverrides = Object.keys(overrides).length > 0 || Object.keys(slotVoices).length > 0

  const handleResetDiagram = () => {
    resetDiagram()
    resetSlotVoicesDiagram()
  }

  const handleExport = () => {
    const payload = { positions: allOverrides, slotVoices: allSlotVoices, roster }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'distribucion-escenario.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // Quita a una persona del listado general por completo (no solo de esta
  // sesión). A diferencia de "marcar ausente" no hay que vaciar su posición:
  // al desaparecer del roster, el cálculo automático ya no la coloca en
  // ningún lado. Solo hay que deshacer asignaciones MANUALES que apunten a
  // ella para que esas posiciones vuelvan a calcularse en automático.
  const handleRemovePerson = (personId) => {
    setAllOverrides((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(stageDiagrams)) {
        const diagramOverrides = prev[key] || {}
        for (const slotId of Object.keys(diagramOverrides)) {
          if (diagramOverrides[slotId] === personId) {
            next[key] = resetSlot(next[key] || diagramOverrides, slotId)
          }
        }
      }
      return next
    })
    removePerson(personId)
  }

  // El director cambia a qué región/voz pertenece una posición del escenario
  // (no la voz de una persona). Como esa posición pasa a esperar otro tipo de
  // voz, cualquier asignación manual que tuviera deja de tener sentido.
  const handleChangeSlotVoice = (slotId, newVoice) => {
    setOverrides((prev) => resetSlot(prev, slotId))
    setSlotVoices((prev) => ({ ...prev, [slotId]: newVoice }))
  }

  const handleImportFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        if (parsed && (parsed.positions || parsed.slotVoices || parsed.roster)) {
          setAllOverrides(parsed.positions || {})
          setAllSlotVoices(parsed.slotVoices || {})
          if (parsed.roster) replaceRoster(parsed.roster)
        } else {
          // formato antiguo: solo posiciones
          setAllOverrides(parsed)
        }
      } catch {
        window.alert('El archivo no es un JSON válido de distribución de escenario.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Coro Municipal Cochabamba</h1>
        <p>Distribución de escenario — Concierto de Primavera 2026</p>
      </header>

      <nav className="app__tabs" role="tablist" aria-label="Partes del concierto">
        {ESCENARIOS.map((e) => (
          <button
            key={e.id}
            role="tab"
            aria-selected={e.id === activeId}
            className={`app__tab${e.id === activeId ? ' app__tab--active' : ''}`}
            onClick={() => setActiveId(e.id)}
          >
            {e.label}
          </button>
        ))}
      </nav>

      <div className="app__edit-bar">
        {user ? (
          <>
            <label className="app__edit-toggle">
              <input type="checkbox" checked={editable} onChange={(e) => setEditable(e.target.checked)} />
              Modo edición (guías)
            </label>
            <span className="app__user">{user.email}</span>
            <button type="button" className="app__signout" onClick={signOut}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <button type="button" className="app__signin" onClick={() => setShowLogin(true)}>
            Iniciar sesión para editar
          </button>
        )}

        <span className="app__stats">
          {stats.filled} / {stats.total} posiciones asignadas
        </span>

        {editableEffective && (
          <div className="app__edit-actions">
            <button type="button" onClick={handleResetDiagram} disabled={!hasOverrides}>
              Restablecer esta parte
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('¿Restablecer la lista de integrantes a la original de Componentes.pdf? Se perderán los agregados/eliminados.')) {
                  resetRoster()
                }
              }}
            >
              Restablecer lista de integrantes
            </button>
            <button type="button" onClick={handleExport}>
              Exportar cambios
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()}>
              Importar cambios
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
          </div>
        )}
      </div>

      {showLogin && <LoginModal onSignIn={signIn} onClose={() => setShowLogin(false)} />}

      <main className="app__content">
        <h2 className="app__panel-title">{active.title}</h2>
        <StageDiagram
          diagramKey={diagramKey}
          editable={editableEffective}
          overrides={overrides}
          setOverrides={setOverrides}
          slotVoices={slotVoices}
          roster={roster}
          pools={pools}
          onAddPerson={addPerson}
          onRemovePerson={handleRemovePerson}
          onChangeSlotVoice={handleChangeSlotVoice}
        />
      </main>
    </div>
  )
}

export default App
