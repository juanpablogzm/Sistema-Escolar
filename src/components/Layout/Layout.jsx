import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { BsList, BsBell, BsSun, BsMoon, BsCloudCheck, BsCloudArrowUp, BsCloudSlash, BsArrowRepeat } from 'react-icons/bs'
import { useApp } from '../../context/AppContext'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { loading, theme, toggleTheme, syncStatus } = useApp()

  const syncInfo = {
    synced: { label: 'Sincronizado', title: 'Los cambios están guardados en la nube', Icon: BsCloudCheck },
    pending: { label: 'Guardando cambios', title: 'Los cambios locales se enviarán en cuanto haya conexión', Icon: BsCloudArrowUp },
    offline: { label: 'Sin conexión', title: 'Puedes seguir trabajando; los cambios se guardan en este dispositivo', Icon: BsCloudSlash },
    local: { label: 'Modo local', title: 'Mostrando la copia guardada mientras se recupera la conexión', Icon: BsArrowRepeat }
  }[syncStatus]

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="text-muted">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="main-content">
        <header className="top-bar">
          <button
            className="btn btn-link sidebar-toggle d-lg-none"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <BsList size={24} />
          </button>
          <div style={{ flex: 1 }} />
          <div className="top-bar-actions">
            <div className={`sync-status sync-status-${syncStatus}`} title={syncInfo.title} aria-live="polite">
              <syncInfo.Icon size={17} />
              <span>{syncInfo.label}</span>
            </div>
            <button
              className="btn btn-link notification-btn"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            >
              {theme === 'light' ? <BsMoon size={20} /> : <BsSun size={20} />}
            </button>
            <button className="btn btn-link notification-btn">
              <BsBell size={20} />
            </button>
          </div>
        </header>
        <div className="content-area">
          <Outlet />
        </div>
        <footer className="app-footer">
          <span>ClassRoom</span>
          <span className="app-footer-separator" aria-hidden="true">•</span>
          <span>Versión 1</span>
        </footer>
      </main>
    </div>
  )
}

export default Layout
