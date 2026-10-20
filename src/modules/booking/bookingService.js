// Servicio de gestión de citas y reservas
// Desacopla la lógica de negocio y llamadas a la BD del renderizado de la UI

import { crearCita } from '../../lib/db'
import { turnosDisponibles, fechaLarga, hora12, linkWhatsApp } from '../../lib/utils'
import { NEGOCIO } from '../../config'
import { createBookingPayload } from './bookingModel'

/**
 * Registra una nueva cita en la base de datos (Firestore o local demo)
 * usando el modelo sanitizado y validado.
 */
export async function submitAppointment({
  cliente,
  telefono,
  notas,
  servicio,
  estilista,
  fecha,
  hora,
  origen = 'web',
}) {
  try {
    const payload = createBookingPayload({
      cliente,
      telefono,
      notas,
      servicio,
      estilista,
      fecha,
      hora,
      origen,
    })

    const citaId = await crearCita(payload)
    return {
      success: true,
      citaId,
      cita: payload,
    }
  } catch (error) {
    console.error('[bookingService.submitAppointment] Error al registrar cita:', error)
    return {
      success: false,
      error: error.message || 'Error inesperado al registrar la cita.',
    }
  }
}

/**
 * Consulta de turnos disponibles para un servicio y fecha específicos
 */
export function getAvailableSlots({ fecha, duracion, estilistaId, estilistas, bloqueos }) {
  if (!fecha || !duracion || !estilistas) return []
  return turnosDisponibles({
    fecha,
    duracion: Number(duracion),
    estilistaId,
    estilistas,
    bloqueos,
  })
}

/**
 * Genera el deep link de confirmación hacia WhatsApp con el mensaje estructurado de la cita
 */
export function buildWhatsAppConfirmationUrl(cita, negocio = NEGOCIO) {
  if (!cita) return '#'
  const primerNombre = (cita.cliente || '').split(' ')[0] || 'Cliente'
  const mensaje = [
    `¡Hola ${negocio.nombre}! 👋`,
    `Acabo de agendar una cita en su plataforma web:`,
    `• Servicio: *${cita.servicioNombre}*`,
    `• Estilista: *${cita.estilistaNombre}*`,
    `• Fecha: *${fechaLarga(cita.fecha)}*`,
    `• Hora: *${hora12(cita.hora)}*`,
    `• Cliente: *${cita.cliente}*`,
    `• Teléfono: *${cita.telefono}*`,
    cita.notas ? `• Comentarios: _${cita.notas}_` : null,
    `Quedo atento(a) a la confirmación de mi turno. ¡Muchas gracias!`,
  ]
    .filter(Boolean)
    .join('\n')

  return linkWhatsApp(negocio.whatsapp, mensaje)
}

/**
 * Genera enlace de WhatsApp para dudas, reprogramaciones o consultas generales
 */
export function buildWhatsAppInquiryUrl(asunto = 'información', negocio = NEGOCIO) {
  const mensaje = `Hola ${negocio.nombre}, quisiera consultar sobre ${asunto}.`
  return linkWhatsApp(negocio.whatsapp, mensaje)
}
