# Claude Code Conventions: Madar Dashboard

## Project Overview
The management dashboard for the Madar ecosystem: a React 19 + Vite app, also packaged
as a desktop app with Tauri. This repo builds **four** bundles from one codebase — the
authenticated dashboard, the public ordering page, the order-tracking page, and the
marketing landing site (see the `vite.*.config.ts` files and the `dev:*` scripts).

It is a *consumer* of the backend: every API type and hook under
`src/data/api/generated/` is generated from the backend's OpenAPI spec. Do not hand-edit
generated files.

## The Madar ecosystem — three repos

| Repo | Path | Role |
|---|---|---|
| **MadarRust** | `/Users/magd/MadarRust` | Actix-Web API, Postgres schema, money/cost engine. **The contract.** |
| **MadarDashboard** (this) | `/Users/magd/MadarDashboard` | React 19 management dashboard + public ordering + landing |
| **madar** | `/Users/magd/madar` | Flutter POS/teller + KDS over a shared Rust core |

The backend's `openapi.json` is the single source of truth. When the API changes:

```bash
cd /Users/magd/MadarRust && cargo run --bin export-openapi
cd /Users/magd/MadarDashboard && npm run generate:api      # orval → src/data/api/generated
```

**The dashboard AUTHORS, the POS OPERATES.** Broadly: this app writes configuration
(menu, pricing, floor geometry, permissions, settings); the POS writes operational
state (orders, table occupancy, shifts). Where both touch one entity, the split is
explicit — see "Floor / tables" below. When you change a shared surface, check
`/Users/magd/madar/packages/features/` for the POS half.

## Core Technology Stack
- **Framework**: React 19, Vite, TypeScript
- **Routing**: **TanStack Router** (file-based, `src/routes/`, generated
  `src/routeTree.gen.ts`). *Not* React Router.
- **State**: Zustand (client/global) + TanStack React Query (server state)
- **API**: Orval-generated hooks over Axios (`src/data/api/`)
- **Forms**: React Hook Form + Zod v4
- **Desktop**: Tauri (`@tauri-apps/api`, `src-tauri/`)
- **Testing**: Vitest + Testing Library (jsdom), co-located `*.test.ts(x)`
- **Mocking**: MSW (`src/data/api/mock/`), enabled by `VITE_MOCK=1`

## UI & Styling
- Tailwind CSS + Radix UI primitives, `clsx`/`tailwind-merge`
- Lucide icons, Lottie, TanStack Table, Recharts
- i18n via `i18next`/`react-i18next` — **always** wrap UI strings in `t()`, and add keys
  to both `src/i18n/locales/en.json` and `ar.json`. Arabic is first-class, RTL included.

## Development Commands
- `npm run dev` — real API (`VITE_API_URL`, see `.env`), port 5173
- `npm run dev:mock` — MSW mock data, port 5180. **Use this to see features without a backend.**
- `npm run dev:order` / `dev:get` / `dev:demo` — the other bundles
- `npm run build` — typecheck (`tsc --noEmit`) then Vite build
- `npm run test` — Vitest; `npm run lint` — ESLint (`--max-warnings 0`)
- `npm run generate:api` — regenerate the API client (Orval)
- `npm run tauri:dev` / `tauri:build` — desktop

## Architecture

```
src/
  routes/          TanStack Router file routes → routeTree.gen.ts (generated)
  features/<name>/ One folder per feature: page + its components + util.ts (+ tests)
  components/
    ui/            Radix/shadcn primitives — generic, no domain knowledge
    app/           Composed app-level components (data-table, page, empty-state, …)
  data/
    api/
      generated/   ORVAL OUTPUT — do not edit by hand
      mock/        MSW handlers + seeded data (dev only)
      client.ts    Axios instance, auth/org/branch headers, 401 handling
      errors.ts    getErrorMessage — use for every toast on a failed request
    stores/        Zustand stores (auth, app)
    scope/         Selected org/branch scope (useScope)
  i18n/locales/    en.json + ar.json
  lib/             Pure helpers (format, motion, utils)
  styles/          globals.css — the design tokens' source of truth
```

Feature folders are self-contained: a page, its components, a `util.ts` for shared
vocabulary/helpers, and co-located tests. Prefer extending a feature's `util.ts` over
scattering constants across components.

## Architecture Guidelines
1. **API integration** — never hand-write fetches. Use the generated hooks; regenerate
   via `npm run generate:api` when the backend changes.
2. **Components** — build on Radix primitives (`components/ui`), styled with Tailwind.
3. **Forms** — Zod schema + React Hook Form, always. Surface submit failures: a Save
   button that silently does nothing is the worst outcome a form can have.
4. **Errors** — `toast.error(getErrorMessage(e))`; never swallow a failed mutation.
5. **Design tokens** — use the semantic CSS variables (`--color-success`, …). Never
   raw hex in components.

## Design Context
Strategic intent lives in [`PRODUCT.md`](PRODUCT.md); the visual system in
[`DESIGN.md`](DESIGN.md) and `src/styles/globals.css` (source of truth).
- **Register is split.** The authenticated dashboard is **product** (quiet, precise,
  restrained — design serves the task). The customer surfaces (`landing`,
  `/order/:orgId`, `/track/:id`) are **brand** (bold, editorial, hospitable).
- **Personality:** trustworthy, hospitable, precise. Navy = trust, terracotta =
  warmth/CTA, cream = hospitality.
- **Accessibility bar:** WCAG 2.1 AAA where feasible (AA floor). RTL parity and
  `prefers-reduced-motion` are correctness requirements, not extras.
- **Anti-references (never):** generic SaaS-cream template, loud delivery-app neon,
  enterprise-grey snoozefest, consumer toy-like.

### Colour and contrast, concretely
A state's colour token is fine for a 3px ring and useless for 12px text. Measured on
their own tinted chips, the raw `--color-success/-warning/-destructive/-primary` tokens
land at **1.8–3.7:1** in light mode — below the 4.5:1 AA floor. Pulling the tint halfway
to the page foreground fixes it while keeping the hue readable as amber/red/green:

```
color-mix(in oklch, var(--color-warning) 50%, var(--color-foreground))
```

That formula measures **5.6–9.2:1 in both themes** (one formula, because `foreground`
already flips with the theme where white/black would not). Measure in the browser rather
than assuming — `--color-warning` in particular is far too light for text on its own.

## Floor / tables — the feature that spans all three repos
`src/features/floor/` is the dashboard half of a feature shared with the POS.

- **Authoring vs operating.** This app authors geometry (`floor_plan` permission);
  the POS owns live table status (`reservations` permission). The properties panel
  deliberately has no status setter.
- **The canvas is an UNBOUNDED plane.** Tables may sit anywhere, including negative
  coordinates. The viewport (`Viewport`/`fitView`/`zoomAt` in `features/floor/util.ts`)
  pans and zooms over it. Never reintroduce clamping, and never frame a canvas by a
  stored width — frame it to *content*, or tables outside the old rectangle vanish.
- **Three tones, not two.** `available` / `seated` / `dirty`. `dirty` = "needs
  clearing": a checkout hands the table over in that state and it stays there until a
  human clears it on the POS. Folding it into "available" overstates what the room can
  seat. `held` *is* folded in — it's a short-lived teller hold.
- **The glyph is shared.** `features/floor/table-glyph.tsx` and the POS's
  `_TableCell`/`seatSlots` (`/Users/magd/madar/packages/features/order/lib/src/tables_screen.dart`)
  draw the same object from the same constants, in canvas units. Change one, change both.
- State must never rest on colour alone — every tone carries a glyph, and
  needs-clearing is additionally hatched.

## Inventory — count-first
`src/features/inventory/` follows the backend's v2 model (`../MadarRust/INVENTORY_V2.md`):
the dashboard never writes an on-hand figure. It counts (Stock counts), wastes,
transfers and receives; every quantity on screen comes from the ledger. Stock counts
list the whole catalog for a branch (`is_new` rows have never moved there), flag
differences against live `book_qty` with the same rule the server enforces
(`lib.ts` → `isVarianceFlagged`), and the Today page shows a first-run card until a
branch has one finalized count. Ingredient categories come from the API
(`useListIngredientCategories`), never from a hard-coded list.

## Gotchas
- **Mock mode + service worker.** `dev:mock` needs MSW's worker
  (`public/mockServiceWorker.js`). After switching dev servers on the same port, a
  stale worker can make requests fall through to the real API while React Query still
  serves cache — the UI looks alive but writes fail. Hard-reload to re-register.
- **Mock handlers match the absolute cross-origin base.** They are written as
  `*/path` against `VITE_API_URL`; pointing the API base at a same-origin path breaks
  every read (requests fall through to Vite's SPA fallback and return HTML).
- **The mock floor store is in-memory** — a page reload re-seeds the room.
- **RTL: a floor plan is physical space.** Never mirror the canvas. Use flex `gap`
  rather than margins for chips whose text is bidi-reordered.
