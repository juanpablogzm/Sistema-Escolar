import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FiMail, FiLock, FiEye, FiEyeOff, FiBookOpen, FiUser, FiUserPlus } from 'react-icons/fi'
import './Login.css'

const Register = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    if (!email.trim()) {
      setError('El correo es obligatorio')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Formato de correo inválido')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      const username = name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 20)
      await register(name.trim(), username, email.trim().toLowerCase(), password)
      navigate('/app')
    } catch (err) {
      let message = 'Error al crear la cuenta'
      if (err.code === 'auth/email-already-in-use') {
        message = 'Este correo ya está registrado'
      } else if (err.code === 'auth/invalid-email') {
        message = 'El formato del correo no es válido'
      } else if (err.code === 'auth/weak-password') {
        message = 'La contraseña es muy débil (mínimo 6 caracteres)'
      } else if (err.message) {
        message = err.message
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo"><FiBookOpen aria-hidden="true" /></div>
          <h1>ClassRoom</h1>
          <p>Crear nueva cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Nombre completo</label>
            <div className="input-wrapper">
              <FiUser className="input-icon" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre completo"
                required
                className="form-control login-input"
                disabled={loading}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                className="form-control login-input"
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="form-control login-input"
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                disabled={loading}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span className="login-spinner" />
            ) : (
              'Crear cuenta'
            )}
          </button>

          <div className="login-footer">
            <span className="login-divider" />
            <p className="login-disclaimer">
              ¿Ya tienes cuenta? <Link to="/login" className="text-decoration-none">Inicia sesión</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register