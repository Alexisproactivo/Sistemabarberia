import { useEffect, useMemo, useState } from 'react'
import { NEGOCIO } from '../config'
import { useCollection } from '../lib/db'
import { hoy, addDays } from '../lib/utils'
import { submitAppointment, getAvailableSlots } from '../modules/booking/bookingService'

import StepServicios from './components/StepServicios'
import StepEstilistas from './components/StepEstilistas'
import StepHorario from './components/StepHorario'
import StepDatos from './components/StepDatos'
import ReservaConfirmada from './components/ReservaConfirmada'

export default function Reserva({ servicios, estilistas, preSel, onOpenLegal }) {
  const [bloqueos] = useCollection('bloqueos')

  const [paso, setPaso] = useState(1)
  const [servId, setServId] = useState(null)
  const [estId, setEstId] = useState('cualquiera')
  const [fecha, setFecha] = useState(hoy())
  const [turno, setTurno] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [citaConfirmada, setCitaConfirmada] = useState(null)
  const [errorServidor, setErrorServidor] = useState('')

  // Sincronizar si el usuario seleccionó un servicio desde la carta exterior
  useEffect(() => {
    if (preSel) {
      setServId(preSel)
      setPaso(2)
      setCitaConfirmada(null)
    }
  }, [preSel])

  // Servicio seleccionado
  const servicioSeleccionado = useMemo(
    () => servicios.find((s) => s.id === servId),
    [servicios, servId]
  )

  // 14 días disponibles a partir de hoy (excluyendo días de cierre)
  const diasDisponibles = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => addDays(hoy(), i)).filter((d) => {
      const dayOfWeek = new Date(d + 'T12:00:00').getDay()
      return !NEGOCIO.horario.diasCerrados.includes(dayOfWeek)
    })
  }, [])

  // Turnos calculados a través del servicio
  const turnosDisponibles = useMemo(() => {
    if (!servicioSeleccionado) return []
    return getAvailableSlots({
      fecha,
      duracion: Number(servicioSeleccionado.duracion),
      estilistaId: estId,
      estilistas,
      bloqueos,
    })
  }, [servicioSeleccionado, fecha, estId, estilistas, bloqueos])

  // Estilista resuelto para el turno (si eligió 'cualquiera', el turno ya viene con el estilistaId específico asignado)
  const estilistaTurno = useMemo(() => {
    if (!turno) return null
    return estilistas.find((e) => e.id === turno.estilistaId) || null
  }, [turno, estilistas])

  // Handlers de selección
  const handleSelectServicio = (id) => {
    setServId(id)
    setTurno(null)
    setPaso(2)
  }

  const handleSelectEstilista = (id) => {
    setEstId(id)
    setTurno(null)
    setPaso(3)
  }

  const handleSelectFecha = (f) => {
    setFecha(f)
    setTurno(null)
  }

  const handleSelectTurno = (t) => {
    setTurno(t)
    setPaso(4)
  }

  // Envío a través del servicio desacoplado
  const handleConfirmarReserva = async ({ cliente, telefono, notas }) => {
    if (!servicioSeleccionado || !turno || !estilistaTurno) {
      setErrorServidor('Por favor completa todos los pasos de selección antes de confirmar.')
      return
    }

    setErrorServidor('')
    setEnviando(true)

    const resultado = await submitAppointment({
      cliente,
      telefono,
      notas,
      servicio: servicioSeleccionado,
      estilista: estilistaTurno,
      fecha,
      hora: turno.hora,
      origen: 'web',
    })

    if (resultado.success) {
      setCitaConfirmada(resultado.cita)
    } else {
      setErrorServidor(
        resultado.error ||
          'No se pudo registrar la cita. Por favor intenta nuevamente o contáctanos por WhatsApp.'
      )
    }

    setEnviando(false)
  }

  const handleReiniciar = () => {
    setCitaConfirmada(null)
    setPaso(1)
    setServId(null)
    setEstId('cualquiera')
    setTurno(null)
    setErrorServidor('')
  }

  // Si la cita ya está confirmada, mostrar pantalla de éxito
  if (citaConfirmada) {
    return (
      <div className="booking-container">
        <ReservaConfirmada cita={citaConfirmada} onReiniciar={handleReiniciar} />
      </div>
    )
  }

  const stepsList = [
    { num: 1, label: 'Servicio' },
    { num: 2, label: 'Estilista' },
    { num: 3, label: 'Fecha y Hora' },
    { num: 4, label: 'Tus Datos' },
  ]

  return (
    <div className="booking-container card">
      {/* Stepper de navegación táctil */}
      <ol className="stepper-nav" aria-label="Progreso de la reserva">
        {stepsList.map(({ num, label }) => {
          const isActive = paso === num
          const isDone = paso > num
          return (
            <li
              key={num}
              className={'step-item' + (isActive ? ' active' : isDone ? ' done' : '')}
              onClick={() => isDone && setPaso(num)}
              role="button"
              tabIndex={isDone ? 0 : -1}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="step-circle">{isDone ? '✓' : num}</span>
              <span className="step-label">{label}</span>
            </li>
          )
        })}
      </ol>

      {/* Migas de pan / botón volver en móviles */}
      {paso > 1 && (
        <div className="step-back-bar">
          <button
            type="button"
            className="btn-back-step"
            onClick={() => setPaso((prev) => Math.max(1, prev - 1))}
          >
            ← Volver al paso anterior
          </button>
        </div>
      )}

      {/* Contenido según el paso activo */}
      <div className="step-view-content">
        {paso === 1 && (
          <StepServicios
            servicios={servicios}
            servId={servId}
            onSelectServicio={handleSelectServicio}
          />
        )}

        {paso === 2 && (
          <StepEstilistas
            estilistas={estilistas}
            estId={estId}
            onSelectEstilista={handleSelectEstilista}
          />
        )}

        {paso === 3 && servicioSeleccionado && (
          <StepHorario
            dias={diasDisponibles}
            fecha={fecha}
            turnos={turnosDisponibles}
            onSelectFecha={handleSelectFecha}
            onSelectTurno={handleSelectTurno}
            turno={turno}
          />
        )}

        {paso === 4 && servicioSeleccionado && turno && estilistaTurno && (
          <StepDatos
            servicio={servicioSeleccionado}
            estilista={estilistaTurno}
            fecha={fecha}
            turno={turno}
            onSubmit={handleConfirmarReserva}
            enviando={enviando}
            errorServidor={errorServidor}
            onOpenLegal={onOpenLegal}
          />
        )}
      </div>
    </div>
  )
}
