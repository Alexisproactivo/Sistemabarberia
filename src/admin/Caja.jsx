import { useMemo, useRef, useState } from 'react'
import { useCollection, registrarVenta } from '../lib/db'
import { money, hoy, hora12, exportarExcel, addDays } from '../lib/utils'
import { METODOS_PAGO } from '../config'
import { Modal, PageHead, Kpi } from './ui.jsx'

const ahoraHora = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }

// Punto de venta reutilizable (desde Caja o al cobrar una cita)
function POS({ inicial, cita, onDone }) {
  const [servicios] = useCollection('servicios')
  const [productos] = useCollection('productos')
  const [estilistas] = useCollection('estilistas')
  const [items, setItems] = useState(inicial || [])
  const [cliente, setCliente] = useState(cita?.cliente || '')
  const [telefono, setTelefono] = useState(cita?.telefono || '')
  const [estId, setEstId] = useState(cita?.estilistaId || '')
  const [metodo, setMetodo] = useState('Efectivo')
  const [descuento, setDescuento] = useState(0)
  const [recibido, setRecibido] = useState('')
  const [q, setQ] = useState('')
  const [guardando, setGuardando] = useState(false)
  const ticketRef = useRef(null)

  const agregar = (tipo, x) => setItems((its) => {
    const i = its.findIndex((it) => it.refId === x.id && it.tipo === tipo)
    if (i >= 0) return its.map((it, k) => (k === i ? { ...it, cantidad: it.cantidad + 1 } : it))
    return [...its, { tipo, refId: x.id, nombre: x.nombre, precio: Number(x.precio), cantidad: 1 }]
  })
  const cambiar = (i, cant) => setItems((its) => cant <= 0 ? its.filter((_, k) => k !== i) : its.map((it, k) => (k === i ? { ...it, cantidad: cant } : it)))
  const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0)
  const total = Math.max(0, subtotal - Number(descuento || 0))
  const vuelto = Number(recibido || 0) - total
  const match = (x) => x.activo !== false && x.nombre.toLowerCase().includes(q.toLowerCase())

  const cobrar = async () => {
    if (!items.length) return
    setGuardando(true)
    const e = estilistas.find((x) => x.id === estId)
    await registrarVenta({
      fecha: hoy(), hora: ahoraHora(), cliente: cliente.trim() || 'Cliente general', telefono: telefono.replace(/\s/g, ''),
      estilistaId: e?.id || '', estilistaNombre: e?.nombre || '', items, subtotal, descuento: Number(descuento || 0), total, metodo, citaId: cita?.id || '',
    }, productos)
    setGuardando(false)
    setItems([]); setCliente(''); setTelefono(''); setDescuento(0); setRecibido('')
    onDone?.()
  }

  return (
    <div className="pos">
      <div className="pos-cat">
        <input className="search" placeholder="Buscar servicio o producto…" value={q} onChange={(e) => setQ(e.target.value)} />
        <h4>Servicios</h4>
        <div className="pos-grid">{servicios.filter(match).map((s) => <button key={s.id} onClick={() => agregar('servicio', s)}><span>{s.nombre}</span><b>{money(s.precio)}</b></button>)}</div>
        <h4>Productos</h4>
        <div className="pos-grid">{productos.filter(match).map((p) => <button key={p.id} disabled={Number(p.stock) <= 0} onClick={() => agregar('producto', p)}><span>{p.nombre}</span><b>{money(p.precio)}</b><small>stock {p.stock}</small></button>)}</div>
        {items.length > 0 && (
          <button className="pos-jump" onClick={() => ticketRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            <span>Ver ticket ({items.reduce((n, i) => n + i.cantidad, 0)})</span><b>{money(total)} →</b>
          </button>
        )}
      </div>
      <div className="pos-ticket card" ref={ticketRef}>
        <div className="form-2">
          <label>
            <span>Cliente</span>
            <input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Opcional" />
          </label>
          <label>
            <span>Celular</span>
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Opcional" />
          </label>
        </div>
        <label>
          <span>Atendió</span>
          <select value={estId} onChange={(e) => setEstId(e.target.value)}>
            <option value="">— Sin estilista —</option>
            {estilistas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </label>
        <ul className="ticket-items">
          {items.length === 0 && <li className="muted">Agrega servicios o productos.</li>}
          {items.map((it, i) => (
            <li key={i}>
              <span>{it.nombre}<small>{money(it.precio)}</small></span>
              <div className="qty"><button onClick={() => cambiar(i, it.cantidad - 1)}>−</button>{it.cantidad}<button onClick={() => cambiar(i, it.cantidad + 1)}>+</button></div>
              <b>{money(it.precio * it.cantidad)}</b>
            </li>
          ))}
        </ul>
        <div className="form-2">
          <label>
            <span>Descuento</span>
            <input type="number" min="0" step="0.5" value={descuento} onChange={(e) => setDescuento(e.target.value)} />
          </label>
          <label>
            <span>Método</span>
            <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              {METODOS_PAGO.map((m) => <option key={m}>{m}</option>)}
            </select>
          </label>
        </div>
        {metodo === 'Efectivo' && (
          <label>
            <span>Recibido</span>
            <input type="number" min="0" value={recibido} onChange={(e) => setRecibido(e.target.value)} placeholder="Para calcular vuelto" />
          </label>
        )}
        <div className="ticket-total"><span>Total</span><b>{money(total)}</b></div>
        {metodo === 'Efectivo' && recibido !== '' && <p className={vuelto < 0 ? 'err' : 'ok'}>Vuelto: {money(vuelto)}</p>}
        <button className="btn btn-gold block" disabled={!items.length || guardando} onClick={cobrar}>{guardando ? 'Guardando…' : `Cobrar ${money(total)}`}</button>
      </div>
    </div>
  )
}

export function CobroModal({ cita, onClose, onDone }) {
  const inicial = [{ tipo: 'servicio', refId: cita.servicioId, nombre: cita.servicioNombre, precio: Number(cita.precio), cantidad: 1 }]
  return <Modal title={`Cobrar · ${cita.cliente}`} onClose={onClose} wide><POS inicial={inicial} cita={cita} onDone={onDone} /></Modal>
}

export default function Caja() {
  const [ventas] = useCollection('ventas')
  const [desde, setDesde] = useState(hoy())
  const [hasta, setHasta] = useState(hoy())
  const [ver, setVer] = useState(null)

  const lista = useMemo(() => ventas.filter((v) => v.fecha >= desde && v.fecha <= hasta).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora)), [ventas, desde, hasta])
  const total = lista.reduce((s, v) => s + Number(v.total), 0)
  const porMetodo = METODOS_PAGO.map((m) => [m, lista.filter((v) => v.metodo === m).reduce((s, v) => s + Number(v.total), 0)]).filter((x) => x[1] > 0)

  const exportar = () => exportarExcel(lista.flatMap((v) => v.items.map((i) => ({
    Fecha: v.fecha, Hora: v.hora, Cliente: v.cliente, Celular: v.telefono || '', Atendió: v.estilistaNombre || '', Tipo: i.tipo,
    Concepto: i.nombre, Cantidad: i.cantidad, 'Precio unit.': i.precio, Importe: i.precio * i.cantidad, 'Desc. ticket': v.descuento || 0, 'Total ticket': v.total, Método: v.metodo,
  }))), `ventas_${desde}_a_${hasta}`, 'Ventas')

  const rango = (d) => { setHasta(hoy()); setDesde(addDays(hoy(), -d)) }

  return (
    <>
      <PageHead title="Caja" />
      <POS />
      <div className="page-head sub"><h2>Ventas</h2>
        <div className="actions">
          <button className="chip" onClick={() => rango(0)}>Hoy</button>
          <button className="chip" onClick={() => rango(6)}>7 días</button>
          <button className="chip" onClick={() => { setDesde(hoy().slice(0, 8) + '01'); setHasta(hoy()) }}>Este mes</button>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          <button className="btn btn-ghost dark sm" onClick={exportar} disabled={!lista.length}>Exportar Excel</button>
        </div>
      </div>
      <div className="kpis">
        <Kpi label="Total" value={money(total)} sub={`${lista.length} tickets`} />
        {porMetodo.map(([m, t]) => <Kpi key={m} label={m} value={money(t)} />)}
      </div>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Fecha</th><th>Cliente</th><th>Detalle</th><th>Atendió</th><th>Método</th><th className="r">Total</th></tr></thead>
          <tbody>
            {lista.map((v) => (
              <tr key={v.id} onClick={() => setVer(v)} className="click">
                <td data-label="Fecha">{v.fecha.slice(5)} {hora12(v.hora)}</td><td data-label="Cliente" className="cell-title">{v.cliente}</td>
                <td data-label="Detalle" className="muted">{v.items.map((i) => i.nombre).join(', ')}</td>
                <td data-label="Atendió">{v.estilistaNombre?.split(' ')[0] || '—'}</td><td data-label="Método">{v.metodo}</td><td data-label="Total" className="r"><b>{money(v.total)}</b></td>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan="6" className="muted center">Sin ventas en este rango.</td></tr>}
          </tbody>
        </table>
      </div>
      {ver && (
        <Modal title="Ticket" onClose={() => setVer(null)}>
          <div className="ticket-print">
            <p>{ver.fecha} · {hora12(ver.hora)}<br />{ver.cliente}{ver.estilistaNombre && <> · atendió {ver.estilistaNombre}</>}</p>
            <ul className="ticket-items">{ver.items.map((i, k) => <li key={k}><span>{i.cantidad} × {i.nombre}</span><b>{money(i.precio * i.cantidad)}</b></li>)}</ul>
            {ver.descuento > 0 && <p>Descuento: −{money(ver.descuento)}</p>}
            <div className="ticket-total"><span>Total ({ver.metodo})</span><b>{money(ver.total)}</b></div>
            <button className="btn btn-dark block" onClick={() => window.print()}>Imprimir</button>
          </div>
        </Modal>
      )}
    </>
  )
}
