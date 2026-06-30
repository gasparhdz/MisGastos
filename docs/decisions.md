# Decisiones técnicas

Registro de las decisiones importantes tomadas hasta hoy. Sirve como contexto para quien continúe el desarrollo.

## Supabase sin backend propio

| Decisión | Detalle |
|----------|---------|
| Sin servidor Node | Toda la persistencia y autenticación vía Supabase |
| Frontend estático | Deploy solo del bundle Vite en Vercel |
| TanStack Query | Cache, refetch y estados de carga sin boilerplate manual |
| RLS en Postgres | Cada usuario solo accede a sus propios movimientos |

**Motivo:** El dominio es CRUD simple por usuario. No justifica mantener un backend intermedio.

## Copiar mes anterior como plantilla

No es una copia exacta del mes previo. Es una **plantilla** para arrancar el mes nuevo.

| Conserva | Reinicia |
|----------|----------|
| Tipo (pago/cobro) | Monto = 0 |
| Concepto | Cotización = null |
| Moneda | Vencimiento = null |
| | Completado = false |

**Motivo:** Los conceptos se repiten cada mes, pero montos y fechas se completan de nuevo.

## App mobile-first

| Decisión | Detalle |
|----------|---------|
| Layout vertical | Tarjetas y listas, no tablas tipo Excel |
| Safe area iOS | Modales y footer respetan `env(safe-area-inset-bottom)` |
| Bottom sheet en móvil | Modales se abren desde abajo; centrados en desktop |
| Acciones flotantes | Crear y copiar mes accesibles con el pulgar |

**Motivo:** El uso principal es desde el celular, revisando el mes en segundos.

## AppModal reutilizable

Todos los diálogos (`ItemFormModal`, `CopyPreviousMonthDialog`, `DeleteItemDialog`) usan un único componente base: `AppModal`.

Centraliza:

- Portal, overlay, blur y z-index
- Animaciones y border radius
- Header, botón cerrar y footer
- Scroll interno y safe-area
- Cierre con Escape, overlay y bloqueo de scroll del body

**Motivo:** Consistencia visual sin duplicar estructura de modales en cada pantalla.

## PWA

| Decisión | Detalle |
|----------|---------|
| `vite-plugin-pwa` | Manifest y service worker generados en build |
| `display: standalone` | Experiencia de app nativa en iPhone y Android |
| Iconos desde SVG | Script `generate-icons` con `sharp` como source of truth |
| HTTPS en producción | Requerido para instalación en dispositivos móviles |

**Motivo:** Abrir desde la pantalla de inicio como si fuera app nativa, sin pasar por la tienda.

## Stack frontend

| Decisión | Motivo |
|----------|--------|
| React + Vite + TypeScript | Build rápido, tipado, ecosistema maduro |
| Tailwind + shadcn/ui | Componentes accesibles sin diseñar desde cero |
| React Hook Form + Zod | Validación declarativa en el formulario de movimientos |
| Feature folders | `auth`, `items`, `summary`, `month` — separación por dominio |

## Modelo de datos

| Decisión | Motivo |
|----------|--------|
| Movimientos por mes/año | Refleja la rutina mensual real |
| Tipos `PAY` / `COLLECT` | Dos flujos claros: pagar y cobrar |
| Monto original + cotización USD → ARS | Gastos en dólares con conversión explícita |
| `completed` boolean | Estado simple: pendiente o hecho |

## Seguridad

| Decisión | Motivo |
|----------|--------|
| `.env.local` en `.gitignore` | Claves fuera del repositorio |
| Solo `anon key` en el cliente | `service_role` nunca en el frontend |
| Variables `VITE_*` | Inyección en build-time, no hardcodeadas en código |
