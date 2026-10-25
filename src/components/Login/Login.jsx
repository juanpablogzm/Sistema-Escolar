import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiBookOpen, FiUserPlus } from 'react-icons/fi'
import './Login.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/app')
    } catch (err) {
      let message = 'Error al iniciar sesión'
      if (err.code === 'auth/user-not-found') {
        message = 'No existe una cuenta con este correo.'
      } else if (err.code === 'auth/wrong-password') {
        message = 'La contraseña es incorrecta.'
      } else if (err.code === 'auth/invalid-email') {
        message = 'El formato del correo no es válido.'
      } else if (err.code === 'auth/user-disabled') {
        message = 'Esta cuenta ha sido deshabilitada.'
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Demasiados intentos. Intenta más tarde.'
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
          <p>Sistema de Gestión de Clases</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

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
                placeholder="Tu contraseña"
                required
                className="form-control login-input"
                disabled={loading}
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
              'Iniciar Sesión'
            )}
          </button>

          <div className="login-footer">
            <span className="login-divider" />
            <p className="login-disclaimer">
              Solo los profesores autorizados pueden acceder.
            </p>
            <p className="login-disclaimer" style={{ marginTop: '12px' }}>
              ¿No tienes cuenta? <Link to="/register" className="text-decoration-none">
                <FiUserPlus /> Registro
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login