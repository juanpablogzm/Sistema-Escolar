import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Hace que la interfaz se pueda volver a abrir sin red después de la primera
// visita. Firestore se encarga por separado de los datos y la cola de cambios.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        // La primera visita ya descargó estos archivos; los guardamos también
        // para que el siguiente arranque no dependa de la red.
        const urls = performance.getEntriesByType('resource')
          .map((entry) => entry.name)
          .filter((url) => new URL(url).origin === window.location.origin)
        registration.active?.postMessage({ type: 'CACHE_URLS', urls })
      })
      .catch((err) => console.warn('No se pudo activar el modo sin conexión:', err))
  })
}

// Limpia el input automáticamente cuando el valor es "0" y se hace foco (solo type="number")
document.addEventListener('focusin', (e) => {
  const el = e.target
  if (el.tagName === 'INPUT' && el.type === 'number' && el.value.trim() === '0') {
    el.value = ''
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
