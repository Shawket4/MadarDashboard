# Madar Dashboard

Internal management dashboard for Madar. React + TypeScript + Vite, built around a Rust backend.

## Stack (locked versions in `package.json`)

Vite 6 · React 19 · TypeScript 5.6 · Tailwind 3.4 · shadcn/Radix · TanStack Query v5 · TanStack Table v8 · Zustand v5 · RHF v7 · Zod 3.24 · react-i18next v15 · date-fns v4 · ExcelJS · Recharts · Lucide · sonner · react-router v7.

## Setup

```bash
npm install
cp .env.example .env    # then edit .env to point at your API
npm run dev
```

`.env`:
```
VITE_API_URL=https://madar-pos.cloud/api
```

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — `tsc --noEmit` + `vite build`
- `npm run preview` — preview the production build
- `npm run lint` — ESLint
- `npm run format` — Prettier

## Architecture — Feature-Sliced Design

```
src/
├── app/         # Entry, providers, router, global CSS
├── pages/       # Route-level components (one folder per page)
├── widgets/     # Composed UI blocks (sidebar, header, command palette, layout)
├── features/    # (reserved — page-scoped features currently colocated in pages)
├── entities/    # One folder per domain entity: api.ts + queries.ts + schemas.ts
└── shared/      # ui/ lib/ hooks/ auth/ api/ config/ i18n/ types/
```

**Import rule:** lower layers never import from upper layers. `shared` imports nothing; `entities` import from `shared`; `widgets` from `entities/shared`; `pages` from anywhere below; `app` from anywhere.

## Single source of truth

**`useCurrentContext()`** (in `shared/hooks/use-current-context.ts`) is the ONLY thing that resolves `{ user, role, orgId, branchId, isReady, isSuperAdmin, canManageOrg, canManageBranch }`. Every TanStack query in the app reads `orgId`/`branchId` from this hook, never from Zustand directly — this prevents the "stale context in closure" class of bugs.

The axios client holds ambient `token` / `orgId` / `branchId` values that are injected into every request via an interceptor. The auth store writes to that ambient context on sign-in/out and wires a 401 handler that purges auth and redirects to `/login`.

## i18n (English + real Arabic)

Translations are in `src/shared/i18n/locales/{en,ar}.json`. Arabic is hand-written, not machine-translated. Switching language on `<html dir="...">` happens automatically via i18next's `languageChanged` event. CSS uses logical properties (`ms-*` / `me-*` / `ps-*` / `pe-*`) so every layout flips for RTL without duplicating rules. Numbers use `Intl.NumberFormat("ar-EG")` when locale is Arabic; dates are always Cairo-anchored regardless.

## Excel exports

Every exportable table routes through one place: `exportToExcel(config)` in `src/shared/lib/excel.ts`. Declarative column spec (`ColumnType` ∈ `text | number | money | moneyRaw | integer | percent | date | dateTime | bool`), branded banner with logo, stat pill row, zebra rows, totals row with `SUM` formulas, multi-sheet workbooks, `talabatTot