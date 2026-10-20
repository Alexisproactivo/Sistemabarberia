import { useState, useEffect } from 'react'
import { ESTADOS } from '../config'

// Botón de dos toques (confirmación segura sin popup bloqueante del navegador)
export function BotonConfirmar({ onConfirm, children, pregunta = '¿Seguro?', className = '', type = 'button' }) {
  const [arm, setArm] = useState(false)
  useEffect(() => {
    if (!arm) return
    const t = setTimeout(() => setArm(false), 4000)
    return () => clearTimeout(t)
  }, [arm])

  return (
    <button
      type={type}
      className={className + (arm ? ' armed' : '')}
      onClick={() => (arm ? (setArm(false), onConfirm()) : setArm(true))}
    >
      {arm ? pregunta : children}
    </button>
  )
}

export const Badge = ({ estado }) => {
  const e = ESTADOS[estado] || { label: estado, color: '#777' }
  return (
    <span
      className="badge"
      style={{
        color: e.color,
        background: e.color + '1a',
        borderColor: e.color + '55',
      }}
    >
      {e.label}
    </span>
  )
}

export const Kpi = ({ label, value, sub }) => (
  <div className="kpi card">
    <small>{label}</small>
    <b>{value}</b>
    {sub && <span>{sub}</span>}
  </div>
)

/**
 * Modal administrativo rediseñado:
 * Fondo sólido oscuro (#12141a), esquinas redondeadas (12px),
 * cabecera limpia con título contrastado y botón cerrar (x) accesible.
 */
export function Modal({ title, onClose, children, wide }) {
  return (
    <div
      className="modal-bg"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className={'modal card' + (wide ? ' wide' : '')}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button
            type="button"
            className="x"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>
        <div className="modal-body-content">
          {children}
        </div>
      </div>
    </div>
  )
}

export const PageHead = ({ title, children }) => (
  <div className="page-head">
    <h1>{title}</h1>
    <div className="actions">{children}</div>
  </div>
)
