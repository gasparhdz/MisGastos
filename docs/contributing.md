# Guía de contribución

Esta guía aplica a desarrolladores humanos y asistentes de IA que trabajen en el proyecto.

## Propósito del proyecto

Mis Gastos **no es un gestor financiero**. Es una nota mensual para organizar qué pagar y qué cobrar este mes.

Antes de agregar cualquier funcionalidad, preguntate:

> ¿Ayuda realmente a organizar qué tengo que pagar o cobrar este mes?

Si la respuesta es no, no la implementes — o cuestionala primero.

## Reglas fundamentales

### 1. No convertir la app en un gestor financiero

Evitar:

- Presupuestos, categorías, etiquetas
- Gráficos, reportes, dashboards financieros
- Conexión con bancos, tarjetas o APIs de cotización automática
- Multi-cuenta, multi-moneda compleja, contabilidad

### 2. Mantener simplicidad

- Una pantalla principal que responda las cuatro preguntas clave
- Sin tablas tipo Excel ni interfaces recargadas
- Preferir menos opciones antes que más configuración

### 3. Reutilizar componentes

- Usar `AppModal` para cualquier diálogo nuevo
- Extender componentes de `src/components/ui/` antes de crear variantes
- Revisar `src/features/` por lógica o UI similar antes de escribir código nuevo

### 4. Evitar duplicación

- Si detectás estilos o patrones repetidos, refactorizar
- Extraer utilidades compartidas a `src/utils/` o al feature correspondiente
- No copiar bloques de JSX entre componentes

### 5. Priorizar UX mobile

- Diseñar primero para pantallas chicas
- Respetar safe-area en modales y acciones inferiores
- Botones y áreas táctiles con tamaño cómodo para el pulgar
- Desktop es secundario, no el punto de partida

### 6. Mantener build limpio

Antes de considerar terminado un cambio:

```bash
npm run build
```

Debe pasar sin errores de TypeScript ni de Vite.

## Qué no modificar sin necesidad

- Lógica de negocio establecida (totales, copiar mes, estados de movimiento)
- Esquema de Supabase y políticas RLS
- Contratos de React Query (keys, invalidaciones)
- Validaciones Zod del formulario de movimientos

Los cambios de UI y refactor de infraestructura son bienvenidos si no alteran el comportamiento funcional.

## Estructura del proyecto

```
src/
├── app/           # Rutas y providers
├── components/    # UI compartida (AppModal, layout, shadcn)
├── features/      # Dominio: auth, items, month, summary
├── pages/         # Páginas de alto nivel
├── lib/           # Supabase, queryClient, utils
└── utils/         # Helpers transversales
```

Nuevo código de dominio va en `features/`, no en `pages/` directamente.

## Criterios para nuevas funcionalidades

| Pregunta | Si la respuesta es no… |
|----------|------------------------|
| ¿Responde cuánto pagar/cobrar este mes? | Descartar |
| ¿Se puede hacer más simple? | Simplificar antes de implementar |
| ¿Ya existe algo similar en el código? | Reutilizar o extender |
| ¿Afecta mobile de forma negativa? | Rediseñar |
| ¿Rompe el build? | No mergear |

## Documentación

Al tomar decisiones técnicas relevantes, actualizar [decisions.md](decisions.md).

Las ideas futuras van en [roadmap.md](roadmap.md) — no implementarlas en el mismo PR que las documenta.

## Commits

Mensajes claros y en español o inglés, según preferencia del equipo. Ejemplos:

- `feat: agregar indicador de vencimiento vencido`
- `refactor: unificar estilos de sección de pagos`
- `docs: actualizar guía de instalación PWA`

## Referencias

- [Visión del proyecto](vision.md)
- [Decisiones técnicas](decisions.md)
- [Roadmap](roadmap.md)
- [README](../README.md)
