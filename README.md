# Trazabilidad Leadmind

Migración a **Next.js 14 (App Router) + TypeScript** del prototipo `Trazabilidad Leadmind.dc.html`
(Consulta y trazabilidad de activos y piezas — Leadmind / CAF).

## Qué incluye

- `app/` — App Router de Next.js (`layout.tsx`, `page.tsx`, `globals.css`).
- `components/TrazabilidadApp.tsx` — pantalla completa "Consultar" + "Trazabilidad por flota",
  con toda la lógica de estado (árbol de flota, selección, histórico, atributos, filtros)
  portada 1:1 desde el script original del prototipo.
- `components/ui/` — piezas del design system reimplementadas en React
  (botones, select, checkbox, tabs, breadcrumb, tags, celdas de tabla, etc.).
- `lib/data.ts` — datos de ejemplo (flota "Urbos 100") y helpers de árbol/histórico,
  portados del script embebido en el `.dc.html` original.
- `styles/tokens/` — **tokens de diseño originales** del sistema Leadmind
  (`fig-tokens.css`, `leadmind.tokens.css`, `semantic.css`, `base.css`, `fonts.css`),
  importados tal cual en `app/globals.css`.
- `public/assets/` — logo CAF, logo Leadmind e icono de ubicación, copiados del proyecto original.

## Requisitos

- Node.js 18.18+ (recomendado 20 LTS)

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Build de producción

```bash
npm run build
npm start
```

## Subir a GitHub

```bash
git init
git add .
git commit -m "Migración inicial a Next.js"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
git push -u origin main
```

`node_modules` y `.next` ya están excluidos vía `.gitignore`.

## Desplegar (opcional)

El proyecto es un Next.js estándar, así que se puede desplegar directamente en
[Vercel](https://vercel.com/new) importando el repo de GitHub, o en cualquier
plataforma compatible con Node.js (`npm run build && npm start`).

## Notas de la migración

- Los componentes `x-import` del prototipo (`MatSelect`, `MatButtonTonal`, `Breadcrumb`,
  `PiecesNavlistItemNested`, etc.) se reimplementaron como componentes React en `components/ui/`,
  manteniendo colores, tipografía y espaciados del original.
- Los iconos (`Icon` en el prototipo) se mapean a [`lucide-react`](https://lucide.dev/) por nombre
  en `components/ui/Icon.tsx`. Si necesitas un icono exacto que no esté mapeado, añádelo ahí.
- La lógica de estado (pantalla Consultar ↔ Flota, árbol expandible, selección múltiple,
  histórico ordenable, filtros de atributos con chips) está en `components/TrazabilidadApp.tsx`
  usando `useState`, equivalente al `class Component extends DCLogic` del script original.
- Los datos de la flota "Urbos 100" son de ejemplo (mock), igual que en el prototipo original;
  sustitúyelos por una llamada a tu API/backend cuando esté disponible (por ejemplo, en
  `lib/data.ts` o vía `fetch` en un Server Component).
