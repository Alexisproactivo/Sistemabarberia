import { useState } from 'react'
import { BotonConfirmar } from './ui.jsx'
import { useAuth, login, logout, DEMO_USER } from '../lib/auth'
import { modoDemo, reiniciarDemo } from '../lib/db'
import { NEGOCIO } from '../config'
import Dashboard from './Dashboard.jsx'
import Agenda from './Agenda.jsx'
import Caja from './Caja.jsx'
import Clientes from './Clientes.jsx'
import { Servicios, Equipo, Productos } from './Catalogos.jsx'

const TABS = [
  ['dashboard', '📊', 'Resumen', Dashboard],
  ['agenda', '📅', 'Agenda', Agenda],
  ['caja', '💵', 'Caja', Caja],
  ['clientes', '👥', 'Clientes', Clientes],
  ['servicios', '✂️', 'Servicios', Servicios],
  ['equipo', '💇', 'Equipo', Equipo],
  ['productos', '🧴', 'Productos', Productos],
]

export default function AdminApp() {
  const user = useAuth()
  const [tab, setTab] = useState(() => { try { return localStorage.getItem('pelu_tab') || 'dashboard' } catch { return 'dashboard' } })
  const go = (t) => { setTab(t); try { localStorage.setItem('pelu_tab', t) } catch {} }

  if (user === undefined) return <div className="center-screen">Cargando…</div>
  if (!user) return <Login />

  const Comp = TABS.find((t) => t[0] === tab)?.[3] || Dashboard
  return (
    <div className="admin">
      <aside className="side">
        <div className="side-logo">{NEGOCIO.nombre}<small>Panel de gestión</small></div>
        <nav>
          {TABS.map(([id, ic, label]) => (
            <button key={id} className={tab === id ? 'on' : ''} onClick={() => go(id)}><span>{ic}</span>{label}</button>
          ))}
        </nav>
        <div className="side-foot">
          <a href="#inicio">← Ver página web</a>
          {modoDemo && <BotonConfirmar className="link" pregunta="¿Seguro? Toca otra vez" onConfirm={reiniciarDemo}>Reiniciar demo</BotonConfirmar>}
          <small>{user.email}</small>
          <button className="link" onClick={logout}>Cerrar sesión</button>
        </div>
      </aside>
      <header className="m-top">
        <div className="m-logo">{NEGOCIO.nombre}</div>
        <a href="#inicio" className="m-link">Ver web</a>
        <button className="m-link" onClick={logout}>Salir</button>
      </header>
      <main className="main"><Comp go={go} /></main>
    </div>
  )
}

function Login() {
  const [f, setF] = useState(modoDemo ? { ...DEMO_USER } : { email: '', password: '' })
  const [err, setErr] = useState('')
  const [load, setLoad] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setLoad(true)
    try { await login(f.email, f.password) } catch { setErr('Correo o contraseña incorrectos.') }
    setLoad(false)
  }
  return (
    <div className="login-wrap">
      <form className="login card" onSubmit={submit}>
        <h1>{NEGOCIO.nombre}</h1>
        <p className="muted">Acceso al panel de gestión</p>
        <label>
          <span>Correo electrónico</span>
          <input type="email" required placeholder="admin@ejemplo.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </label>
        <label>
          <span>Contraseña</span>
          <input type="password" required placeholder="••••••••" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </label>
        {err && <p className="err">{err}</p>}
        <button className="btn btn-gold block" disabled={load}>{load ? 'Ingresando…' : 'Ingresar'}</button>
        {modoDemo && <p className="hint">Modo demo: {DEMO_USER.email} / {DEMO_USER.password}</p>}
        <a href="#inicio" className="hint">← Volver a la página</a>
      </form>
    </div>
  )
}
