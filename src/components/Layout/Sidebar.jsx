import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  BsSpeedometer2,
  BsBuildings,
  BsBook,
  BsPeople,
  BsCalendarCheck,
  BsClipboardCheck,
  BsBarChartLine,
  BsShuffle,
  BsBoxArrowRight,
  BsGear
} from 'react-icons/bs'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { path: '/', icon: BsSpeedometer2, label: 'Dashboard' },
  { path: '/universidades', icon: BsBuildings, label: 'Universidades' },
  { path: '/clases', icon: BsBook, label: 'Clases' },
  { path: '/alumnos', icon: BsPeople, label: 'Alumnos' },
  { path: '/asistencia', icon: BsCalendarCheck, label: 'Asistencia' },
  { path: '/rubricas', icon: BsClipboardCheck, label: 'Períodos de evaluación' },
  { path: '/calificaciones', icon: BsBarChartLine, label: 'Calificaciones' },
  { path: '/actividades', icon: BsShuffle, label: 'Actividades' }
]

const adminNavItems = [
  { path: '/usuarios', icon: BsGear, label: 'Usuarios' }
]

const Sidebar = ({ isOpen, onToggle }) => {
  const { user, logout, isAdmin } = useAuth()
  const handleLogout = () => logout()

  const getInitials = (email) => {
    if (!email) return 'P'
    const parts = email.split('@')[0].split('.')
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onToggle} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">🌸</div>
          <div className="brand-text">
            <h5 className="mb-0">ClassRoom</h5>
            <small>Gestión de Clases</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              end={item.path === '/'}
              onClick={() => window.innerWidth < 992 && onToggle()}
            >
              <item.icon className="sidebar-icon" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          {isAdmin && adminNavItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => window.innerWidth < 992 && onToggle()}
            >
              <item.icon className="sidebar-icon" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {user ? getInitials(user.email) : 'P'}
            </div>
            <div className="user-info">
              <span className="user-name">
                {user ? user.email.split('@')[0] : 'Paola'}
              </span>
              <span className="user-role">
                {isAdmin ? 'Administrador' : 'Profesora'}
              </span>
            </div>
          </div>
          <button
            className="btn btn-link w-100 text-start p-2 sidebar-link"
            onClick={handleLogout}
            style={{ color: 'rgba(255,255,255,0.7)', gap: '12px' }}
          >
            <BsBoxArrowRight className="sidebar-icon" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
