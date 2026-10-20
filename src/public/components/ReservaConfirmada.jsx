import { NEGOCIO } from '../../config'
import { fechaLarga, hora12, money } from '../../lib/utils'
import { buildWhatsAppConfirmationUrl } from '../../modules/booking/bookingService'

export default function ReservaConfirmada({ cita, onReiniciar }) {
  const whatsappUrl = buildWhatsAppConfirmationUrl(cita, NEGOCIO)
  const primerNombre = (cita.cliente || '').split(' ')[0] || 'Estimado(a)'

  return (
    <div className="booking-confirmed-card">
      <div className="confirmed-badge-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <span className="tag" style={{ margin: '0 auto 8px' }}>Reserva Confirmada</span>
      <h3 className="confirmed-title">¡Todo listo, {primerNombre}!</h3>
      <p className="confirmed-lead">
        Tu cita ha quedado registrada exitosamente en nuestro sistema de agenda.
      </p>

      <div className="confirmed-details-card">
        <div className="detail-row">
          <span className="detail-label">Servicio</span>
          <b className="detail-val">{cita.servicioNombre}</b>
        </div>
        <div className="detail-row">
          <span className="detail-label">Estilista</span>
          <b className="detail-val">{cita.estilistaNombre}</b>
        </div>
        <div className="detail-row highlight-row">
          <span className="detail-label">Fecha & Hora</span>
          <b className="detail-val highlight-gold">
            {fechaLarga(cita.fecha)} · {hora12(cita.hora)}
          </b>
        </div>
        <div className="detail-row">
          <span className="detail-label">Total a pagar en salón</span>
          <b className="detail-val">{money(cita.precio)}</b>
        </div>
        <div className="detail-row">
          <span className="detail-label">Ubicación</span>
          <span className="detail-val">{NEGOCIO.direccion}</span>
        </div>
      </div>

      <div className="policy-notice-banner">
        ⏱ <strong>Tolerancia:</strong> Recuerda que dispones de <strong>10 minutos de tolerancia</strong> respecto a tu hora pactada. Si necesitas reprogramar, por favor avísanos con 2 horas de anticipación.
      </div>

      <div className="confirmed-actions">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-gold btn-whatsapp-confirm"
        >
          <span className="wa-icon" aria-hidden="true">💬</span> Confirmar por WhatsApp
        </a>

        <button
          type="button"
          onClick={onReiniciar}
          className="btn btn-ghost dark"
        >
          Agendar otra cita
        </button>
      </div>
    </div>
  )
}
