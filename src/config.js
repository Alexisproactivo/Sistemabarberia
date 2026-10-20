// ⚙️ Datos del negocio: cámbialos por los de la peluquería real.
export const NEGOCIO = {
  nombre: 'Studio Capilar',
  slogan: 'Peluquería & Barbería',
  descripcion: 'Cortes, color y tratamientos con estilistas profesionales. Reserva tu cita en menos de un minuto.',
  whatsapp: '51999999999',            // con código de país, sin + ni espacios
  telefono: '999 999 999',
  direccion: 'Av. Ejemplo 123, Arequipa',
  mapaUrl: 'https://maps.google.com/?q=Arequipa',
  instagram: 'https://instagram.com/',
  facebook: 'https://facebook.com/',
  moneda: 'S/',
  horario: {
    apertura: '09:00',
    cierre: '20:00',
    intervalo: 30,          // minutos entre turnos
    diasCerrados: [],       // 0 = domingo, 1 = lunes ... ej: [0] para cerrar domingos
    texto: 'Lun a Dom · 9:00 am – 8:00 pm',
  },
  diasMaxReserva: 30,       // hasta cuántos días adelante se puede reservar
}

export const CATEGORIAS = ['Cortes', 'Barbería', 'Color', 'Tratamientos', 'Uñas', 'Otros']
export const METODOS_PAGO = ['Efectivo', 'Yape', 'Plin', 'Tarjeta', 'Transferencia']
export const ESTADOS = {
  pendiente: { label: 'Pendiente', color: '#c98a1b' },
  confirmada: { label: 'Confirmada', color: '#2f7fb8' },
  completada: { label: 'Completada', color: '#2e8b57' },
  cancelada: { label: 'Cancelada', color: '#b23b3b' },
  noasistio: { label: 'No asistió', color: '#777' },
}
