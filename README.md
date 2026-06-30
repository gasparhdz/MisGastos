# Mis Gastos

## Descripción

Mis Gastos es una nota mensual digital para organizar pagos y cobros pendientes del mes. Reemplaza la planilla o nota que se arma todos los meses para saber qué hay que pagar, qué hay que cobrar y cuánto dinero hace falta.

**No es un gestor financiero.** No reemplaza apps de finanzas personales, presupuestos ni contabilidad.

## Objetivo

Abrir la app y en menos de 10 segundos responder:

- ¿Cuánto tengo que pagar?
- ¿Qué vence primero?
- ¿Qué ya pagué?
- ¿Cuánto me tienen que pagar?

Si una funcionalidad no ayuda con eso, probablemente no pertenece a esta aplicación.

## Stack

| Capa | Tecnología |
|------|------------|
| UI | React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Build | Vite |
| Formularios | React Hook Form + Zod |
| Datos remotos | TanStack Query |
| Backend | Supabase (Auth + Postgres, sin servidor Node propio) |
| PWA | `vite-plugin-pwa` |
| Deploy | Vercel |

## Instalación

```bash
git clone https://github.com/gasparhdz/MisGastos.git
cd MisGastos
npm install
```

## Variables de entorno

Copiá `.env.example` a `.env.local` y completá las credenciales de tu proyecto Supabase:

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_publica
```

Las variables se obtienen en **Supabase Dashboard → Project Settings → API**.

> Nunca subas `.env`, `.env.local` ni claves reales al repositorio.

## Desarrollo

```bash
npm run dev
```

La app corre en `http://localhost:5173` (o el siguiente puerto disponible).

## Build

```bash
npm run build
npm run preview
```

`npm run build` ejecuta verificación de TypeScript y genera el bundle de producción en `dist/`, incluyendo el manifest y el service worker de la PWA.

## PWA

La app es instalable en iPhone y Android como Progressive Web App (`display: standalone`).

### Iconos

Se generan desde `public/icons/icon.svg`:

```bash
npm run generate-icons
```

### Instalar en iPhone

1. Abrí la app en **Safari**.
2. Tocá **Compartir** (cuadrado con flecha hacia arriba).
3. Elegí **Agregar a pantalla de inicio**.
4. Confirmá el nombre **Mis Gastos** y tocá **Agregar**.

### Instalar en Android

1. Abrí la app en **Chrome**.
2. Tocá el menú (⋮) o el banner de instalación.
3. Elegí **Instalar aplicación** o **Agregar a pantalla de inicio**.

### Colores del manifest

| Propiedad | Valor |
|-----------|-------|
| `theme_color` | `#0F766E` |
| `background_color` | `#FAF9F6` |

## Deploy

### Vercel

1. Conectá el repositorio en [vercel.com](https://vercel.com).
2. Framework preset: **Vite**.
3. Agregá las variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Cada push a `main` genera un deploy automático.

HTTPS es obligatorio para que la PWA sea instalable en dispositivos móviles.

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [docs/vision.md](docs/vision.md) | Filosofía y propósito del proyecto |
| [docs/roadmap.md](docs/roadmap.md) | Ideas futuras (sin implementar) |
| [docs/decisions.md](docs/decisions.md) | Decisiones técnicas registradas |
| [docs/contributing.md](docs/contributing.md) | Guía para desarrolladores y asistentes de IA |

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build local |
| `npm run generate-icons` | Genera iconos PWA desde el SVG |
