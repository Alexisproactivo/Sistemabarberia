import { NEGOCIO } from '../config'

export const money = (n) => `${NEGOCIO.moneda} ${Number(n || 0).toFixed(2)}`

// Fecha local en formato YYYY-MM-DD (sin desfase UTC)
export const ymd = (d = new Date()) => {
  const p = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
export const hoy = () => ymd(new Date())
export const addDays = (str, n) => { const d = new Date(str + 'T12:00:00'); d.setDate(d.getDate() + n); return ymd(d) }
export const fechaLarga = (str) => {
  const t = new Date(str + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}
export const fechaCorta = (str) =>
  new Date(str + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })

export const toMin = (h) => { const [a, b] = h.split(':').map(Number); return a * 60 + b }
export const toHora = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
export const hora12 = (h) => {
  const [a, b] = h.split(':').map(Number)
  return `${((a + 11) % 12) + 1}:${String(b).padStart(2, '0')} ${a < 12 ? 'am' : 'pm'}`
}

export const iniciales = (nombre = '') =>
  nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('')

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

// ¿El estilista está libre en [inicio, inicio+dur) ese día?
export function estaLibre(bloqueos, estilistaId, fecha, inicio, dur) {
  const fin = inicio + dur
  return !bloqueos.some((b) => {
    if (b.estilistaId !== estilistaId || b.fecha !== fecha) return false
    const bi = toMin(b.hora), bf = bi + Number(b.duracion || 30)
    return inicio < bf && bi < fin
  })
}

// Turnos disponibles para un servicio/estilista en una fecha.
// Si estilistaId === 'cualquiera' devuelve [{hora, estilistaId}] con el primer estilista libre.
export function turnosDisponibles({ fecha, duracion, estilistaId, estilistas, bloqueos }) {
  const { apertura, cierre, intervalo, diasCerrados } = NEGOCIO.horario
  const dia = new Date(fecha + 'T12:00:00').getDay()
  if (diasCerrados.includes(dia)) return []
  const ahora = new Date()
  const minAhora = fecha === hoy() ? ahora.getHours() * 60 + ahora.getMinutes() + 30 : -1
  const ids = estilistaId === 'cualquiera' ? estilistas.map((e) => e.id) : [estilistaId]
  const res = []
  for (let m = toMin(apertura); m + duracion <= toMin(cierre); m += intervalo) {
    if (m < minAhora) continue
    const libre = ids.find((id) => estaLibre(bloqueos, id, fecha, m, duracion))
    if (libre) res.push({ hora: toHora(m), estilistaId: libre })
  }
  return res
}

// Comprime imágenes a JPEG 800px / 70% para no superar el límite de 1MB de Firestore
export function comprimirImagen(file, max = 800, calidad = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const esc = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * esc)
        c.height = Math.round(img.height * esc)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', calidad))
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function exportarExcel(filas, nombre, hoja = 'Datos') {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.json_to_sheet(filas)
  ws['!cols'] = Object.keys(filas[0] || {}).map((k) => ({
    wch: Math.max(k.length, ...filas.map((f) => String(f[k] ?? '').length)) + 2,
  }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, hoja)
  XLSX.writeFile(wb, `${nombre}_${hoy()}.xlsx`)
}

export const linkWhatsApp = (numero, texto) =>
  `https://wa.me/${String(numero).replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`
