import { useState } from 'react'
import './LoginModal.css'

export default function LoginModal({ onSignIn, onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const authError = await onSignIn(email, password)
    setSubmitting(false)
    if (authError) {
      setError('Correo o contraseña incorrectos.')
      return
    }
    onClose()
  }

  return (
    <div className="login-modal__backdrop" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="login-modal__header">
          <h3>Iniciar sesión</h3>
          <button type="button" className="login-modal__close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <p className="login-modal__hint">
          Solo los guías con cuenta pueden activar el modo edición. Cualquiera con el link puede ver el
          escenario sin iniciar sesión.
        </p>
        <form onSubmit={handleSubmit} className="login-modal__form">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="login-modal__error">{error}</p>}
          <button type="submit" className="login-modal__submit" disabled={submitting}>
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
