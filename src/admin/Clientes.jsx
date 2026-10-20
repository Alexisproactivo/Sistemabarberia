import { useMemo, useState } from 'react'
import { useCollection } from '../lib/db'
import { money, exportarExcel, linkWhatsApp } from '../lib/utils'
import { NEGOCIO } from '../config'
import { PageHead } from './ui.jsx'

// Los clientes se arman automáticamente desde citas y ventas (agrupados por celular)
export default function Clientes() {
  const [citas] = useCollection('citas')
  const [ventas] = useCollection('ventas')
  const [q, setQ] = useState('')
  const [orden, setOrden] = useState('gastado')

  const clientes = useMemo(() => {
    const m = {}
    const key = (x) => x.telefono || x.cliente
    citas.forEach((c) => {
      const k = key(c); if (!k) return
      m[k] ||= { nombre: c.cliente, telefono: c.telefono || '', citas: 0, visitas: 0, gastado: 0, ultima: '', faltas: 0 }
      m[k].citas++
      if (c.estado === 'noasistio') m[k].faltas++
    })
    ventas.forEach((v) => {
      if (!v.telefono && (!v.cliente || v.cliente === 'Cliente general')) return
      const k = key(v)
      m[k] ||= { nombre: v.cliente, telefono: v.telefono || '', citas: 0, visitas: 0, gastado: 0, ultima: '', faltas: 0 }
      m[k].visitas++; m[k].gastado += Number(v.total)
      if (v.fecha > m[k].ultima) m[k].ultima = v.fecha
    })
    return Object.values(m)
  }, [citas, ventas])

  const diasDesde = (f) => f ? Math.floor((Date.now() - new Date(f + 'T12:00')) / 864e5) : null
  const lista = clientes
    .filter((c) => (c.nombre + c.telefono).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => orden === 'gastado' ? b.gastado - a.gastado : orden === 'visitas' ? b.visitas - a.visitas : (b.ultima || '').localeCompare(a.ultima || ''))

  const exportar = () => exportarExcel(lista.map((c) => ({ Cliente: c.nombre, Celular: c.telefono, Visitas: c.visitas, 'Total gastado': c.gastado, 'Última visita': c.ultima, 'No asistió': c.faltas })), 'clientes', 'Clientes')

  return (
    <>
      <PageHead title={`Clientes (${clientes.length})`}>
        <input className="search" placeholder="Buscar nombre o celular…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={orden} onChange={(e) => setOrden(e.target.value)}>
          <option value="gastado">Más gastado</option><option value="visitas">Más visitas</option><option value="ultima">Visita reciente</option>
        </select>
        <button className="btn btn-ghost dark sm" onClick={exportar}>Exportar Excel</button>
      </PageHead>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Cliente</th><th>Celular</th><th className="r">Visitas</th><th className="r">Gastado</th><th>Última visita</th><th></th></tr></thead>
          <tbody>
            {lista.map((c) => {
              const d = diasDesde(c.ultima)
              return (
                <tr key={c.telefono + c.nombre}>
                  <td className="cell-title"><b>{c.nombre}</b>{c.faltas > 0 && <small className="err"> · {c.faltas} falta(s)</small>}</td>
                  <td data-label="Celular">{c.telefono || '—'}</td><td data-label="Visitas" className="r">{c.visitas}</td><td data-label="Gastado" className="r">{money(c.gastado)}</td>
                  <td data-label="Última visita">{c.ultima ? `${c.ultima} (${d === 0 ? 'hoy' : `hace ${d} d`})` : '—'}</td>
                  <td className="cell-act">{c.telefono && <a className="link" target="_blank" rel="noreferrer" href={linkWhatsApp('51' + c.telefono, `Hola ${c.nombre.split(' ')[0]}, te saluda ${NEGOCIO.nombre} 💇 ¡Te extrañamos! Reserva tu próxima cita aquí: ${location.href.split('?')[0]}#reserva`)}>WhatsApp</a>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
