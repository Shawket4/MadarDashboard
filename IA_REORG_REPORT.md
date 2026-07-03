# MadarDashboard — Information Architecture Re-org Report

Date: 2026-07-03
Scope: IA / navigation / routing / redirects / renames / sub-nav / orphan-surfacing only.
Build: `npm run build` (tsc --noEmit + vite build) — **PASSES, exit 0, no new type errors.**

Locked feature dirs were only re-pointed, never edited internally:
`src/features/{menu,recipes,bundles,public-ordering}`. No new menu/item editor built. No
backend or API-client changes.

---

## 1. New `src/config/nav.ts` structure (7 groups, in sidebar order)

Sidebar renders `NAV` top-to-bottom; the command palette (⌘K) flattens the same `NAV`, so every
leaf below is automatically searchable.

| Group (labelKey) | Entries (→ route) |
|---|---|
| **Overview** (`nav.overview`) | Dashboard → `/` |
| **Sell** (`nav.sell`) | Orders → `/orders` · Reservations → `/reservations` · Shifts → `/shifts` · Tills → `/tills` |
| **Catalog** (`nav.catalog`) | Menu *(parent, basePath `/menu`)* → Items `/menu/items`, Branch Overrides `/menu/overrides`, Recipes `/menu/recipes` · **Bundles** *(own entry)* → `/menu/bundles` · Discounts → `/discounts` |
| **Insights** (`nav.insights`) | Sales → `/insights/sales` · Menu profitability → `/insights/menu-profitability` · Inventory reports → `/insights/inventory-reports` |
| **Inventory** (`nav.inventory`) | Inventory *(parent, basePath `/inventory`)* → Today `/inventory/today`, **Ingredients** `/inventory/ingredients`, Purchasing, Stock counts, Waste, Transfers, Reports, Settings |
| **Setup** (`nav.setup`) | Delivery *(parent)* · Kitchen *(parent)* · QR → `/qr` · **Payment methods** → `/settings/payment-methods` (roles: org_admin, super_admin) · **WhatsApp** → `/settings/whatsapp` (superAdminOnly) · General settings → `/settings` |
| **Administration** (`nav.admin`) | Organizations → `/orgs` (superAdminOnly) · Branches → `/branches` · **Users & Permissions** → `/access/users` |

### `NavLeaf` type extended
Added an optional `roles?: UserRole[]` field (in addition to the existing `superAdminOnly?`).
Used to gate the surfaced **Payment methods** entry to `["org_admin","super_admin"]`. WhatsApp
keeps using `superAdminOnly`. The `visible()` predicate in **both** `app-sidebar.tsx` and
`command-palette.tsx` was updated to honour `roles` as well as `superAdminOnly`.

Notable moves vs. old IA:
- Old **Operations** group dissolved: Orders/Reservations/Shifts → Sell; Inventory → its own
  Inventory group; Analytics → Insights ▸ Sales; QR/Delivery/Kitchen → Setup.
- **Tills** moved Administration → Sell.
- **Bundles** promoted to a top-level Catalog entry (route unchanged: `/menu/bundles`).
- **Menu Engineering** + **Menu Advisor** left the Menu parent; they now live under
  Insights ▸ Menu profitability as sub-nav tabs.
- **Users** + **Permissions** merged into one Administration entry backed by the `/access` layout.

---

## 2. Files ADDED

Routes (new IA surfaces / shells):
- `src/routes/_app/insights/sales.tsx` — renders existing `AnalyticsPage` (keeps `?tab`/`?gran`).
- `src/routes/_app/insights/inventory-reports.tsx` — thin wrapper rendering existing inventory `ReportsPage`.
- `src/routes/_app/insights/menu-profitability/route.tsx` — **shell layout** with `SectionTabs` (Engineering | Advisor) + `<Outlet>`.
- `src/routes/_app/insights/menu-profitability/index.tsx` — redirect → `/insights/menu-profitability/engineering`.
- `src/routes/_app/insights/menu-profitability/engineering.tsx` — renders existing `MenuEngineeringPage` (keeps `?view`/`?basis`).
- `src/routes/_app/insights/menu-profitability/advisor.tsx` — renders existing `MenuAdvisorPage`.
- `src/routes/_app/access/route.tsx` — **shell layout** with `SectionTabs` (Users | Roles & Permissions) + `<Outlet>`.
- `src/routes/_app/access/index.tsx` — redirect → `/access/users`.
- `src/routes/_app/access/users.tsx` — renders existing `UsersPage` (keeps `?edit`/`?branches`).
- `src/routes/_app/access/roles.tsx` — renders existing `PermissionsPage` (keeps `?user`).
- `src/routes/_app/inventory/ingredients.tsx` — renders existing inventory `ItemsPage` (the "rename" target of `items.tsx`).

Report:
- `IA_REORG_REPORT.md` (this file).

`src/components/app/section-tabs.tsx` already existed from the interrupted prior attempt — it was
**reused as-is** (correct API `{ tabs: {to,label}[] }`, teal-underline active state, and a
`keepScope` that carries branch+period but drops page-specific params like `?edit`/`?user`).
`src/routeTree.gen.ts` was **regenerated** by the TanStack Router vite plugin (not hand-edited).

## 3. Files MODIFIED

- `src/config/nav.ts` — full rewrite to the 7 groups; added `roles?` to `NavLeaf`; pruned now-unused icon imports (`BookText`, `ShieldCheck`, `Sparkles`); added `CreditCard`, `MessageCircle`, `TrendingUp`.
- `src/components/layout/app-sidebar.tsx` — `visible()` now honours `roles` in addition to `superAdminOnly`.
- `src/components/layout/command-palette.tsx` — same `visible()` upgrade; removed the old one-line `superAdminOnly`-only predicate.
- `src/routes/_app/delivery/route.tsx` — inline `<Link>` tab bar refactored to the shared `SectionTabs`.
- `src/routes/_app/analytics.tsx` — converted to redirect → `/insights/sales`.
- `src/routes/_app/menu/engineering.tsx` — converted to redirect → `/insights/menu-profitability/engineering` (preserves `?view`/`?basis`).
- `src/routes/_app/menu/advisor.tsx` — converted to redirect → `/insights/menu-profitability/advisor`.
- `src/routes/_app/inventory/items.tsx` — converted to redirect → `/inventory/ingredients`.
- `src/routes/_app/users.tsx` — converted to redirect → `/access/users` (preserves `?edit`/`?branches`).
- `src/routes/_app/permissions.tsx` — converted to redirect → `/access/roles` (preserves `?user`).
- `src/lib/route-prefetch.ts` — added the new canonical paths as fall-through `case` labels next to their legacy counterparts so sidebar hover still warms the right queries (`/insights/sales`, `/insights/menu-profitability[/engineering|/advisor]`, `/insights/inventory-reports`, `/inventory/ingredients`, `/access[/users|/roles]`).
- `src/features/users/users-page.tsx` — internal "manage permissions" `<Link>` re-pointed `/permissions` → `/access/roles` (editable; not a locked dir).
- `src/features/inventory/today-page.tsx` — internal "view all" `<Link>` re-pointed `/inventory/items` → `/inventory/ingredients`.
- `src/i18n/locales/en.json` and `src/i18n/locales/ar.json` — new `nav.*` keys (see §5).

## 4. Redirects added (all via `beforeLoad: () => { throw redirect({...}) }`)

| Old path | → New path | Search params preserved |
|---|---|---|
| `/analytics` | `/insights/sales` | — |
| `/menu/engineering` | `/insights/menu-profitability/engineering` | `?view`, `?basis` |
| `/menu/advisor` | `/insights/menu-profitability/advisor` | — |
| `/inventory/items` | `/inventory/ingredients` | — |
| `/users` | `/access/users` | `?edit`, `?branches` |
| `/permissions` | `/access/roles` | `?user` |
| `/insights/menu-profitability` (index) | `/insights/menu-profitability/engineering` | — |
| `/access` (index) | `/access/users` | — |

`/menu/*` catalog routes (items, overrides, recipes, bundles) remain intact and rendering. The
underlying engineering/advisor pages remain reachable as tab targets under
`/insights/menu-profitability/*`. Pre-existing redirects (`/menu/` → `/menu/items`,
`/inventory/` → `/inventory/today`, `/delivery/` → `/delivery/settings`) are untouched.

## 5. i18n keys added (both en + ar)

Added under the flat `nav.*` namespace in `en.json` and `ar.json`:

| key | en | ar |
|---|---|---|
| `nav.sell` | Sell | المبيعات |
| `nav.insights` | Insights | التحليلات |
| `nav.setup` | Setup | الإعداد |
| `nav.salesInsights` | Sales | المبيعات |
| `nav.menuProfitability` | Menu profitability | ربحية القائمة |
| `nav.inventoryReports` | Inventory reports | تقارير المخزون |
| `nav.ingredients` | Ingredients | المكوّنات |
| `nav.paymentMethods` | Payment methods | طرق الدفع |
| `nav.whatsapp` | WhatsApp | واتساب |
| `nav.usersPermissions` | Users & Permissions | المستخدمون والصلاحيات |
| `nav.rolesPermissions` | Roles & Permissions | الأدوار والصلاحيات |

Reused existing keys where labels already existed: `nav.engineering`, `nav.menuAdvisor`
(Menu-profitability tabs), `nav.users` (Access ▸ Users tab), `nav.settings` (General settings),
plus the whole Sell/Catalog/Inventory-child/Delivery/Kitchen key set.

## 6. Sub-nav standard applied

Standardized cross-route (path-switching) sub-nav on `src/components/app/section-tabs.tsx`
(`<SectionTabs tabs={{to,label}[]} />`), applied at:
1. **Delivery** — `src/routes/_app/delivery/route.tsx` (refactored from its inline `<Link>` bar).
2. **Insights ▸ Menu profitability** — `src/routes/_app/insights/menu-profitability/route.tsx`.
3. **Administration ▸ Users & Permissions** — `src/routes/_app/access/route.tsx`.

In-page (`?tab`-switching) `PageTabs` were **left intact** everywhere (analytics, inventory
reports, etc.) — not ripped out. Raw Radix `ui/tabs.tsx` untouched.

## 7. Intentional shells / secondary surfaces left for later

- **Insights ▸ Menu profitability** and **Administration ▸ Users & Permissions** are thin shell
  layouts (SectionTabs + Outlet). They embed the *existing* feature pages unchanged — no bespoke
  overview/summary content was authored. If a future wave wants a combined landing view, it slots
  into the `index.tsx` of each shell (currently a redirect to the first tab).
- **`/insights/inventory-reports`** is a thin wrapper rendering the same `ReportsPage` as
  `/inventory/reports`. Both entry points intentionally coexist (surfaced under Insights *and* the
  Inventory group), as specified.
- **Settings page cards** (`src/features/settings/settings-page.tsx`) still contain the
  Payment-methods and WhatsApp card links. These are now redundant with the new Setup sidebar
  entries but remain functional as secondary entry points; left in place since removing them was
  out of the IA scope (the ask was to *surface* the orphans in nav, which is done).

## 8. Pre-existing build errors found but NOT caused by this work

None. After regenerating the route tree, `npm run build` (tsc + vite) completes with exit code 0,
`✓ 3574 modules transformed`, and no type errors. The only tsc errors seen during iteration were
three unused-icon-import errors *introduced by my own nav.ts rewrite* (`BookText`, `ShieldCheck`,
`Sparkles`), which I removed. `eslint` on every changed file also passes (exit 0). The lone "error"
substring in vite output is a code-split chunk filename (`errors-*.js`), not a diagnostic.

## Note on the route tree regeneration

There is no standalone `tsr`/`@tanstack/router-cli` binary installed; the tree is generated by
`@tanstack/router-plugin/vite`. Because `npm run build` runs `tsc --noEmit` *before* `vite build`,
the stale tree had to be regenerated first — done by briefly starting `npm run dev` (the plugin
regenerates `routeTree.gen.ts` on boot), then running the build. Anyone rebuilding from clean gets
the same result because `vite build` regenerates the tree too; the tsc-first ordering only matters
when the tree is stale on disk.
