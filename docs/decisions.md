# Decisiones técnicas

Registro de las principales decisiones tomadas hasta hoy.

## Arquitectura

| Decisión | Motivo |
|----------|--------|
| Sin backend Node propio | Menos infraestructura; Supabase cubre auth, DB y API |
| Supabase como única persistencia | CRUD simple con RLS por usuario; deploy solo de frontend |
| TanStack Query para datos remotos | Cache, refetch y estados de carga sin boilerplate manual |

## Frontend

| Decisión | Motivo |
|----------|--------|
| React + Vite + TypeScript | Stack moderno, build rápido, tipado en todo el proyecto |
| Tailwind + shadcn/ui | Componentes accesibles y consistentes sin diseñar desde cero |
| React Hook Form + Zod | Validación declarativa alineada con el formulario de movimientos |
| Feature folders (`auth`, `items`, `summary`, `month`) | Separación por dominio, no por tipo de archivo |
| `AppModal` compartido | Overlay, safe-area y cierre consistentes en todos los diálogos |

## Modelo de datos

| Decisión | Motivo |
|----------|--------|
| Movimientos por mes/año | Refleja la rutina mensual real del usuario |
| Tipos `PAY` / `COLLECT` | Dos flujos claros: pagar y cobrar |
| Monto original + cotización USD → ARS | Soporta gastos en dólares con conversión explícita |
| `completed` boolean | Estado simple: pendiente o hecho, sin estados intermedios |

## Copiar mes anterior

No es una copia exacta: es una **plantilla**.

- Conserva: tipo, concepto, moneda
- Reinicia: monto, cotización, vencimiento, completado

Así se reutiliza la estructura del mes sin arrastrar datos del período anterior.

## PWA

| Decisión | Motivo |
|----------|--------|
| `vite-plugin-pwa` + Workbox | Manifest y service worker generados en build sin configuración manual |
| `display: standalone` | Experiencia de app nativa en iPhone y Android |
| Iconos generados desde SVG (`sharp`) | Un solo source of truth; tamaños derivados con script |

## Deploy

| Decisión | Motivo |
|----------|--------|
| Vercel | Deploy automático del frontend estático con HTTPS incluido |
| Variables `VITE_*` en entorno | Credenciales fuera del código; build-time injection de Vite |

## Seguridad

| Decisión | Motivo |
|----------|--------|
| `.env.local` en `.gitignore` | Las claves de Supabase no se versionan |
| Solo `anon key` en el cliente | La `service_role` key nunca va al frontend |
| RLS en Supabase | Cada usuario solo accede a sus propios movimientos |
