# Claude Code Conventions: Madar Dashboard

## Project Overview
The management dashboard for the Madar ecosystem: a React 19 + Vite app, also packaged
as a desktop app with Tauri. This repo builds the authenticated dashboard and the public
customer bundles (ordering, tracking, reservations, loyalty) from one codebase (see the
`vite.*.config.ts` files and the `dev:*` scripts). The marketing site
(get.madar-pos.cloud) is a separate Astro package in `site/` with its own dependencies;
read `site/README.md` before touching it, and follow `site/CLAUDE.md` (its design system:
tokens, the one motion vocabulary, the shared kit, how to add a page). It ships no React (Astro components and plain
scripts only); keep it that way. After a visitor's first page it serves itself from one
archive through a service worker, offline included (`site/sw/`,
`site/integrations/pack.mjs`). Code both use lives in `shared/` (plain TypeScript, no
framework, imported as `@shared/…`; see `shared/README.md`), such as the 3D family
showcase on the sign-in panel and the site's home page.

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
- Motion: GSAP, only through `src/lib/motion` (see "Motion" below)
- i18n via `i18next`/`react-i18next` — **always** wrap UI strings in `t()`, and add keys
  to both `src/i18n/locales/en.json` and `ar.json`. Arabic is first-class, RTL included.

## Development Commands
- `npm run dev` — real API (`VITE_API_URL`, see `.env`), port 5173
- `npm run dev:mock` — MSW mock data, port 5180. **Use this to see features without a backend.**
- `npm run dev:order` / `dev:demo` — the other bundles; `dev:get` / `build:get` run the
  marketing site in `site/` (`npm ci --prefix site` once first)
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
  restrained — design serves the task). The customer surfaces (`/order/:orgId`,
  `/track/:id`, and the marketing site in `site/`) are **brand** (bold, editorial,
  hospitable).
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
color-mix(in oklab, var(--color-warning) 50%, var(--color-foreground))
```

That formula measures **5.6–9.2:1 in both themes** (one formula, because `foreground`
already flips with the theme where white/black would not). Measure in the browser rather
than assuming — `--color-warning` in particular is far too light for text on its own.

**Mix in `oklab`, never `oklch`.** `oklch` interpolates the HUE along the shorter arc,
and `--color-foreground` is not hueless in either theme (dark: chroma .005 at hue 205;
light: chroma .017 at hue 250). Mixing destructive (hue 30) halfway toward it in `oklch`
lands near hue 117 in dark mode — a red that renders **green** — and near hue 320
(magenta) in light. It passes a contrast check and still says the opposite of what it
means. `oklab` interpolates in rectangular coordinates, so the hue holds.
Older call sites still mix `in oklch` (grep `in_oklch`); move them to `oklab` when you
touch them, and never copy them.

## Motion
Every animation goes through **`src/lib/motion`** (`import … from "@/lib/motion"`).
GSAP is private to that folder. It is its own chunk, modulepreloaded from the HTML
(`vite/preload-motion.ts`) and imported at boot (`bootMotion()` in each bundle's
`main.tsx`), never on an idle callback. **An entrance is never skipped because GSAP is
not there yet** (`engine.ts`): its targets are hidden before their first paint with
plain inline styles, it waits for GSAP at most `ENTER_PATIENCE_MS` (300 ms), and then
plays the same recipe with the Web Animations API (transform and opacity, the token
eases as `cubic-bezier`). Only if neither is available does it show the final state.
Exits never wait: GSAP, else the Web Animations API, else at once.

**Tokens** (`tokens.ts`, mirrored as CSS variables in `motion.css`; `tokens.test.ts`
fails if the two drift):
- Durations: `fast` 160 ms (hover, press, every exit) · `base` 220 (the product default)
  · `slow` 320 (sheets) · `brand` 500 · `count` 1100 (KPI count-ups and chart draws, in
  lockstep).
- Eases: `out` (entrances) · `in` (exits) · `inOut` · `expo` (brand) · `drawer` (sheets,
  sidebar) · `overshoot` (brand only).
- Plus `DISTANCE` (4/6/12/18 px), `SCALE` and `STAGGER` (a product group lands within
  0.12 s in total, data on skeletons within 0.08 s; brand within 0.3 s).
- In CSS: `duration-fast|base|slow|brand|count`, `ease-out|in|in-out|expo|drawer|overshoot`.
  A bare `transition-colors` already gets `fast` + `out`.

**Registers.**
- **Product** (the dashboard): 160–220 ms, 4–6 px. Motion says what changed (arrived,
  left, moved, updated), never decorates. No overshoot.
- **Brand** (ordering, tracking, reservations, loyalty, sign-in, sign-up, onboarding):
  `register: "brand"` on the same hooks, so it runs longer (500 ms), travels further and
  uses `expo` or `recipes.pop`.

**The vocabulary.** Use the highest-level piece that fits:

| Need | Use |
|---|---|
| Content arriving (a page, a card, data after a skeleton) | `<Reveal>` / `useReveal`, `<SkeletonSwap>` |
| A group arriving one by one (KPIs, rows, cards) | `<Stagger>` / `useStagger` (on-screen items only, capped; product items arrive legible, `recipes.arrive`) |
| A KPI figure | `<CountUp>` (count once, snap after); a live figure: `<AnimatedNumber>`; low level: `useCountUp` |
| A chart | `<ChartCard>` (it wears `ChartEntrance`; inside a `Stagger` it holds still), `{...useChartMotion()}` on each Recharts series. A chart outside a card: `<ChartEntrance>` |
| Show/hide with an exit (was `AnimatePresence`) | `<Presence show>` / `usePresence` |
| Swap content by key (steps, a changed figure) | `<SwapPresence swapKey>` |
| A list that reorders or loses items | `useFlip` (GSAP Flip, transforms only; it measures only when its key changes, never on a keystroke) |
| Active tab or segment | `useIndicator` (a sliding bar, physical px, RTL-safe) |
| Error / success feedback | `useShake` (the row or form, never a field being typed in) / `usePop` |
| A status that changes in place | `<StatusPill popOn={status}>` (pops on a change, never on arrival) |
| Loading | `<Spinner>` (`components/ui/spinner`; `icon={RefreshCw} spinning={busy}` for a refresh arrow); `Button loading` has it |
| A placeholder | `<Skeleton>` (`components/ui/skeleton`); `<SkeletonSwap>` when data replaces it (content arrives legible and settles while the skeleton fades out beneath it) |
| A pressable card or tile | `data-press="product"` or `"brand"`; `Button` has it already |
| A set piece or ambient loop | `useTimeline` (`pauseOffscreen` for loops) |
| Anything else | `useGsap(fn, deps, { scope })`: scoped, reverted on cleanup, StrictMode-safe |

Recipes (`recipes.rise`, `arrive`, `crossfade`, `fade`, `dialog`, `sheet(side)`, `popper(side)`, `pop`) are the
named enter/exit shapes; hooks take a recipe, nothing writes raw tween values.

**Already wired, nothing to add:**
- Dialogs, alert dialogs and sheets enter and exit (their roots hold the open state so
  the content stays mounted through the exit). `Presence` also keeps showing its last
  content while it leaves.
- Menus, popovers, selects and tooltips enter from their side and close at once.
- Tab panels rise in, and `PageTabsList` slides its underline.
- `Page` cross-fades in on every route change (from `ARRIVE_OPACITY`, 220 ms: never an
  empty frame, never a hide-then-rise of the whole page).
- `DataTable` rows arrive once, on the table's first rows; later pages, filters and
  refetches just show.
- `Skeleton` shimmers in the reading direction.
- `Button` presses.

Vaul (the public drawer), sonner (toasts) and Recharts keep their own engines, each
through one component: vaul through `components/ui/drawer`, sonner's `Toaster` through
`components/ui/sonner` (dashboard) or `features/public-shell/public-toaster` (public
bundles; `toast()` is called from anywhere), Recharts series with `useChartMotion()`.

**Rules (correctness, not taste):**
- **Reduced motion.** `media.ts` reads it once. Every hook drops travel and scale, keeps
  short opacity fades for overlays, snaps count-ups, skips staggers and set pieces, and
  stops loops. CSS transitions land at once (`motion.css`), so a
  `motion-reduce:transition-none` class is redundant. The spinner keeps turning: it is
  the only sign that something is still loading.
- **Transform and opacity only.** The sidebar collapse is the one width transition, a
  layout change by design. Never `transition-all`; name the properties.
- **No ghost first frames.** The first painted frame of anything that animates is its
  clean pre-state or its final state, never content that shows, vanishes and then
  animates in. Entrances hide their targets in a layout effect (before paint). The only
  content that does not animate is content genuinely re-shown: an element whose
  entrance already finished, run again with no new content (a Suspense re-show), and
  skeletons waiting for data. Every route (the `Page` cross-fades on each pathname), first
  load, tab panel, dialog, sheet, list arrival and data landing animates. An entrance
  cut off by its cleanup (StrictMode's second run, a Suspense hide) carries on from
  where it was. Shake and pop fire once per signal.
- **Data landing is new content, and it is never held back.** `SkeletonSwap` (every
  `StatCard` uses it) renders the content as a new element in the same commit that swaps
  the skeleton out, already legible (`recipes.arrive`: opacity `ARRIVE_OPACITY` 0.6 and
  6 px low on its first frame), and settles it over 220 ms while the skeleton fades out
  BENEATH it (`isolate`, the ghost at `-z-10`), at the same time: a crossfade, never a
  wait. In a `Stagger` the cards land ≤20 ms apart, ≤80 ms in all. Motion plays AS
  content appears; it never makes content wait its turn (the owner, 2026-10-18).
  Reduced motion: final state at once. `scripts/motion-harness/play-probe.mjs` checks
  both ways at 4× throttle, phone and desktop: every scenario's main content animates,
  with no ghosts; `latency-probe.mjs` measures data → first legible frame and → settled.
- **Nothing animates off screen.** Entrances skip what is out of view (brand pages may
  `scroll`-reveal), and loops pause off screen.
- **RTL.**
  - Directional motion follows the layout: sheets use their physical `side`, poppers
    their `data-side`, indicators physical offsets, and the shimmer reverses.
  - A shake is symmetric.
  - Never mirror the floor canvas.
- **No motion on data entry.** Never animate an input someone is typing in, and never
  move focus during a transition. No motion may remount, re-key or reparent an input:
  `useFlip` reads the DOM only when its key changes and skips items with no box,
  because measuring a hidden item makes GSAP lift it out of the page and back, which
  drops the focus of a field inside (typing `90` saved `9`).
- **CSP.** GSAP uses no eval, and inline styles are set through the CSSOM. No `<style>`
  keyframes in components.

**When to reach for CSS instead.** Hover and colour transitions, and the two infinite
loops (spinner, shimmer), stay CSS with token classes: the compositor runs them for free.
Everything one-shot or state-driven is GSAP.

**Adding motion to a feature:**
1. Decide what changed for the user.
2. Pick the row above.
3. Pass `register: "brand"` on a customer surface.
4. Check it in EN and AR with reduced motion on.

**Enforced.**
- ESLint refuses `gsap`, `motion`, `framer-motion` and `tw-animate-css` imports outside
  `src/lib/motion`; Radix overlay primitives (`Dialog`, `AlertDialog`, `Popover`,
  `DropdownMenu`, `Select`, `Tooltip`, …) outside `components/ui`; `vaul` outside
  `components/ui/drawer`; and sonner's `Toaster` outside the two toaster components.
- `scripts/motion-check.mjs` (part of `npm run lint`) refuses:
  - `@keyframes` outside `motion.css`;
  - `animate-[…]`, pulse, bounce and the old tw-animate classes;
  - numeric `duration-*` and arbitrary eases;
  - inline `transition` and `animation` styles;
  - `animate-spin` and `Loader2` outside `spinner.tsx`, and `motion-reduce:animate-none`;
  - `motion-reduce:transition-none` and `transition-all`;
  - `shimmer` outside `skeleton.tsx`;
  - a status popped by hand (a wrapper span around a pill) instead of `popOn`;
  - in a Recharts file, a series without `{...useChartMotion()}`, or a
    `ResponsiveContainer` outside a `ChartCard` or `ChartEntrance` (a small JSX scanner,
    `scripts/jsx-tags.mjs`, reads the tags, since their attributes hold `=>`).

## Permissions (architecture E — PERMISSIONS_ARCHITECTURE.md)
- **Gate by capability, never by role name.** The UI reads the signed-in person's
  effective capabilities from the server and shows or enables only what they hold
  (or "ask a manager" where the owner turned approval on). A normal click must never
  end in a 403. The server still enforces everything.
- **The registry is generated** into `src/generated/capabilities.ts` from
  `MadarRust/authz/spec/capabilities.toml` (`cd MadarRust/authz/gen && cargo run --
  --dashboard ../../../MadarDashboard`). Never hand-edit it.
- **Never offer a toggle that breaks the app.** `core` capabilities are always on for
  their role kinds and are not shown as toggles; `configurable` ones are grouped with
  plain EN/AR names; `advanced` ones sit behind an Advanced section; `legacy` ones are
  never shown.

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

## Bookings — the floor's future
`src/features/bookings/` authors table bookings on the floor layer (backend
`src/bookings`). A booking claims tables for a window; the floor shows the table
as **reserved** from `next_booking.held_from` (a fourth tone, `held`, derived by
the clock — never written to `status`), and the POS seats it by firing a ticket
with `booking_id`. The dashboard lists, creates (auto-assigned tables via
`useBookingAvailability`), edits, cancels, marks no-show/seated/complete, and
edits per-branch settings. The public site (`src/reservations/`, its own bundle
and origin) books with the shared WhatsApp OTP and manages by link. Realtime
arrives through the app shell's single branch stream
(`src/data/realtime/use-branch-realtime.ts`), which invalidates queries by event
prefix; pages never read event payloads.

## Content-Security-Policy: every page has one
Every page this repo serves goes out with a CSP, set in nginx (`deploy/nginx/`), never
in code. A new page, bundle, vhost or nginx location inherits it only by following
these rules:
- **Where it lives.** `deploy/nginx/madar-csp-public.conf` holds the policy of every
  public page (get, order, reservations, loyalty, and every shop's own host through
  MadarRust's `deploy/shop/nginx-wildcard.conf`). `madar-csp-dashboard.conf` holds the
  dashboard's. That one is **report-only** (violations go to Sentry's security endpoint)
  until Sentry shows nothing unexpected; then rename the header to enforce it. Change a
  policy in its snippet only, never inline in a vhost. get's service worker
  (`site/sw/sw.ts`) carries a copy of the public policy; change both together.
- **The nginx rule.** In nginx, a location with any `add_header` of its own inherits
  none of the server's. So wherever a vhost includes
  `snippets/madar-security-headers.conf`, the next line includes the CSP snippet, in
  every new vhost and every new location. Order, reservations and loyalty went out with
  no CSP at all until 2026-10-11 because of this. `src/lib/csp.test.ts` enforces it.
- **What new code must not do.**
  - **Scripts:** no inline `<script>` and no `on*=` attributes (JSON-LD is fine). No
    `eval` or `new Function`.
  - **zod:** it runs jitless for that reason. `vite/zod-jitless.ts` sets it in
    zod's own core module; a new Vite config adds `zodJitless()` beside
    `noDocsInTheBundle()`.
  - **Public bundles talk to their own origin only** (`connect-src 'self'`): they call the
    API through the host's `/api/`, never a cross-origin URL. No Sentry and no
    third-party script, font or frame. Fonts are self-hosted (`@fontsource`), images
    may come from any `https:`, and WebAssembly is allowed (`'wasm-unsafe-eval'`).
  - **Workers:** `blob:` workers only on the dashboard.
  - **A new outside origin** (an API, a CDN, map tiles fetched by script, an embed)
    is added to the snippet in the same change, with the reason in its comment.
- **Check it.**
  - Before shipping: `node scripts/csp-check.mjs --inject public <url>` (or
    `dashboard`) loads a page with the snippet's policy enforced and exits 1 on any
    violation. Point it at `npm run dev:*`, a preview build or the live page.
  - After the deploy: `node scripts/csp-check.mjs <live url>` checks the real headers.
- **Installing on the box.**
  - Copy the snippets to `/etc/nginx/snippets/` and the vhosts per
    `deploy/nginx/README.md`.
  - Back up first, run `nginx -t`, then reload.
  - Only with the owner's go-ahead.

## Boot and the network
- **Boot waits for three things, in parallel** (`src/main.tsx`): the rules' wasm
  (preloaded from the HTML by `vite/preload-rules.ts`; the date scope and formatters call
  the rules while rendering, so it cannot be deferred), the active language's strings
  (`src/i18n`: each locale is its own chunk; a switch loads the other before it switches),
  and the shell restored from IndexedDB (`data/api/persist-shell.ts`, at most 250 ms).
- **Shell cache.** Only `/auth/me`, `/authz/me`, `/orgs/{id}`, `/orgs/{id}/modules`,
  `/branches` and `/public/orgs/brand` are kept, 24 h at most, restored stale (always
  refetched), cleared on sign-out and org switch, never anything credential-like. Business
  data is never persisted. `/orgs/{id}/modules` is also remembered per org in
  localStorage, like authz.
- **API base.** `VITE_API_URL` may be absolute (`https://api.madar-pos.cloud`, today) or
  root-relative (`/api`, once the dashboard host proxies it). Everything that builds an API
  URL takes it as a prefix and must work with both: a URL built with `new URL()` needs
  `window.location.origin` as its base, and a partner-facing URL is made absolute.
- **Sentry Replay** loads after the first paint (`lib/sentry-replay.ts`), from our own
  chunk: never `lazyLoadIntegration`, whose CDN the CSP refuses.

## Prefetch: every navigation warms its page's data
- **One gesture model** (`lib/prefetch/intent.ts`): a mouse hover or keyboard focus warms
  after 65 ms (a pass-over warms nothing; one pending hover at a time), `pointerdown` at
  once (a phone's only signal), the same target at most once per 2 s, hovers at most 6
  targets a second (a press is never throttled), nothing on Save-Data or 2G. It only ever
  calls `prefetchQuery`, which skips data still fresh (the 30 s `staleTime`) and joins one
  in flight. Never a mutation, never an export.
- **One registry** (`ROUTE_PREFETCH` in `lib/route-prefetch.ts`, an area per file under
  `lib/prefetch/`): route path as the tree spells it (`/menu/items/$itemId`) → the queries
  its page fires on mount, built with the page's OWN params helpers so the key is the
  page's key. Entries get the destination's scope, path params and validated search; a
  list page reads its state with `xSearch.entryValues(branchId, search)` (the link's own
  params, else what the list remembers, else defaults: exactly what `beforeLoad`
  restores). Redirect-only routes go in `REDIRECTS`; pages with nothing to warm in
  `NOTHING_TO_WARM` with a reason. `route-prefetch.test.ts` walks the route tree and fails
  on a page route with neither; `prefetch/keys-match.test.tsx` renders sampled pages and
  fails when a warmed key is not one the page reads (or the reverse).
- **Adopted by the components, not by hand.**
  - `<Link>` comes from `@/components/app/link` (ESLint refuses the router's in the dashboard).
  - `PageTabsList prefetch="tab"` and `SegmentedControl prefetch="tab"` for tabs in the URL.
  - `PageHeader back={{ onClick, prefetch }}` for an editor's guarded back button.
  - `DataTable onRowPrefetch` and `ListRow onPrefetch` for rows.
  - `useNavIntent()` for any other button that navigates
    (`<Button {...nav({ to, search: keepScope })} onClick={…}>`), `useWarmRoute()` to warm
    from a callback, and `intent(key, fire)` for a row that opens a sheet or dialog.

  The shell (`routes/_app/route.tsx`) provides the warm-up through `NavPrefetchProvider`;
  outside it (public bundles, tests) they warm nothing. A new data page = a registry entry
  in the same change.

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
