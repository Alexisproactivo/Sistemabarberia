// Capa de datos: usa Firebase Firestore si está configurado, si no, localStorage (modo demo).
import { useEffect, useState } from 'react'
import { firebaseEnabled, fdb } from './firebase'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { seed } from './seed'
import { uid } from './utils'

export const modoDemo = !firebaseEnabled

// ---------- backend local ----------
const KEY = 'peluqueria_db_v1'
const listeners = new Set()
let cache = null
function load() {
  if (cache) return cache
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d) return (cache = d) } catch {}
  cache = seed(); persist(); return cache
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(cache)) } catch {}
  listeners.forEach((f) => f())
}
export function reiniciarDemo() { cache = seed(); persist() }

// ---------- API común ----------
export function subscribe(col, cb) {
  if (firebaseEnabled) {
    return onSnapshot(collection(fdb, col), (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), (err) => { console.error(col, err); cb([]) })
  }
  const run = () => cb([...(load()[col] || [])])
  run(); listeners.add(run)
  return () => listeners.delete(run)
}

export async function add(col, data) {
  if (firebaseEnabled) return (await addDoc(collection(fdb, col), data)).id
  const d = load(); const id = uid()
  d[col] = [...(d[col] || []), { id, ...data }]; persist(); return id
}

export async function update(col, id, data) {
  if (firebaseEnabled) return updateDoc(doc(fdb, col, id), data)
  const d = load(); d[col] = (d[col] || []).map((x) => (x.id === id ? { ...x, ...data } : x)); persist()
}

export async function remove(col, id) {
  if (firebaseEnabled) return deleteDoc(doc(fdb, col, id))
  const d = load(); d[col] = (d[col] || []).filter((x) => x.id !== id); persist()
}

export function useCollection(col) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => subscribe(col, (rows) => { setData(rows); setLoading(false) }), [col])
  return [data, loading]
}

// ---------- operaciones de negocio ----------
// Crea la cita + su bloqueo de horario (el bloqueo es público, la cita es privada)
export async function crearCita(cita) {
  const citaId = await add('citas', { ...cita, creado: Date.now() })
  await add('bloqueos', { citaId, estilistaId: cita.estilistaId, fecha: cita.fecha, hora: cita.hora, duracion: cita.duracion })
  return citaId
}

export async function cambiarEstadoCita(cita, estado, bloqueos) {
  await update('citas', cita.id, { estado })
  if (estado === 'cancelada' || estado === 'noasistio') {
    const b = bloqueos.find((x) => x.citaId === cita.id)
    if (b) await remove('bloqueos', b.id)
  }
}

export async function registrarVenta(venta, productos) {
  const id = await add('ventas', { ...venta, creado: Date.now() })
  for (const it of venta.items.filter((i) => i.tipo === 'producto')) {
    const p = productos.find((x) => x.id === it.refId)
    if (p) await update('productos', p.id, { stock: Math.max(0, Number(p.stock || 0) - it.cantidad) })
  }
  return id
}
