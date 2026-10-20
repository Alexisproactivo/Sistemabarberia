import { useState } from 'react'
import { useCollection, add, update, remove } from '../lib/db'
import { money, comprimirImagen, iniciales, exportarExcel } from '../lib/utils'
import { CATEGORIAS } from '../config'
import { Modal, PageHead, BotonConfirmar } from './ui.jsx'

// CRUD genérico configurable por campos
function Crud({ titulo, col, campos, vacio, columnas, imgKey }) {
  const [rows] = useCollection(col)
  const [edit, setEdit] = useState(null)
  const [q, setQ] = useState('')
  const lista = rows.filter((r) => (r.nombre || '').toLowerCase().includes(q.toLowerCase())).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))

  const guardar = async (e) => {
    e.preventDefault()
    const { id, ...data } = edit
    campos.filter((c) => c.type === 'number').forEach((c) => { data[c.key] = Number(data[c.key] || 0) })
    if (id) await update(col, id, data); else await add(col, data)
    setEdit(null)
  }
  const borrar = async () => { await remove(col, edit.id); setEdit(null) }
  const subirImg = async (e) => { const f = e.target.files?.[0]; if (f) setEdit({ ...edit, [imgKey]: await comprimirImagen(f) }) }

  return (
    <>
      <PageHead title={titulo}>
        <input className="search" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-ghost dark sm" onClick={() => exportarExcel(rows.map(({ id, [imgKey]: _i, ...r }) => r), col, titulo)}>Exportar</button>
        <button className="btn btn-gold sm" onClick={() => setEdit({ ...vacio })}>+ Agregar</button>
      </PageHead>
      <div className="card table-wrap">
        <table>
          <thead><tr><th></th>{columnas.map((c) => <th key={c.key} className={c.r ? 'r' : ''}>{c.label}</th>)}<th>Estado</th></tr></thead>
          <tbody>
            {lista.map((r) => (
              <tr key={r.id} className="click" onClick={() => setEdit({ ...r })}>
                <td className="thumb">{r[imgKey] ? <img src={r[imgKey]} alt="" /> : <div className="avatar sm">{iniciales(r.nombre)}</div>}</td>
                {columnas.map((c, i) => <td key={c.key} data-label={c.label} className={(c.r ? 'r ' : '') + (i === 0 ? 'cell-title' : '')}>{c.fmt ? c.fmt(r[c.key], r) : r[c.key]}</td>)}
                <td data-label="Estado">{r.activo === false ? <span className="badge off">Oculto</span> : <span className="badge on">Visible</span>}</td>
              </tr>
            ))}
            {!lista.length && <tr><td colSpan={columnas.length + 2} className="muted center">Sin registros.</td></tr>}
          </tbody>
        </table>
      </div>
      {edit && (
        <Modal title={edit.id ? 'Editar' : 'Agregar'} onClose={() => setEdit(null)}>
          <form className="form" onSubmit={guardar}>
            <div className="img-edit">
              {edit[imgKey] ? <img src={edit[imgKey]} alt="" /> : <div className="avatar xl">{iniciales(edit.nombre) || '+'}</div>}
              <div>
                <label className="btn btn-ghost dark sm">Subir imagen<input type="file" accept="image/*" hidden onChange={subirImg} /></label>
                {edit[imgKey] && <button type="button" className="link" onClick={() => setEdit({ ...edit, [imgKey]: '' })}>Quitar</button>}
              </div>
            </div>
            <div className="crud-fields-grid">
              {campos.map((c) => (
                <label key={c.key} className={c.type === 'textarea' ? 'full-width' : ''}>
                  <span>{c.label}</span>
                  {c.type === 'select' ? (
                    <select value={edit[c.key]} onChange={(e) => setEdit({ ...edit, [c.key]: e.target.value })}>
                      {c.options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  ) : c.type === 'textarea' ? (
                    <textarea rows="2" value={edit[c.key] || ''} onChange={(e) => setEdit({ ...edit, [c.key]: e.target.value })} />
                  ) : (
                    <input
                      type={c.type || 'text'}
                      required={c.required}
                      min={c.type === 'number' ? 0 : undefined}
                      step={c.step}
                      value={edit[c.key] ?? ''}
                      onChange={(e) => setEdit({ ...edit, [c.key]: e.target.value })}
                    />
                  )}
                </label>
              ))}
            </div>
            <label className="check-inline"><input type="checkbox" checked={edit.activo !== false} onChange={(e) => setEdit({ ...edit, activo: e.target.checked })} /> Visible en la web y disponible</label>
            <div className="row-between">
              {edit.id ? <BotonConfirmar className="btn btn-danger sm" pregunta="¿Eliminar? Toca otra vez" onConfirm={borrar}>Eliminar</BotonConfirmar> : <span />}
              <button className="btn btn-gold">Guardar</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

export const Servicios = () => (
  <Crud titulo="Servicios" col="servicios" imgKey="imagen"
    vacio={{ nombre: '', categoria: CATEGORIAS[0], precio: '', duracion: 30, descripcion: '', imagen: '', activo: true }}
    campos={[
      { key: 'nombre', label: 'Nombre', required: true },
      { key: 'categoria', label: 'Categoría', type: 'select', options: CATEGORIAS },
      { key: 'precio', label: 'Precio', type: 'number', step: '0.5', required: true },
      { key: 'duracion', label: 'Duración (minutos)', type: 'number', step: '5', required: true },
      { key: 'descripcion', label: 'Descripción', type: 'textarea' },
    ]}
    columnas={[
      { key: 'nombre', label: 'Servicio' }, { key: 'categoria', label: 'Categoría' },
      { key: 'duracion', label: 'Duración', fmt: (v) => `${v} min` }, { key: 'precio', label: 'Precio', r: true, fmt: money },
    ]} />
)

export const Equipo = () => (
  <Crud titulo="Equipo" col="estilistas" imgKey="foto"
    vacio={{ nombre: '', especialidad: '', telefono: '', comision: 0, foto: '', activo: true }}
    campos={[
      { key: 'nombre', label: 'Nombre', required: true },
      { key: 'especialidad', label: 'Especialidad' },
      { key: 'telefono', label: 'Celular', type: 'tel' },
      { key: 'comision', label: 'Comisión (%)', type: 'number', step: '1' },
    ]}
    columnas={[{ key: 'nombre', label: 'Nombre' }, { key: 'especialidad', label: 'Especialidad' }, { key: 'comision', label: 'Comisión', r: true, fmt: (v) => `${v || 0}%` }]} />
)

export const Productos = () => (
  <Crud titulo="Productos" col="productos" imgKey="imagen"
    vacio={{ nombre: '', precio: '', stock: 0, imagen: '', activo: true }}
    campos={[
      { key: 'nombre', label: 'Nombre', required: true },
      { key: 'precio', label: 'Precio de venta', type: 'number', step: '0.5', required: true },
      { key: 'stock', label: 'Stock', type: 'number', step: '1' },
    ]}
    columnas={[
      { key: 'nombre', label: 'Producto' },
      { key: 'stock', label: 'Stock', r: true, fmt: (v) => <span className={Number(v) <= 3 ? 'err' : ''}>{v}</span> },
      { key: 'precio', label: 'Precio', r: true, fmt: money },
    ]} />
)
