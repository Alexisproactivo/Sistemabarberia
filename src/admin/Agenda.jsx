import { useMemo, useState } from 'react'
import { useCollection, cambiarEstadoCita, crearCita, update } from '../lib/db'
import { money, hoy, addDays, fechaLarga, hora12, turnosDisponibles, exportarExcel, linkWhatsApp, estaLibre, toMin } from '../lib/utils'
import { NEGOCIO, ESTADOS } from '../config'
import { Badge, Modal, PageHead } from './ui.jsx'
import { CobroModal } from './Caja.jsx'

export default function Agenda() {
  const [citas] = useCollection('citas')
  const [bloqueos] = useCollection('bloqueos')
  const [servicios] = useCollection('servicios')
  const [estilistas] = useCollection('estilistas')
  const [fecha, setFecha] = useState(hoy())
  const [est, setEst] = useState('todos')
  const [verCanceladas, setVerCanceladas] = useState(false)
  const [nueva, setNueva] = useState(false)
  const [cobrar, setCobrar] = useState(null)

  const delDia = useMemo(() => citas
    .filter((c) => c.fecha === fecha && (est === 'todos' || c.estilistaId === est) && (verCanceladas || !['cancelada', 'noasistio'].includes(c.estado)))
    .sort((a, b) => a.hora.localeCompare(b.hora)), [citas, fecha, est, verCanceladas])

  const activos = estilistas.filter((e) => e.activo !== false)
  const totalDia = delDia.filter((c) => c.estado !== 'cancelada').reduce((s, c) => s + Number(c.precio || 0), 0)

  const exportar = () => exportarExcel(citas.filter((c) => c.fecha === fecha).map((c) => ({
    Hora: c.hora, Cliente: c.cliente, Celular: c.telefono, Servicio: c.servicioNombre, Estilista: c.estilistaNombre,
    Precio: Number(c.precio), Estado: ESTADOS[c.estado]?.label, Origen: c.origen, Notas: c.notas || '',
  })), `agenda_${fecha}`, 'Agenda')

  const recordatorio = (c) => linkWhatsApp('51' + c.telefono, `Hola ${c.cliente.split(' ')[0]} 👋, te recordamos tu cita en ${NEGOCIO.nombre}: ${c.servicioNombre} el ${fechaLarga(c.fecha)} a las ${hora12(c.hora)}. ¡Te esperamos!`)

  return (
    <>
      <PageHead title="Agenda">
        <button className="btn btn-ghost dark sm" onClick={exportar}>Exportar Excel</button>
        <button className="btn btn-gold sm" onClick={() => setNueva(true)}>+ Nueva cita</button>
      </PageHead>

      <div className="toolbar card">
        <div className="date-nav">
          <button onClick={() => setFecha(addDays(fecha, -1))}>‹</button>
          <input type="date" value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} />
          <button onClick={() => setFecha(addDays(fecha, 1))}>›</button>
          {fecha !== hoy() && <button className="link" onClick={() => setFecha(hoy())}>Hoy</button>}
        </div>
        <select value={est} onChange={(e) => setEst(e.target.value)}>
          <option value="todos">Todo el equipo</option>
          {activos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
        <label className="check-inline"><input type="checkbox" checked={verCanceladas} onChange={(e) => setVerCanceladas(e.target.checked)} /> Ver canceladas</label>
      </div>

      <p className="muted cap">{fechaLarga(fecha)} · {delDia.length} citas · estimado {money(totalDia)}</p>

      {delDia.length === 0 ? <div className="card empty">Sin citas para este día.</div> : (
        <div className="agenda">
          {delDia.map((c) => (
            <div key={c.id} className={'cita card st-' + c.estado}>
              <div className="cita-hora">{hora12(c.hora)}<small>{c.duracion} min</small></div>
              <div className="cita-info">
                <b>{c.cliente}</b> <Badge estado={c.estado} /> {c.origen === 'web' && <span className="tag">web</span>}
                <p>{c.servicioNombre} · {c.estilistaNombre} · {money(c.precio)}</p>
                <small>📱 {c.telefono}{c.notas ? ` · “${c.notas}”` : ''}</small>
              </div>
              <div className="cita-acc">
                {c.estado === 'pendiente' && <button className="btn btn-dark sm" onClick={() => cambiarEstadoCita(c, 'confirmada', bloqueos)}>Confirmar</button>}
                {['pendiente', 'confirmada'].includes(c.estado) && <button className="btn btn-gold sm" onClick={() => setCobrar(c)}>Cobrar</button>}
                <a className="btn btn-ghost dark sm" href={recordatorio(c)} target="_blank" rel="noreferrer">WhatsApp</a>
                {['pendiente', 'confirmada'].includes(c.estado) && (
                  <select className="sm" value="" onChange={(e) => e.target.value && cambiarEstadoCita(c, e.target.value, bloqueos)}>
                    <option value="">Más…</option>
                    <option value="noasistio">No asistió</option>
                    <option value="cancelada">Cancelar cita</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {nueva && <NuevaCita onClose={() => setNueva(false)} fecha={fecha} servicios={servicios.filter((s) => s.activo !== false)} estilistas={activos} bloqueos={bloqueos} />}
      {cobrar && <CobroModal cita={cobrar} onClose={() => setCobrar(null)} onDone={async () => { await update('citas', cobrar.id, { estado: 'completada' }); setCobrar(null) }} />}
    </>
  )
}

function NuevaCita({ onClose, fecha: f0, servicios, estilistas, bloqueos }) {
  const [f, setF] = useState({ cliente: '', telefono: '', servicioId: servicios[0]?.id || '', estilistaId: estilistas[0]?.id || '', fecha: f0, hora: '', notas: '', libre: false })
  const [err, setErr] = useState('')
  const [aviso, setAviso] = useState(false)
  const serv = servicios.find((s) => s.id === f.servicioId)
  const turnos = serv ? turnosDisponibles({ fecha: f.fecha, duracion: Number(serv.duracion), estilistaId: f.estilistaId, estilistas, bloqueos }) : []
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const guardar = async (e) => {
    e.preventDefault()
    const hora = f.hora
    if (!hora) return setErr('Elige una hora.')
    if (!aviso && !estaLibre(bloqueos, f.estilistaId, f.fecha, toMin(hora), Number(serv.duracion))) { setAviso(true); return setErr('Ese horario se cruza con otra cita. Pulsa "Guardar" otra vez para agendar igual.') }
    const e2 = estilistas.find((x) => x.id === f.estilistaId)
    await crearCita({
      cliente: f.cliente.trim(), telefono: f.telefono.replace(/\s/g, ''), notas: f.notas, servicioId: serv.id, servicioNombre: serv.nombre,
      precio: Number(serv.precio), duracion: Number(serv.duracion), estilistaId: e2.id, estilistaNombre: e2.nombre, fecha: f.fecha, hora,
      estado: 'confirmada', origen: 'local',
    })
    onClose()
  }

  return (
    <Modal title="Nueva Cita" onClose={onClose}>
      <form className="form" onSubmit={guardar}>
        <div className="form-2">
          <label>
            <span>Cliente</span>
            <input required placeholder="Nombre completo" value={f.cliente} onChange={set('cliente')} />
          </label>
          <label>
            <span>Celular</span>
            <input required type="tel" placeholder="9XX XXX XXX" value={f.telefono} onChange={set('telefono')} />
          </label>
        </div>

        <label>
          <span>Servicio</span>
          <select value={f.servicioId} onChange={(e) => setF({ ...f, servicioId: e.target.value, hora: '' })}>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} — {money(s.precio)} ({s.duracion} min)
              </option>
            ))}
          </select>
        </label>

        <div className="form-2">
          <label>
            <span>Estilista</span>
            <select value={f.estilistaId} onChange={(e) => setF({ ...f, estilistaId: e.target.value, hora: '' })}>
              {estilistas.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Fecha</span>
            <input type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value, hora: '' })} />
          </label>
        </div>

        <label className="check-inline">
          <input type="checkbox" checked={f.libre} onChange={(e) => setF({ ...f, libre: e.target.checked, hora: '' })} />
          <span>Escribir hora manualmente (sobrecupo)</span>
        </label>

        {f.libre ? (
          <label>
            <span>Hora manual</span>
            <input type="time" value={f.hora} onChange={set('hora')} />
          </label>
        ) : (
          <div className="turnos-box">
            <span className="field-subtitle">Horarios disponibles</span>
            {turnos.length === 0 ? (
              <p className="muted small-msg">Sin turnos libres para esta fecha y estilista.</p>
            ) : (
              <div className="slots-pills-grid">
                {turnos.map((t) => (
                  <button
                    type="button"
                    key={t.hora}
                    className={'slot-pill' + (f.hora === t.hora ? ' active' : '')}
                    onClick={() => { setF({ ...f, hora: t.hora }); setAviso(false) }}
                  >
                    {hora12(t.hora)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <label>
          <span>Notas / Preferencias (opcional)</span>
          <input placeholder="Ej. Cliente frecuente, corte clásico" value={f.notas} onChange={set('notas')} />
        </label>

        {err && <p className="err-banner">{err}</p>}

        <button className="btn btn-gold block btn-submit-admin">Guardar cita</button>
      </form>
    </Modal>
  )
}
