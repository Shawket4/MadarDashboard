# UI Rebuild — Handoff

> For a fresh agent continuing the Sufrix dashboard UI rebuild. Read this top to bottom before touching anything. Branch: `audit/overnight`. Nothing is committed yet (see **Commit status**).

## 1. The goal

Boldly reimagine **all** of the Sufrix dashboard UI, surface by surface, to the standard set in `PRODUCT.md` + `DESIGN.md` ("The Warm Ledger"). The cadence is: reimagine one surface → verify it across the full matrix → show the user → move on.

- **Register is split** (`PRODUCT.md`): the authenticated dashboard is **product** (quiet, precise, restrained); the customer surfaces (`landing`, `/order/:orgId`, `/track/:id`) are **brand** (bold, editorial). Match the register to the surface.
- **Design doctrine:** navy = trust, terracotta = the single accent (≤10% of a screen), cream/linen = hospitality. OKLCH tokens only, never raw hex. WCAG 2.1 AAA where feasible. Bilingual EN/AR with **first-class RTL** (logical properties only). Ledger-honest (append-only backend; no fake edit/delete). Money is **piastres** (÷100 → EGP); dates are **Africa/Cairo**.

## 2. What's done (and verified)

| Surface / thing | Status |
|---|---|
| `PRODUCT.md`, `DESIGN.md`, `.impeccable/` | Written (design system source of truth) |
| **Dashboard** (`src/features/dashboard/dashboard-page.tsx`) | Reimagined: editorial masthead, ruled "ledger line" KPIs, revenue trend, payment mix, branch leaderboard, delivery section, **dynamic timezone label**. Verified EN/AR × light/dark × mobile/desktop. |
| **Orders** (`src/features/orders/orders-page.tsx`) | Reimagined: one primary ledger strip + shared Delivery section + table. Verified incl. RTL table. |
| **Sidebar / shell** (`src/components/layout/app-sidebar.tsx` + `src/components/ui/sidebar.tsx` + `--sidebar` tokens) | Reimagined: **permanent deep-navy rail** (both themes), **distinct terracotta active pill** (was identical to hover in stock shadcn — overridden in the primitive cva), refined muted group labels, ring on brand mark. Verified expanded/collapsed/mobile-sheet × EN/AR × light/dark. |
| Backend delivery endpoint | `GET /reports/branches/{branch_id}/delivery-sales` added to SufrixRust (see §6). |

`tsc --noEmit` and `npm run lint` are **clean** — keep them that way for every change.

## 3. Shared components you must reuse (don't reinvent)

- **`src/components/app/ledger-strip.tsx`** — `LedgerStrip` renders the "ledger line" of KPIs (one ruled `Card`, hairline `gap-px` dividers, RTL-safe). Items are `LedgerItem { key, label, value, compactValue?, icon?, accent?, sub?, loading? }`. **Use this for any KPI row.** It also exports **`ConciseValue`** — shows `compact` on narrow (`useIsMobile`, 768px) with a dotted-underline affordance; **tap reveals the full value in a Popover**. Pass both `value` (full) and `compactValue` (concise) to get this for free.
- **`src/components/app/delivery-kpis.tsx`** — `DeliveryKpis` (totals strip via `LedgerStrip` + per-channel cards). Pure presentation; the caller fetches `useBranchDeliverySales(scopeBranchId, {from,to})` and passes `data`. **The dashboard and Orders both use this same hook+component so their delivery counts always agree** — keep that invariant if you touch delivery numbers anywhere.
- **Format helpers** (`src/lib/format.ts`): `fmtMoney`, `fmtMoneyCompact`, `fmtNumber`, `fmtNumberCompact` (locale-aware compact — "2.2K" / "٢٫٢ ألف"), `fmtPercent`, `fmtDateTime`, `fmtPeriod`. Money args are **piastres**. For any KPI value, provide full + compact so narrow cells stay readable.
- **App composites** (`src/components/app/*`): `Page` + `PageHeader`, `ChartCard` + `chartColor`, `ChartTooltipContent`, `EmptyState`, `Skeleton`, `DataTable`, `StatCard` (older; prefer `LedgerStrip` for new KPI rows), `Combobox`, `DateRangePicker`, `ConfirmDialog`, `ExportButton`.

### Pattern: a new surface's KPIs
```tsx
const kpis: LedgerItem[] = [
  { key:"x", label: t("..."), value: fmtMoney(v), compactValue: fmtMoneyCompact(v), icon: Coins, accent:"brand", loading },
  // ...
];
return <Page><PageHeader .../><LedgerStrip items={kpis} /> ...</Page>;
```

## 4. The mock preview harness (how you'll screenshot authenticated screens)

The app talks to a live backend; you can't reach it. A **dev-only** harness lets you render authenticated screens offline:

- Run it via the Preview MCP: `.claude/launch.json` defines server **`sufrix-mock`** (`npm run dev:mock`, port 5180). `preview_start("sufrix-mock")`.
- It seeds a fake `org_admin` session and **mocks the API at the axios-adapter level** — `src/data/api/mock/{adapter,data,enable}.ts`, wired by a `VITE_MOCK`-gated block in `src/main.tsx`.
- **Add curated data for any endpoint a new surface needs** in `src/data/api/mock/data.ts`, then add a rule in `adapter.ts` (regex on `config.url` → payload). Uncurated endpoints return `{}`.

### ⚠️ Preview gotchas (learned the hard way — don't repeat the debugging)
- **Do NOT reintroduce MSW / a service worker.** MSW's SW intercepts Vite's dynamic route-chunk imports in the headless preview and breaks lazy routes ("Failed to fetch dynamically imported module"). The adapter approach exists precisely to avoid this.
- **Theme/lang/scroll:** theme is class-driven, persisted at `localStorage["sufrix.theme"]` (`light`/`dark`/`system`); OS colorScheme emulation doesn't reliably flip it — set the key + reload. Language is `localStorage["sufrix.app"].state.language` (`en`/`ar`); set it + reload to get RTL.
- **Screenshots:** `preview_resize` with a `preset` ignores custom width/height. For a full-page shot, pass **only** `width`+`height` (no preset) with height ≥ page scrollHeight. Animated **fixed-position portals** (Radix Sheet/Dialog) and the `Page` `fadeIn` may not capture (headless rAF throttle) — verify those via `preview_eval`/`elementFromPoint`, or inject `*{opacity:1!important}` / `transform:none` for the shot.
- **Recharts** animates in; a chart may shoot blank on first paint — re-screenshot or nudge with a resize.

## 5. Verification checklist (apply to EVERY surface)

The user expects the **full matrix**, not spot checks:
- **EN + AR** (AR must be fully RTL: sidebar flips right, columns/badges mirror, Arabic-Egyptian numerals, no Latin-in-Arabic).
- **light + dark**.
- **mobile + desktop** (≤768px = concise KPI values + tap-for-full; tables degrade; sidebar becomes a Sheet).
- **All states** where relevant (sidebar expanded / collapsed-icon / mobile-sheet; loading skeletons; empty states; hover/focus/active).
- New strings → add **both** `src/i18n/locales/en.json` **and** `ar.json` (missing AR keys fall back to English — a bug).
- `tsc --noEmit` + `npm run lint` clean (lint is `--max-warnings 0`).

## 6. Backend changes (when a surface needs data that isn't exposed)

The user **authorized backend changes** for data needs (it's the sibling repo `/Users/shawket/Desktop/SufrixRust`, Actix-Web + utoipa + sqlx). Pattern (mirrors the delivery endpoint just added):
1. Add handler + `#[utoipa::path]` + response structs (`#[derive(...ToSchema)]`) in the relevant `src/<module>/handlers.rs` (analytics live in `src/reports/handlers.rs`). Reuse the auth/scope helpers (`extract_claims`, `check_permission`, `resolve_report_branches` — nil-UUID branch = "all branches in scope").
2. Register the route in `src/<module>/routes.rs` and the path in `src/openapi.rs` `paths(...)`.
3. Regenerate the spec: `cd ../SufrixRust && cargo run --bin export-openapi` → writes `openapi.json`.
4. Regenerate the client: `cd ../SufrixDashboard && npm run generate:api` (Orval) → new hook + types + (unused) MSW + faker.
5. Curate mock data for it (§4) and consume the generated hook.
Reference impl: `branch_delivery_sales` in `SufrixRust/src/reports/handlers.rs` (+ `routes.rs`, `openapi.rs`).

## 7. Remaining surfaces (roughly priority order)

Product (dashboard) surfaces still on the stock/old design:
- **Analytics** (`src/features/analytics/`) — 6-tab charts suite; biggest visual payoff. Reuse `ChartCard`, `LedgerStrip`.
- **Shifts** (`src/features/shifts/`) — ledger (open/close/force-close; no edit/delete).
- **Inventory** (`src/features/inventory/*`) — today/items/purchasing/counts/waste/transfers/reports/settings (several sub-pages).
- **Menu** (`src/features/menu/*`) — items/overrides/recipes/bundles/engineering/advisor.
- **Discounts, Branches, Users, Permissions, Settings** (+ payment-methods), **Delivery** settings/zones (channel-overrides is config; KPIs were intentionally NOT added there).
- **Onboarding** (`src/features/onboarding/`).

Brand surfaces (switch register → bold/editorial, use Fraunces serif, see `reference/brand.md` if using the impeccable skill):
- **Landing** (`src/features/landing/`), **Public ordering** (`src/features/public-ordering/`), **Order tracking** (`src/features/order-tracking/`).

## 8. Guardrails / things the user cares about

- **Design/UX only** unless a feature genuinely needs data — then backend is OK (§6). Don't refactor data hooks/stores/scope/timezone/format logic gratuitously.
- **Consistency:** every KPI row uses `LedgerStrip`; delivery numbers use `DeliveryKpis`/`useBranchDeliverySales`; same active-state/hover vocabulary as the shell.
- **No regressions to the matrix.** RTL and mobile are first-class, not afterthoughts.
- Keep the terracotta accent rare (≤10%); don't drift the linen bg into "SaaS cream"; no loud/neon, no enterprise-grey, no toy-like (the four anti-references in `PRODUCT.md`).

## 9. Commit status

Nothing committed. The user's instruction: **commit everything on the branch, never push; keep the harness local.** Exclude from any commit (both repos):
- `src/data/api/mock/*`, the `VITE_MOCK` block in `src/main.tsx`, `.claude/launch.json`, the `dev:mock` script in `package.json`.
Everything else (the UI changes, i18n, generated client, backend `SufrixRust/src/reports/*` + `openapi.rs` + `openapi.json`) is intended to be committed when the user gives the go. **Do not push.**

## 10. Memory

Persistent context lives in the agent memory (`MEMORY.md` index): see `ui-rebuild-constraints` (design/UX-only rule, harness + preview gotchas), `sufrix-overhaul-learnings`, `url-state-architecture`, `public-ordering-redesign`.
