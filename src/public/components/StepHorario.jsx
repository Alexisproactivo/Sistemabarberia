import { hora12 } from '../../lib/utils'

export default function StepHorario({ dias, fecha, turnos, onSelectFecha, onSelectTurno, turno }) {
  return (
    <div className="booking-step-horario">
      <div className="section-subtitle">1. Selecciona el día</div>
      <div className="days-carousel" role="tablist" aria-label="Días disponibles">
        {dias.map((d) => {
          const dt = new Date(d + 'T12:00:00')
          const isSelected = d === fecha
          return (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={'day-pill' + (isSelected ? ' selected' : '')}
              onClick={() => onSelectFecha(d)}
            >
              <span className="day-weekday">
                {dt.toLocaleDateString('es-PE', { weekday: 'short' })}
              </span>
              <b className="day-number">{dt.getDate()}</b>
              <span className="day-month">
                {dt.toLocaleDateString('es-PE', { month: 'short' })}
              </span>
            </button>
          )
        })}
      </div>

      <div className="section-subtitle" style={{ marginTop: 22 }}>
        2. Selecciona la hora
      </div>

      {turnos.length === 0 ? (
        <div className="empty-slots-msg">
          <p>No hay turnos libres en este día para la opción seleccionada.</p>
          <small>Prueba seleccionando otra fecha en el calendario superior.</small>
        </div>
      ) : (
        <div className="slots-grid">
          {turnos.map((t) => {
            const isSelected = turno?.hora === t.hora && turno?.estilistaId === t.estilistaId
            return (
              <button
                key={`${t.hora}-${t.estilistaId}`}
                type="button"
                className={'time-slot-btn' + (isSelected ? ' selected' : '')}
                onClick={() => onSelectTurno(t)}
              >
                <span className="slot-time">{hora12(t.hora)}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
