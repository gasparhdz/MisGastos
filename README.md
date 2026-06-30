# Mis Gastos

Nota mensual para organizar qué tenés que pagar, qué te tienen que pagar, cuándo vencen las cosas y cuánto dinero necesitás para afrontar el mes.

No es una app de finanzas personales: reemplaza una nota mensual que hacés todos los meses.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod
- TanStack Query
- Supabase (Auth + Postgres)
- PWA con `vite-plugin-pwa`
- Deploy en Vercel

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

## PWA

La app es instalable en iPhone y Android como Progressive Web App.

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

## Deploy (Vercel)

1. Conectá el repositorio en [vercel.com](https://vercel.com).
2. Framework preset: **Vite**.
3. Agregá las variables de entorno en el dashboard de Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Cada push a `main` genera un deploy automático.

HTTPS es obligatorio para que la PWA sea instalable en dispositivos móviles.

## Documentación

- [Visión del proyecto](docs/vision.md)
- [Roadmap](docs/roadmap.md)
- [Decisiones técnicas](docs/decisions.md)

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm run generate-icons` | Genera iconos PWA desde el SVG |
