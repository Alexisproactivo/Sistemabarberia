// Modelo y sanitizadores de entrada para la captura de reservas
// Valida estrictamente datos de cliente antes de enviar a BD o WhatsApp

/**
 * Limpia cadenas de texto removiendo etiquetas HTML completas y caracteres de control
 */
export function cleanString(str = '') {
  if (typeof str !== 'string') return ''
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, '') // Elimina etiquetas HTML completas
    .replace(/["'`;]/g, '') // Elimina comillas y caracteres susceptibles de inyección
    .replace(/[\x00-\x1F\x7F]/g, '') // Elimina caracteres de control
    .trim()
}

/**
 * Sanitiza el nombre del cliente: solo letras, tildes, ñ, espacios y guiones
 */
export function sanitizeClientName(name = '') {
  if (typeof name !== 'string') return ''
  return cleanString(name)
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s-]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 60)
}

/**
 * Valida el nombre del cliente
 */
export function validateClientName(name = '') {
  const sanitized = sanitizeClientName(name)
  if (!sanitized || sanitized.length < 2) {
    return {
      valid: false,
      error: 'Por favor, ingresa tu nombre y apellido (mínimo 2 caracteres).',
      sanitized: '',
    }
  }
  return { valid: true, error: null, sanitized }
}

/**
 * Sanitiza número telefónico: elimina todo lo que no sea dígito.
 * Normaliza si el usuario escribió prefijo de Perú '51' o '+51'.
 */
export function sanitizePhone(phone = '') {
  if (typeof phone !== 'string' && typeof phone !== 'number') return ''
  let digits = String(phone).replace(/\D/g, '')

  // Si tiene 11 dígitos y empieza con 519..., remover el prefijo de país 51
  if (digits.length === 11 && digits.startsWith('519')) {
    digits = digits.slice(2)
  }

  return digits.slice(0, 9)
}

/**
 * Validación estricta de teléfono móvil peruano (9 dígitos iniciando con 9)
 */
export function validatePhone(phone = '') {
  const sanitized = sanitizePhone(phone)
  // Celular válido en Perú: 9 dígitos comenzando por 9
  const regex = /^9\d{8}$/

  if (!sanitized) {
    return {
      valid: false,
      error: 'Ingresa un número de celular de 9 dígitos.',
      sanitized: '',
    }
  }

  if (!regex.test(sanitized)) {
    return {
      valid: false,
      error: 'Ingresa un celular válido de 9 dígitos que empiece con 9 (ej. 987 654 321).',
      sanitized,
    }
  }

  return { valid: true, error: null, sanitized }
}

/**
 * Sanitiza notas u observaciones adicionales
 */
export function sanitizeNotes(notes = '') {
  if (typeof notes !== 'string') return ''
  return cleanString(notes)
    .replace(/\s+/g, ' ')
    .slice(0, 250)
}

/**
 * Ensambla el payload de la cita respetando el esquema estricto de Firestore / Demo
 */
export function createBookingPayload({
  cliente,
  telefono,
  notas = '',
  servicio,
  estilista,
  fecha,
  hora,
  origen = 'web',
}) {
  const validName = validateClientName(cliente)
  if (!validName.valid) throw new Error(validName.error)

  const validPhone = validatePhone(telefono)
  if (!validPhone.valid) throw new Error(validPhone.error)

  if (!servicio || !servicio.id || !servicio.nombre) {
    throw new Error('Servicio no especificado o inválido.')
  }

  if (!estilista || !estilista.id || !estilista.nombre) {
    throw new Error('Estilista no especificado o inválido.')
  }

  if (!fecha || !hora) {
    throw new Error('Fecha y hora del turno son requeridas.')
  }

  return {
    cliente: validName.sanitized,
    telefono: validPhone.sanitized,
    notas: sanitizeNotes(notas),
    servicioId: servicio.id,
    servicioNombre: String(servicio.nombre).trim(),
    precio: Number(servicio.precio || 0),
    duracion: Number(servicio.duracion || 30),
    estilistaId: estilista.id,
    estilistaNombre: String(estilista.nombre).trim(),
    fecha: String(fecha).trim(),
    hora: String(hora).trim(),
    estado: 'pendiente',
    origen,
  }
}
