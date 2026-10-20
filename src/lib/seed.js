import { hoy, addDays } from './utils'

// Datos de ejemplo para el MODO DEMO
export function seed() {
  const servicios = [
    ['s1', 'Corte de caballero', 'Cortes', 25, 30, 'Corte clásico o moderno con lavado y peinado.'],
    ['s2', 'Corte de dama', 'Cortes', 35, 45, 'Corte personalizado según tu tipo de rostro, incluye lavado.'],
    ['s3', 'Corte de niño', 'Cortes', 20, 30, 'Para los más pequeños, con paciencia y cariño.'],
    ['s4', 'Perfilado de barba', 'Barbería', 15, 20, 'Perfilado con navaja y toalla caliente.'],
    ['s5', 'Corte + Barba', 'Barbería', 35, 45, 'El combo completo para caballeros.'],
    ['s6', 'Tinte completo', 'Color', 90, 120, 'Coloración uniforme con productos profesionales.'],
    ['s7', 'Mechas / Balayage', 'Color', 180, 150, 'Iluminación natural con técnica a mano alzada.'],
    ['s8', 'Keratina', 'Tratamientos', 150, 120, 'Alisado y nutrición profunda, hasta 3 meses.'],
    ['s9', 'Hidratación capilar', 'Tratamientos', 45, 45, 'Mascarilla intensiva para cabello seco o dañado.'],
    ['s10', 'Lavado + Planchado', 'Tratamientos', 30, 45, 'Peinado liso o con ondas para cualquier ocasión.'],
    ['s11', 'Manicure', 'Uñas', 25, 45, 'Limpieza, forma y esmaltado tradicional.'],
    ['s12', 'Uñas acrílicas', 'Uñas', 70, 90, 'Set completo con diseño a elección.'],
  ].map(([id, nombre, categoria, precio, duracion, descripcion]) => ({ id, nombre, categoria, precio, duracion, descripcion, imagen: '', activo: true }))

  const estilistas = [
    { id: 'e1', nombre: 'Carla Mendoza', especialidad: 'Color y balayage', foto: '', activo: true },
    { id: 'e2', nombre: 'Miguel Quispe', especialidad: 'Barbería y cortes', foto: '', activo: true },
    { id: 'e3', nombre: 'Rosa Huamán', especialidad: 'Uñas y tratamientos', foto: '', activo: true },
  ]

  const productos = [
    { id: 'p1', nombre: 'Shampoo profesional 500ml', precio: 45, stock: 12, imagen: '', activo: true },
    { id: 'p2', nombre: 'Cera para peinar', precio: 25, stock: 20, imagen: '', activo: true },
    { id: 'p3', nombre: 'Aceite de argán', precio: 38, stock: 8, imagen: '', activo: true },
    { id: 'p4', nombre: 'Tratamiento sin enjuague', precio: 32, stock: 3, imagen: '', activo: true },
  ]

  const clientes = ['Lucía Torres', 'Jorge Ramos', 'Ana Flores', 'Diego Paredes', 'Valeria Cruz', 'Luis Chávez', 'Sofía Rojas', 'Marco Díaz']
  const metodos = ['Efectivo', 'Yape', 'Yape', 'Plin', 'Tarjeta']
  const citas = [], bloqueos = [], ventas = []
  let n = 0
  const rnd = (i) => { const x = Math.sin(i * 9301 + 49297) * 233280; return x - Math.floor(x) }

  for (let d = -20; d <= 3; d++) {
    const fecha = addDays(hoy(), d)
    const cuantas = 3 + Math.floor(rnd(d + 50) * 5)
    for (let k = 0; k < cuantas; k++) {
      n++
      const s = servicios[Math.floor(rnd(n) * servicios.length)]
      const e = estilistas[Math.floor(rnd(n + 7) * 3)]
      const cl = clientes[Math.floor(rnd(n + 3) * clientes.length)]
      const hora = `${String(9 + k * 2).padStart(2, '0')}:${rnd(n + 1) > 0.5 ? '30' : '00'}`
      const estado = d < 0 ? (rnd(n + 9) > 0.1 ? 'completada' : 'noasistio') : d === 0 ? (k < 2 ? 'completada' : 'confirmada') : 'pendiente'
      const id = 'c' + n
      citas.push({
        id, cliente: cl, telefono: '9' + String(10000000 + Math.floor(rnd(clientes.indexOf(cl)) * 89999999)),
        servicioId: s.id, servicioNombre: s.nombre, precio: s.precio, duracion: s.duracion,
        estilistaId: e.id, estilistaNombre: e.nombre, fecha, hora, estado, notas: '', origen: k % 2 ? 'web' : 'local',
        creado: Date.now() - (20 - d) * 864e5,
      })
      if (estado !== 'cancelada' && estado !== 'noasistio') bloqueos.push({ id: 'b' + n, citaId: id, estilistaId: e.id, fecha, hora, duracion: s.duracion })
      if (estado === 'completada') {
        const items = [{ tipo: 'servicio', refId: s.id, nombre: s.nombre, precio: s.precio, cantidad: 1 }]
        if (rnd(n + 11) > 0.75) items.push({ tipo: 'producto', refId: 'p2', nombre: 'Cera para peinar', precio: 25, cantidad: 1 })
        ventas.push({
          id: 'v' + n, fecha, hora, cliente: cl, telefono: citas.at(-1).telefono, estilistaId: e.id, estilistaNombre: e.nombre,
          items, total: items.reduce((a, i) => a + i.precio * i.cantidad, 0), metodo: metodos[Math.floor(rnd(n + 5) * metodos.length)],
          citaId: id, creado: Date.now() - (20 - d) * 864e5,
        })
      }
    }
  }
  return { servicios, estilistas, productos, citas, bloqueos, ventas }
}
