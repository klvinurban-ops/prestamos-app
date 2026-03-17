# PrestamosPro

Aplicación web lista para producción para gestionar préstamos personales: clientes, préstamos, pagos, ganancias y cobranza de vencidos.

- **¿Primera vez?** → Configura Supabase paso a paso: **[SETUP-SUPABASE.md](SETUP-SUPABASE.md)**
- **¿La app no abre o el PC va lento?** → Sigue: **[COMO-ABRIR-LA-APP.md](COMO-ABRIR-LA-APP.md)**

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Supabase** (base de datos + autenticación)
- **TailwindCSS**
- **React Server Components** (layout, auth)
- **Recharts** (gráficos mensuales)
- **Vercel** (deploy)

## Requisitos

- Node.js 18+
- Cuenta [Supabase](https://supabase.com)

## Instalación

```bash
npm install
```

## Variables de entorno

Copia el ejemplo y rellena con tu proyecto Supabase:

```bash
cp .env.example .env.local
```

En `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

Obtén la URL y la **anon key** en: [Supabase](https://app.supabase.com) → tu proyecto → **Settings** → **API**.

## Base de datos

En el **SQL Editor** de tu proyecto Supabase, ejecuta el contenido de:

```
supabase/schema.sql
```

Crea las tablas `clients`, `loans` y `payments` con relaciones e índices.

## Autenticación

La app usa **Supabase Auth**. Crea al menos un usuario en Supabase:

- **Authentication** → **Users** → **Add user** (email + contraseña)

Solo los usuarios autenticados pueden acceder a las páginas (excepto `/login`).

## Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Serás redirigido a `/login` si no has iniciado sesión, o a `/dashboard` si ya estás autenticado.

### Si localhost:3000 no abre (error de memoria)

Si al ejecutar `npm run dev` aparece **"JavaScript heap out of memory"** o la terminal se cierra sin abrir el navegador:

1. **Cierra otras aplicaciones** (navegadores con muchas pestañas, IDE, etc.) para liberar RAM.
2. **Usa el script con más memoria** (recomendado en Windows):
   - Doble clic en **`run-dev.cmd`**, o
   - En PowerShell: `.\run-dev.ps1`
3. **O manualmente** en una terminal (PowerShell o CMD):
   ```bash
   set NODE_OPTIONS=--max-old-space-size=4096
   npm run dev
   ```
4. Si sigue fallando, prueba con **8192** en lugar de 4096 (necesitas al menos 8 GB de RAM libres).

## Páginas

| Ruta | Descripción |
|------|-------------|
| `/login` | Inicio de sesión |
| `/dashboard` | Resumen, tarjetas de estadísticas y gráfico de cobros mensuales |
| `/clients` | Lista de clientes (búsqueda) |
| `/clients/new` | Alta de cliente |
| `/clients/[id]` | Perfil del cliente y sus préstamos |
| `/clients/[id]/edit` | Editar cliente |
| `/loans` | Lista de préstamos (filtro por estado) |
| `/loans/new` | Crear préstamo |
| `/loans/[id]` | Detalle del préstamo e historial de pagos |
| `/payments` | Registrar pago e historial |
| `/overdue` | Préstamos vencidos, días de atraso y clientes de riesgo |
| `/reports` | Resumen, rendimiento y gráfico de ganancias; exportar reporte |

## Funcionalidad principal

- **Dashboard**: total prestado, cobrado, ganancia por interés, préstamos activos/vencidos y gráfico de cobros por mes.
- **Clientes**: nombre, teléfono, documento, dirección, notas, `created_at`; crear, editar, eliminar y perfil con préstamos.
- **Préstamos**: cliente, monto, tasa, total a cobrar (calculado), saldo, fechas, estado (activo/pagado/vencido); filtro por estado.
- **Pagos**: registrar pago; actualización automática de `remaining_balance` y estado del préstamo (pagado cuando saldo ≤ 0).
- **Vencidos**: lista de préstamos vencidos, días vencidos y clientes de riesgo (30+ días).
- **Reportes**: resumen general, rendimiento de préstamos, gráfico de ganancias mensuales y exportar reporte (.txt).

## Lógica de negocio

- **Al crear un préstamo**: `total_amount = amount + (amount * interest_rate / 100)`; `remaining_balance = total_amount`.
- **Al registrar un pago**: `remaining_balance` disminuye; si `remaining_balance <= 0` el préstamo pasa a estado `paid`.
- **Si `due_date < hoy` y estado no es `paid`**: el préstamo se considera `overdue`.

## Despliegue en Vercel

1. Conecta el repositorio en [Vercel](https://vercel.com).
2. Añade las variables de entorno: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Deploy. No se requiere configuración extra para Next.js App Router.

## Build local

```bash
npm run build
npm start
```

## Estructura del proyecto

```
app/
  page.tsx              → Redirige / a /dashboard
  layout.tsx             → Layout raíz (html, body)
  globals.css
  (auth)/login/          → Página de login (sin sidebar)
  (app)/                 → Rutas con Sidebar + TopNavbar
    layout.tsx
    dashboard/           → Dashboard y gráfico mensual
    clients/             → Lista, nuevo, perfil [id], editar [id]/edit
    loans/               → Lista (filtro), nuevo, detalle [id]
    payments/            → Registrar pago + historial
    overdue/             → Préstamos vencidos y clientes de riesgo
    reports/             → Resumen, gráficos, exportar
  api/payments/          → POST: registrar pago (actualiza saldo y estado)
lib/
  supabaseClient.ts      → Cliente Supabase en el navegador (Auth, datos)
  supabaseServer.ts      → Cliente Supabase en servidor (RSC, API)
  supabase.ts            → Re-export para compatibilidad
components/
  Sidebar.tsx, TopNavbar.tsx, DashboardCards.tsx, MonthlyEarningsChart.tsx,
  ClientForm.tsx, ClientsTable.tsx, LoanForm.tsx, LoansTable.tsx, PaymentForm.tsx
types/
  database.ts            → Tipos de Supabase (Client, Loan, Payment)
middleware.ts            → Protege rutas; redirige a /login si no hay sesión
supabase/
  schema.sql             → Script para crear tablas en Supabase
```
