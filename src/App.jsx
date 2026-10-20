import { useEffect, useState } from 'react'
import PublicSite from './public/PublicSite.jsx'
import AdminApp from './admin/AdminApp.jsx'

// El panel se abre con ?view=admin o con #admin
const esAdmin = () => new URLSearchParams(window.location.search).get('view') === 'admin' || window.location.hash === '#admin'

export default function App() {
  const [admin, setAdmin] = useState(esAdmin)
  useEffect(() => {
    // Solo volver arriba al entrar o salir del panel; los enlaces a secciones (#servicios, #equipo…) se respetan
    const h = () => {
      const nuevo = esAdmin()
      setAdmin((prev) => {
        if (prev !== nuevo) window.scrollTo(0, 0)
        return nuevo
      })
    }
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])
  return admin ? <AdminApp /> : <PublicSite />
}
