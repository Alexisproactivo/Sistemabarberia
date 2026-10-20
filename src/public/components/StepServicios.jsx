import { useMemo, useState } from 'react'
import { money } from '../../lib/utils'

export default function StepServicios({ servicios, servId, onSelectServicio }) {
  const [activeCategory, setActiveCategory] = useState('Todos')

  const categories = useMemo(() => {
    const set = new Set(servicios.map((s) => s.categoria).filter(Boolean))
    return ['Todos', ...Array.from(set)]
  }, [servicios])

  const filtered = useMemo(() => {
    if (activeCategory === 'Todos') return servicios
    return servicios.filter((s) => s.categoria === activeCategory)
  }, [servicios, activeCategory])

  return (
    <div className="booking-step-servicios">
      <div className="chips-row">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={'chip-btn' + (activeCategory === cat ? ' active' : '')}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="pick-list">
        {filtered.map((s) => {
          const isSelected = s.id === servId
          return (
            <button
              key={s.id}
              type="button"
              className={'pick-item' + (isSelected ? ' selected' : '')}
              onClick={() => onSelectServicio(s.id)}
            >
              <div className="pick-info">
                <span className="pick-name">{s.nombre}</span>
                <span className="pick-meta">
                  <span className="pick-badge">{s.categoria}</span>
                  <span className="pick-dur">⏱ {s.duracion} min</span>
                </span>
                {s.descripcion && <p className="pick-desc">{s.descripcion}</p>}
              </div>
              <div className="pick-price-col">
                <b className="price">{money(s.precio)}</b>
                <span className="pick-action">{isSelected ? '✓ Elegido' : 'Elegir'}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
