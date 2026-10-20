import { iniciales } from '../../lib/utils'

export default function StepEstilistas({ estilistas, estId, onSelectEstilista }) {
  return (
    <div className="booking-step-estilistas">
      <div className="pick-stylists-grid">
        <button
          type="button"
          className={'stylist-card' + (estId === 'cualquiera' ? ' selected' : '')}
          onClick={() => onSelectEstilista('cualquiera')}
        >
          <div className="avatar-wrap">
            <div className="avatar any-icon">★</div>
          </div>
          <span className="stylist-name">Cualquiera disponible</span>
          <small className="stylist-meta">Mayor disponibilidad de horarios</small>
          <span className="pick-pill">{estId === 'cualquiera' ? '✓ Seleccionado' : 'Elegir'}</span>
        </button>

        {estilistas.map((e) => {
          const isSelected = estId === e.id
          return (
            <button
              key={e.id}
              type="button"
              className={'stylist-card' + (isSelected ? ' selected' : '')}
              onClick={() => onSelectEstilista(e.id)}
            >
              <div className="avatar-wrap">
                {e.foto ? (
                  <img src={e.foto} alt={e.nombre} className="avatar-img" />
                ) : (
                  <div className="avatar">{iniciales(e.nombre)}</div>
                )}
              </div>
              <span className="stylist-name">{e.nombre}</span>
              <small className="stylist-meta">{e.especialidad || 'Estilista Profesional'}</small>
              <span className="pick-pill">{isSelected ? '✓ Seleccionado' : 'Elegir'}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
