import { useState } from 'react'
import { money, fechaLarga, hora12 } from '../../lib/utils'
import { sanitizeClientName, sanitizePhone, sanitizeNotes, validatePhone, validateClientName } from '../../modules/booking/bookingModel'

export default function StepDatos({
  servicio,
  estilista,
  fecha,
  turno,
  onSubmit,
  enviando,
  errorServidor,
  onOpenLegal,
}) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [notas, setNotas] = useState('')
  const [aceptaTerminos, setAceptaTerminos] = useState(true)
  const [formErrors, setFormErrors] = useState({})

  const handleNombreChange = (e) => {
    const raw = e.target.value
    const sanitized = sanitizeClientName(raw)
    setNombre(sanitized)
    if (formErrors.nombre) {
      setFormErrors((prev) => ({ ...prev, nombre: null }))
    }
  }

  const handleTelefonoChange = (e) => {
    const raw = e.target.value
    const sanitized = sanitizePhone(raw)
    setTelefono(sanitized)
    if (formErrors.telefono) {
      setFormErrors((prev) => ({ ...prev, telefono: null }))
    }
  }

  const handleNotasChange = (e) => {
    setNotas(sanitizeNotes(e.target.value))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const errors = {}
    const nameCheck = validateClientName(nombre)
    if (!nameCheck.valid) {
      errors.nombre = nameCheck.error
    }

    const phoneCheck = validatePhone(telefono)
    if (!phoneCheck.valid) {
      errors.telefono = phoneCheck.error
    }

    if (!aceptaTerminos) {
      errors.terminos = 'Debes aceptar la política de privacidad y términos para continuar.'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})
    onSubmit({
      cliente: nameCheck.sanitized,
      telefono: phoneCheck.sanitized,
      notas: sanitizeNotes(notas),
    })
  }

  return (
    <form className="booking-step-datos" onSubmit={handleSubmit} noValidate>
      <div className="booking-summary-card">
        <div className="summary-header">
          <span className="summary-title">Resumen de tu cita</span>
          <b className="summary-price">{money(servicio?.precio)}</b>
        </div>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Servicio</span>
            <span className="summary-val">{servicio?.nombre}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Estilista</span>
            <span className="summary-val">{estilista?.nombre || 'Por asignar'}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Fecha</span>
            <span className="summary-val">{fechaLarga(fecha)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Horario</span>
            <span className="summary-val">
              {hora12(turno.hora)} ({servicio?.duracion} min)
            </span>
          </div>
        </div>
      </div>

      <div className="form-fields">
        <div className="field-group">
          <label htmlFor="input-nombre" className="field-label">
            Nombre y apellido <span className="req">*</span>
          </label>
          <input
            id="input-nombre"
            type="text"
            required
            autoComplete="name"
            maxLength={60}
            className={'field-input' + (formErrors.nombre ? ' input-err' : '')}
            placeholder="Ej. Rodrigo Mendoza"
            value={nombre}
            onChange={handleNombreChange}
          />
          {formErrors.nombre && <p className="field-error-msg">{formErrors.nombre}</p>}
        </div>

        <div className="field-group">
          <label htmlFor="input-telefono" className="field-label">
            Número de celular (WhatsApp) <span className="req">*</span>
          </label>
          <div className={'phone-input-wrap' + (formErrors.telefono ? ' input-err' : '')}>
            <span className="phone-prefix">+51 (PE)</span>
            <input
              id="input-telefono"
              type="tel"
              inputMode="numeric"
              required
              autoComplete="tel"
              maxLength={9}
              className="phone-field"
              placeholder="9XX XXX XXX"
              value={telefono}
              onChange={handleTelefonoChange}
            />
          </div>
          <span className="field-hint">
            Ingresa tu número de 9 dígitos. Te enviaremos la confirmación de la cita a este número.
          </span>
          {formErrors.telefono && <p className="field-error-msg">{formErrors.telefono}</p>}
        </div>

        <div className="field-group">
          <label htmlFor="input-notas" className="field-label">
            Comentarios o requerimientos especiales (opcional)
          </label>
          <textarea
            id="input-notas"
            rows={2}
            maxLength={250}
            className="field-textarea"
            placeholder="Ej. Prefiero degradado bajo, traigo foto de referencia, cabello ondulado..."
            value={notas}
            onChange={handleNotasChange}
          />
          <small className="char-count">{notas.length}/250</small>
        </div>

        <div className="legal-consent-box">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
            />
            <span>
              He leído y acepto la{' '}
              <button
                type="button"
                className="legal-inline-link"
                onClick={() => onOpenLegal('privacidad')}
              >
                Política de Privacidad
              </button>{' '}
              y los{' '}
              <button
                type="button"
                className="legal-inline-link"
                onClick={() => onOpenLegal('terminos')}
              >
                Términos de Servicio (Tolerancia de 10 min)
              </button>
              .
            </span>
          </label>
          {formErrors.terminos && <p className="field-error-msg">{formErrors.terminos}</p>}
        </div>

        {errorServidor && <div className="alert-server-error">{errorServidor}</div>}

        <button
          type="submit"
          className="btn btn-gold block submit-booking-btn"
          disabled={enviando}
        >
          {enviando ? (
            <>
              <span className="spinner-dot" /> Confirmando reserva...
            </>
          ) : (
            'Confirmar Reserva'
          )}
        </button>
      </div>
    </form>
  )
}
