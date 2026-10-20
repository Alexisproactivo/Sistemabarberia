import { useEffect, useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import QRCode from 'qrcode'
import { useCollection, add } from '../lib/db'
import { seed } from '../lib/seed'
import { money, hoy, addDays, fechaCorta, hora12 } from '../lib/utils'
import { Kpi, Badge, PageHead } from './ui.jsx'

const PALETTE = ['#c5a880', '#e0c9a6', '#9e825d', '#d4af37', '#736149', '#524330']

const PERIODOS = [
  { id: 'hoy', label: 'Hoy / Día' },
  { id: 'semana', label: 'Esta Semana' },
  { id: 'mes', label: 'Este Mes' },
  { id: 'historico', label: 'Histórico / Todo' },
]

function matchPeriodo(fecha, periodo, h) {
  if (!fecha) return false
  if (periodo === 'hoy') return fecha === h
  if (periodo === 'semana') return fecha >= addDays(h, -6) && fecha <= h
  if (periodo === 'mes') return fecha.startsWith(h.slice(0, 7))
  if (periodo === 'historico') return true
  return true
}

export default function Dashboard({ go }) {
  const [ventas] = useCollection('ventas')
  const [citas] = useCollection('citas')
  const [productos, cargandoProd] = useCollection('productos')
  const [servicios, cargandoServ] = useCollection('servicios')
  const [estilistas] = useCollection('estilistas')

  const [periodo, setPeriodo] = useState('mes')
  const [qr, setQr] = useState('')
  const [cargando, setCargando] = useState(false)

  const h = hoy()
  const mesActual = h.slice(0, 7)
  const urlWeb = window.location.href.split('?')[0]

  useEffect(() => {
    QRCode.toDataURL(urlWeb + '#reserva', {
      width: 220,
      margin: 1,
      color: { dark: '#0d0f12', light: '#f4f4f5' },
    }).then(setQr)
  }, [urlWeb])

  // Carga inicial de datos demo si el salón está vacío
  const cargarIniciales = async () => {
    setCargando(true)
    const d = seed()
    const sinId = ({ id, ...r }) => r
    if (!servicios.length) for (const x of d.servicios) await add('servicios', sinId(x))
    if (!estilistas.length) for (const x of d.estilistas) await add('estilistas', sinId(x))
    if (!productos.length) for (const x of d.productos) await add('productos', sinId(x))
    setCargando(false)
  }

  const vacio = !cargandoServ && !cargandoProd && (servicios.length === 0 || estilistas.length === 0)

  // =========================================================
  // CÁLCULO DE MÉTRICAS DINÁMICAS SEGÚN EL PERIODO ACTIVO
  // =========================================================
  const metricas = useMemo(() => {
    const sum = (arr) => arr.reduce((acc, v) => acc + Number(v.total || 0), 0)

    // 1. Filtrado de ventas y citas correspondientes al periodo
    const vFiltradas = ventas.filter((v) => matchPeriodo(v.fecha, periodo, h))
    const cFiltradas = citas.filter((c) => matchPeriodo(c.fecha, periodo, h))

    // 2. Dinero recaudado
    const recaudado = sum(vFiltradas)

    // 3. Citas / Cortes realizados
    const cortesRealizados = vFiltradas.reduce((acc, v) => {
      const cantServicios = v.items
        ?.filter((i) => i.tipo === 'servicio')
        .reduce((n, it) => n + Number(it.cantidad || 1), 0)
      return acc + (cantServicios !== undefined && cantServicios > 0 ? cantServicios : 1)
    }, 0)

    // 4. Ticket promedio
    const ticketProm = vFiltradas.length > 0 ? recaudado / vFiltradas.length : 0

    // 5. Nuevos clientes (primera interacción en este periodo)
    const primeraFechaCliente = {}
    const normalizeKey = (x) => (x.telefono || x.cliente || '').trim().toLowerCase()
    ;[...citas, ...ventas].forEach((r) => {
      const k = normalizeKey(r)
      if (!k || k === 'cliente general') return
      if (!primeraFechaCliente[k] || r.fecha < primeraFechaCliente[k]) {
        primeraFechaCliente[k] = r.fecha
      }
    })

    const nuevosClientes = Object.values(primeraFechaCliente).filter((f) =>
      matchPeriodo(f, periodo, h)
    ).length

    // 6. Citas de hoy para la agenda rápida
    const cHoy = citas
      .filter((c) => c.fecha === h && c.estado !== 'cancelada')
      .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))

    // 7. Gráfico de evolución de ingresos
    let dataTimeline = []
    if (periodo === 'hoy') {
      // Comparativa últimos 7 días
      dataTimeline = Array.from({ length: 7 }, (_, i) => addDays(h, i - 6)).map((f) => ({
        label: f === h ? 'Hoy' : fechaCorta(f),
        total: sum(ventas.filter((v) => v.fecha === f)),
      }))
    } else if (periodo === 'semana') {
      // 7 días de la semana
      dataTimeline = Array.from({ length: 7 }, (_, i) => addDays(h, i - 6)).map((f) => ({
        label: fechaCorta(f),
        total: sum(ventas.filter((v) => v.fecha === f)),
      }))
    } else if (periodo === 'mes') {
      // Últimos 14 días del mes corriente
      dataTimeline = Array.from({ length: 14 }, (_, i) => addDays(h, i - 13)).map((f) => ({
        label: fechaCorta(f),
        total: sum(ventas.filter((v) => v.fecha === f)),
      }))
    } else {
      // Histórico: últimos 6 meses
      const mesesMap = {}
      ventas.forEach((v) => {
        const m = v.fecha ? v.fecha.slice(0, 7) : 'Otro'
        mesesMap[m] = (mesesMap[m] || 0) + Number(v.total || 0)
      })
      dataTimeline = Object.entries(mesesMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6)
        .map(([m, total]) => ({ label: m, total }))
    }

    // 8. Servicios más pedidos en este periodo
    const porServ = {}
    vFiltradas.forEach((v) => {
      v.items
        ?.filter((i) => i.tipo === 'servicio')
        .forEach((i) => {
          porServ[i.nombre] = (porServ[i.nombre] || 0) + Number(i.cantidad || 1)
        })
    })
    const topServicios = Object.entries(porServ)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }))

    // 9. Rendimiento por estilista en este periodo
    const porEst = {}
    vFiltradas.forEach((v) => {
      if (v.estilistaNombre) {
        porEst[v.estilistaNombre] = (porEst[v.estilistaNombre] || 0) + Number(v.total || 0)
      }
    })
    const estRendimiento = Object.entries(porEst)
      .sort((a, b) => b[1] - a[1])
      .map(([name, total]) => ({ name: name.split(' ')[0], total }))

    return {
      recaudado,
      cortesRealizados,
      ticketProm,
      nuevosClientes,
      numVentas: vFiltradas.length,
      cHoy,
      dataTimeline,
      topServicios,
      estRendimiento,
    }
  }, [ventas, citas, periodo, h])

  const stockBajo = productos.filter((p) => p.activo !== false && Number(p.stock) <= 3)

  const periodoLabels = {
    hoy: 'hoy',
    semana: 'esta semana',
    mes: 'este mes',
    historico: 'en todo el historial',
  }

  return (
    <>
      <PageHead title="Resumen General">
        {/* Selector de Rango Temporal Dinámico */}
        <div className="period-tabs-group" role="tablist" aria-label="Filtrar periodo">
          {PERIODOS.map((p) => {
            const isActive = periodo === p.id
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={'period-tab-btn' + (isActive ? ' active' : '')}
                onClick={() => setPeriodo(p.id)}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </PageHead>

      {vacio && (
        <div className="card setup">
          <div>
            <h3>Configuración inicial recomendada</h3>
            <p className="muted">
              Tu catálogo está vacío. Carga una lista base de servicios, equipo y productos para comenzar a operar de inmediato.
            </p>
          </div>
          <button className="btn btn-gold" disabled={cargando} onClick={cargarIniciales}>
            {cargando ? 'Cargando datos…' : 'Cargar datos iniciales'}
          </button>
        </div>
      )}

      {/* Tarjetas KPI Recalculadas en Tiempo Real */}
      <div className="kpis">
        <Kpi
          label="Dinero Recaudado"
          value={money(metricas.recaudado)}
          sub={`Total ingresos ${periodoLabels[periodo]}`}
        />
        <Kpi
          label="Cortes / Citas Realizados"
          value={metricas.cortesRealizados}
          sub={`${metricas.numVentas} tickets emitidos`}
        />
        <Kpi
          label="Ticket Promedio"
          value={money(metricas.ticketProm)}
          sub={`Promedio por venta ${periodoLabels[periodo]}`}
        />
        <Kpi
          label="Nuevos Clientes"
          value={metricas.nuevosClientes}
          sub={`Registrados ${periodoLabels[periodo]}`}
        />
      </div>

      {/* Gráficos Estadísticos */}
      <div className="grid-2">
        <div className="card">
          <div className="row-between" style={{ marginBottom: 14 }}>
            <h3>Ingresos ({PERIODOS.find((p) => p.id === periodo)?.label})</h3>
            <span className="badge on">Total: {money(metricas.recaudado)}</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={metricas.dataTimeline}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#272d3c" />
              <XAxis dataKey="label" fontSize={11} stroke="#9fa6b2" tickLine={false} />
              <YAxis fontSize={11} stroke="#9fa6b2" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12141a',
                  borderColor: '#272d3c',
                  borderRadius: 8,
                  color: '#f4f4f5',
                }}
                formatter={(v) => [money(v), 'Ingresos']}
              />
              <Bar dataKey="total" fill="#c5a880" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="row-between" style={{ marginBottom: 14 }}>
            <h3>Servicios más pedidos</h3>
            <span className="badge off">{PERIODOS.find((p) => p.id === periodo)?.label}</span>
          </div>
          {metricas.topServicios.length === 0 ? (
            <p className="muted center" style={{ padding: '60px 0' }}>
              No hay servicios registrados en este periodo.
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={metricas.topServicios}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={88}
                    paddingAngle={3}
                  >
                    {metricas.topServicios.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#12141a',
                      borderColor: '#272d3c',
                      borderRadius: 8,
                      color: '#f4f4f5',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="legend">
                {metricas.topServicios.map((t, i) => (
                  <li key={t.name}>
                    <i style={{ background: PALETTE[i % PALETTE.length] }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.name}
                    </span>
                    <b>{t.value}</b>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="grid-3" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="row-between">
            <h3>Citas de Hoy</h3>
            <button type="button" className="link" onClick={() => go('agenda')}>
              Ver agenda completa →
            </button>
          </div>
          {metricas.cHoy.length === 0 ? (
            <p className="muted" style={{ padding: '24px 0', textAlign: 'center' }}>
              No hay citas programadas para hoy.
            </p>
          ) : (
            <ul className="mini-list" style={{ marginTop: 12 }}>
              {metricas.cHoy.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <b>{hora12(c.hora)}</b>
                  <span>
                    {c.cliente}
                    <small>
                      {c.servicioNombre} · {c.estilistaNombre}
                    </small>
                  </span>
                  <Badge estado={c.estado} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="row-between">
            <h3>Rendimiento por Estilista</h3>
            <span className="badge off">{PERIODOS.find((p) => p.id === periodo)?.label}</span>
          </div>
          {metricas.estRendimiento.length === 0 ? (
            <p className="muted" style={{ padding: '24px 0', textAlign: 'center' }}>
              Sin registros en este periodo.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metricas.estRendimiento} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={75}
                  fontSize={12}
                  stroke="#9fa6b2"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#12141a',
                    borderColor: '#272d3c',
                    borderRadius: 8,
                    color: '#f4f4f5',
                  }}
                  formatter={(v) => [money(v), 'Facturado']}
                />
                <Bar dataKey="total" fill="#c5a880" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {stockBajo.length > 0 && (
            <div className="warn" style={{ marginTop: 12 }}>
              ⚠️ <strong>Stock bajo:</strong> {stockBajo.map((p) => `${p.nombre} (${p.stock})`).join(', ')}
            </div>
          )}
        </div>

        <div className="card qr-card">
          <h3>QR Directo a Reservas</h3>
          <p className="muted" style={{ fontSize: 13, margin: '6px 0 14px' }}>
            Imprime este código y colócalo en el mostrador o tocador para que tus clientes agenden al instante.
          </p>
          {qr && <img src={qr} alt="Código QR reservas" style={{ borderRadius: 10 }} />}
          {qr && (
            <a className="btn btn-gold sm" href={qr} download="qr-reservas-studio-capilar.png" style={{ marginTop: 10 }}>
              Descargar Imagen QR
            </a>
          )}
        </div>
      </div>
    </>
  )
}
