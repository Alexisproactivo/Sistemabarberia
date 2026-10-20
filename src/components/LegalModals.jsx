import { NEGOCIO } from '../config'

/**
 * Componente modal accesible para visualización de textos legales y normativos:
 * - Política de Privacidad (Cumplimiento Ley N° 29733 de Protección de Datos Personales de Perú)
 * - Términos de Servicio y Tolerancia de Turnos (Puntualidad, cancelaciones y condiciones del salón)
 */
export default function LegalModal({ type, onClose }) {
  if (!type) return null

  const isPrivacy = type === 'privacidad'

  return (
    <div className="modal-bg" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal legal-modal card"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="modal-head">
          <div>
            <span className="tag" style={{ marginBottom: 6 }}>
              {isPrivacy ? 'Normativa Legal' : 'Condiciones del Salón'}
            </span>
            <h3>
              {isPrivacy
                ? 'Política de Privacidad y Protección de Datos'
                : 'Términos de Servicio y Tolerancia de Turnos'}
            </h3>
          </div>
          <button className="x" onClick={onClose} aria-label="Cerrar modal">
            ✕
          </button>
        </div>

        <div className="legal-content">
          {isPrivacy ? (
            <>
              <p className="legal-intro">
                En <strong>{NEGOCIO.nombre}</strong> garantizamos la protección, confidencialidad y
                uso legítimo de la información personal de nuestros clientes en estricto cumplimiento
                de la <strong>Ley N° 29733 (Ley de Protección de Datos Personales del Perú)</strong> y su
                reglamento.
              </p>

              <h4>1. Datos recopilados y finalidad</h4>
              <p>
                Al utilizar nuestra plataforma de reservas en línea, solicitamos únicamente datos
                indispensables para la adecuada prestación de nuestros servicios capilares y de barbería:
              </p>
              <ul>
                <li>
                  <strong>Nombre y apellido:</strong> Identificación del cliente para asignación de turno
                  en agenda y ficha de atención.
                </li>
                <li>
                  <strong>Número de teléfono celular (9 dígitos):</strong> Envío de confirmaciones,
                  recordatorios de turno y notificaciones directas exclusivamente mediante WhatsApp.
                </li>
                <li>
                  <strong>Comentarios u observaciones opcionales:</strong> Información sobre el estilo
                  deseado, alergias o referencias del corte/tratamiento.
                </li>
              </ul>

              <h4>2. Uso y confidencialidad</h4>
              <p>
                Los datos personales recolectados no serán compartidos, vendidos, cedidos ni transferidos
                a terceros con fines publicitarios o lucrativos. La información se almacena en bases de datos
                cifradas y protegidas mediante reglas de seguridad de nivel empresarial.
              </p>

              <h4>3. Ejercicio de Derechos ARCO</h4>
              <p>
                Usted puede ejercer en cualquier momento sus derechos de <em>Acceso, Rectificación, Cancelación
                y Oposición (ARCO)</em> respecto a sus datos registrados, comunicándose a nuestra línea oficial de
                atención por WhatsApp al <strong>+{NEGOCIO.whatsapp}</strong> o de manera presencial en
                nuestro establecimiento ubicado en <strong>{NEGOCIO.direccion}</strong>.
              </p>
            </>
          ) : (
            <>
              <p className="legal-intro">
                Para brindar una experiencia puntual, organizada y de máxima calidad a toda nuestra
                comunidad, el servicio en <strong>{NEGOCIO.nombre}</strong> se rige bajo los siguientes
                términos y condiciones:
              </p>

              <h4>1. Tolerancia y puntualidad de turnos</h4>
              <p>
                A fin de respetar el tiempo de los estilistas y de los clientes con turnos continuos, se
                establece una <strong>tolerancia máxima de 10 minutos</strong> contados a partir de la hora
                reservada.
              </p>
              <div className="warn" style={{ margin: '12px 0' }}>
                ⚠️ <strong>Aviso importante:</strong> Transcurridos los 10 minutos de tolerancia sin aviso
                previo, el turno podrá ser liberado para clientes en sala de espera o reprogramado según
                disponibilidad del día.
              </div>

              <h4>2. Cancelaciones y reprogramaciones</h4>
              <p>
                Si no puede asistir a su cita, le solicitamos avisar con un mínimo de{' '}
                <strong>2 horas de anticipación</strong> mediante nuestro enlace de WhatsApp. Esto nos permite
                reorganizar la agenda y brindar el espacio a otro cliente.
              </p>

              <h4>3. Precios y medios de pago</h4>
              <p>
                Las tarifas publicadas en nuestra carta de servicios son expresadas en{' '}
                <strong>Soles ({NEGOCIO.moneda})</strong>. Los pagos se realizan de manera presencial al finalizar
                el servicio mediante Efectivo, Yape, Plin, Tarjeta o Transferencia directa.
              </p>

              <h4>4. Estándares de higiene y salud</h4>
              <p>
                Todo nuestro instrumental (navajas desechables, peines, tijeras y máquinas) pasa por procesos
                estrictos de esterilización y desinfección entre cada atención para garantizar la máxima seguridad
                e higiene.
              </p>
            </>
          )}
        </div>

        <div className="modal-foot" style={{ marginTop: 24, textAlign: 'right' }}>
          <button className="btn btn-gold sm" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
