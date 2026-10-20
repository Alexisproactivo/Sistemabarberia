# Studio Capilar · Web + Panel de gestión

Mismo stack que Snake Store: **React 18 + Vite + Firebase (Firestore/Auth)**, deploy automático a **GitHub Pages**.

- **Web pública** (`/`): servicios con precios y filtros, equipo, productos, **reserva de citas online** en 4 pasos con horarios libres en tiempo real, confirmación por WhatsApp, botón flotante de WhatsApp.
- **Panel admin** (`?view=admin`):
  - **Resumen**: ingresos hoy/mes, ticket promedio, gráficos (Recharts) de ingresos 14 días, servicios top y por estilista, alerta de stock bajo y **QR de reservas** descargable.
  - **Agenda**: citas por día/estilista, confirmar, cobrar, marcar no-asistió/cancelar, recordatorio por WhatsApp, cita manual (con sobrecupo), exportar a Excel.
  - **Caja (POS)**: servicios + productos, descuento, Yape/Plin/Efectivo/Tarjeta, cálculo de vuelto, descuenta stock, historial con totales por método, ticket imprimible, exportar a Excel.
  - **Clientes**: se arman solos desde citas/ventas — visitas, gasto total, última visita, faltas, WhatsApp para reactivar.
  - **Servicios / Equipo / Productos**: CRUD con fotos comprimidas (800px / 70% JPEG).

## Probar en modo demo (sin Firebase)
```bash
npm install
npm run dev
```
Abre http://localhost:5173 y el panel en http://localhost:5173/?view=admin (o `#admin`)
Usuario demo: `admin@demo.com` / `admin123`. Los datos se guardan en el navegador (localStorage).

## Conectar a Firebase (producción)
1. Crea un proyecto en Firebase → activa **Firestore** y **Authentication (Email/Password)**.
2. En Authentication crea el usuario del dueño/recepción (solo ellos entran al panel).
3. Copia `.env.example` a `.env` y pega la config web de Firebase.
4. Publica las reglas: copia `firestore.rules` en Firestore → Reglas.
5. Carga los servicios y estilistas desde el panel (en Firebase arranca vacío).

## Deploy en GitHub Pages
1. Sube el repo a GitHub (rama `main`).
2. Settings → Secrets and variables → Actions: agrega los 6 `VITE_FIREBASE_*`.
3. Settings → Pages → Source: **GitHub Actions**.
4. Cada push a `main` despliega solo.

## Personalizar
Todo lo del negocio (nombre, WhatsApp, dirección, horario, días cerrados, moneda) está en `src/config.js`.

## Estructura
```
src/
  config.js          datos del negocio
  lib/db.js          capa de datos (Firestore o localStorage)
  lib/auth.js        login
  lib/utils.js       horarios, turnos libres, Excel, compresión de imágenes
  public/            web pública + reserva
  admin/             panel: Dashboard, Agenda, Caja, Clientes, Catálogos
firestore.rules      reglas de seguridad
```
