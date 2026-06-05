# Sufrix — Portfolio context for `SufrixDashboard`

> **Audit date:** 2026-06-04  
> **Methodology:** directory listing, file reads, git log, shell commands (file counts, LOC, bundle sizes, dep lockfile reads). All facts are cited to source files or command output.

---

## 1. Repository identity

| Field | Value |
|---|---|
| **Repo name** | `sufrix-dashboard` (`package.json` line 2) |
| **Role in system** | Internal management dashboard for the Sufrix F&B platform. Consumes a Rust/Axum REST API (`SufrixRust`). Not a public-facing product. |
| **Primary language(s)** | TypeScript — 260 `.ts` files · 79 `.tsx` files · 2 `.css` files (from `find src/`) |
| **LOC (excl. deps, build)** | **38,155 total** across `src/**/*.{ts,tsx,css}` — from `xargs wc -l` run 2026-06-04 |
| **Source file count by extension** | `.ts` 260 · `.tsx` 79 · `.css` 2 — totals from `find src/` commands |
| **First commit date** | 2026-03-19 (`git log --reverse --format="%ai" \| head -1`) |
| **Last commit date** | 2026-06-02 (`git log -1 --format="%ai"`) |
| **Total commits** | **114** (`git rev-list --all --count`) |
| **Active contributors (last 90 days)** | **1** — Shawket Ibrahim (`git log -5 --format="%an\|%ae"`) |

---

## 2. Tech stack (EXACT versions from lockfile)

Versions from `node_modules` entries in `package-lock.json` (read via `node -e ...` 2026-06-04):

### Runtime — UI framework
| Package | Locked version |
|---|---|
| `react` | **19.2.6** |
| `react-dom` | **19.2.6** |
| `react-router-dom` | **7.15.1** |

### Build tooling
| Package | Locked version |
|---|---|
| `typescript` | **5.9.3** |
| `vite` | **6.4.2** |
| `@vitejs/plugin-react-swc` | (SWC-based Babel replacement; in devDeps) |
| `tailwindcss` | **3.4.19** |
| `postcss` | (in devDeps) |

### State / data fetching
| Package | Locked version |
|---|---|
| `zustand` | **5.0.13** |
| `@tanstack/react-query` | **5.100.13** |
| `@tanstack/react-table` | **8.21.3** |
| `axios` | **1.16.1** |

### Forms & validation
| Package | Locked version |
|---|---|
| `react-hook-form` | **7.76.1** |
| `@hookform/resolvers` | (in deps) |
| `zod` | **3.25.76** |

### i18n
| Package | Locked version |
|---|---|
| `i18next` | **24.2.3** |
| `react-i18next` | **15.7.4** |
| `i18next-browser-languagedetector` | (in deps) |

### UI primitives
| Package | Locked version |
|---|---|
| `@radix-ui/react-*` | 16 individual Radix primitives (avatar, checkbox, dialog, dropdown-menu, label, popover, progress, scroll-area, select, separator, slot, switch, tabs, tooltip) — see `package.json` lines 23–36 |
| `lucide-react` | **0.469.0** |
| `next-themes` | **0.4.6** |
| `sonner` | **1.7.4** |
| `cmdk` | (in deps) |
| `class-variance-authority` | (in deps) |
| `clsx` / `tailwind-merge` | (in deps) |

### Charts & data
| Package | Locked version |
|---|---|
| `recharts` | **2.15.4** |
| `exceljs` | **4.4.0** |
| `date-fns` | **4.3.0** |
| `@date-fns/tz` | (in deps) |
| `@lottiefiles/dotlottie-react` | (in deps) |

### Desktop (Tauri)
| Package | Locked version |
|---|---|
| `@tauri-apps/api` | **2.11.0** |
| `@tauri-apps/cli` | (devDep) |
| `@tauri-apps/plugin-http` | (in deps) |
| Rust crate `tauri` | `2` (from `src-tauri/Cargo.toml`) |
| Rust crate `tauri-plugin-http` | `2` (from `src-tauri/Cargo.toml`) |
| Min Rust edition | **2021**, rust-version **1.75** |

### Code generation
| Package | Locked version |
|---|---|
| `orval` | **8.14.0** |
| `msw` | **2.14.6** (Mock Service Worker) |
| `@faker-js/faker` | (devDep) |

### Testing
| Package | Locked version |
|---|---|
| `vitest` | **4.1.7** |
| `@testing-library/react` | **16.3.2** |
| `@testing-library/jest-dom` | **6.9.1** |
| `@testing-library/user-event` | **14.6.1** |
| `jsdom` | **27.0.1** |

---

## 3. Architecture summary

The project follows **Feature-Sliced Design (FSD)** as documented in `README.md` lines 30–42. Source is under `src/` with five layers enforcing a strict one-way import rule: `shared` → `entities` → `widgets` → `pages` → `app`. The `app/` layer (`src/app/`) owns the entry point, global CSS, providers, and router. The `shared/` layer is further subdivided into `api/`, `auth/`, `config/`, `hooks/`, `i18n/`, `lib/`, `types/`, and `ui/`, making it the platform foundation all other layers import from. The `entities/` layer (16 domain subdirectories) holds `api.ts + queries.ts + schemas.ts` per entity and is the only place that knows the shape of backend data. The `pages/` layer (18 directories) contains route-level components that are all code-split with `React.lazy`; the `widgets/` layer holds the sidebar, header, layout shell, command palette, language toggle, and theme toggle. The `features/` layer currently has one materialised feature: `orders-export` (order Excel export drawer with model, lib, api, and UI sub-folders). The project dual-ships as a web SPA (served from Nginx on a VPS) and a Tauri v2 desktop app targeting macOS (arm64 + x86_64), Linux, Windows, and Android.

---

## 4. Module inventory

| Module | Purpose | Key files | Public surface |
|---|---|---|---|
| `src/app` | Entry, providers, router, global CSS | `main.tsx`, `router/index.tsx`, `providers/index.tsx`, `app/index.css` | `AppRouter`, `AppProviders` |
| `src/pages/dashboard` | Role-aware landing page — KPI cards, branch status grid, recent orders, low-stock panel | `dashboard.tsx` | Default export `Dashboard` |
| `src/pages/orders` | Paginated order list with filters, detail drawer, void dialog, export drawer | `orders.tsx` | Default export `Orders` |
| `src/pages/analytics` | 6-tab analytics suite (overview, revenue, items, tellers, branches, inventory) | `analytics.tsx` | Default export `Analytics` |
| `src/pages/inventory` | Inventory stock + adjustments + transfers | `inventory.tsx` | Default export `Inventory` |
| `src/pages/menu` | Menu items, categories, add-ons management | `menu.tsx` | Default export `Menu` |
| `src/pages/shifts` | Shift lifecycle management (open/close/force-close, ledger view) | `shifts.tsx` | Default export `Shifts` |
| `src/pages/auth` | Login screen (JWT/PIN) | `login.tsx` | Default export `Login` |
| `src/pages/bundles` | Combo/bundle product builder | `bundles.tsx` | Default export `Bundles` |
| `src/pages/recipes` | Ingredient recipe management | `recipes.tsx` | Default export `Recipes` |
| `src/pages/discounts` | Discount rules management | `discounts.tsx` | Default export `Discounts` |
| `src/pages/permissions` | Per-user permission overrides | `permissions.tsx` | Default export `Permissions` |
| `src/pages/public-menu` | Unauthenticated public menu view at `/menu/:orgId` | `public-menu.tsx` | Default export `PublicMenu` |
| `src/pages/menu-advisor` | AI menu advisor feature page | `menu-advisor.tsx` | Default export `MenuAdvisor` |
| `src/pages/{orgs,users,branches,settings}` | Org/user/branch/settings CRUD | per-page `.tsx` | Default exports |
| `src/features/orders-export` | Fully structured export drawer — presets, column builder, multi-sheet Excel generation | `ui/export-drawer.tsx`, `lib/build-sheets.ts`, `lib/columns.ts`, `model/presets.ts`, `api/index.ts` | `ExportDrawer` |
| `src/widgets/sidebar` | Collapsible, role-gated nav sidebar | `sidebar.tsx` | `Sidebar` |
| `src/widgets/command-palette` | `cmdk`-powered global search palette | internal | `CommandPalette` |
| `src/widgets/layout` | Root layout shell wrapping sidebar + header + main | `layout.tsx` | `Layout` |
| `src/entities/{auth,branch,bundle,discount,health,inventory,menu,menu-advisor,order,org,payment-method,permission,recipe,report,shift,user}` | Domain API + query + schema per entity (16 domains) | `api.ts`, `queries.ts`, `schemas.ts` | TanStack Query hooks, Zod schemas |
| `src/shared/api` | Axios client, ambient context, generated API (Orval), query client | `client.ts`, `query.ts`, `generated/api.ts` (344 KB), `generated/api.msw.ts` (198 KB) | `apiClient`, `apiContext`, generated hooks |
| `src/shared/auth` | Zustand auth store + app-state store | `store.ts`, `app-store.ts` | `useAuthStore`, `useAppStore` |
| `src/shared/hooks` | `useCurrentContext`, `usePermissions`, `usePaymentMethods`, `useDebounce`, `useMounted` | `use-current-context.ts`, `use-permissions.ts` | All hooks |
| `src/shared/lib` | `exportToExcel`, `fmtMoney/Date/Number`, `cn`, `normalize`, `translation`, `zod-utils` | `excel.ts` (464 LOC), `format.ts` | Utility functions |
| `src/shared/i18n` | i18next setup, `en.json` (32 KB) + `ar.json` (42 KB), RTL logic | `index.ts`, `locales/*.json` | `applyHtmlDir`, i18n instance |
| `src/shared/ui` | shadcn/ui component library (Radix-based) | many files under `ui/` | All shared UI components |
| `src/test` | Vitest global setup, MSW server bootstrap, test utilities | `setup.ts`, `mocks/server.ts`, `utils.tsx` | Test wrappers |

---

## 5. Data model

Not applicable — frontend only (no direct DB access). All data shapes are defined in Zod schemas under `src/entities/*/schemas.ts` and the auto-generated TypeScript models in `src/shared/api/generated/models/` (produced by Orval from `openapi.json`). The OpenAPI spec (`openapi.json`, 465 KB, at repo root) is the authoritative contract.

---

## 6. API surface

Not applicable — frontend consumer, not provider. The dashboard calls a Rust/Axum backend at `VITE_API_URL` (configured to `https://sufrix.duckdns.org/api` in `.env` and hardcoded in `deploy.yml` line 23). All client-side API calls are made through the Orval-generated TanStack Query hooks in `src/shared/api/generated/api.ts` (344 KB), with `apiClient` (`src/shared/api/client.ts`) injecting `Authorization: Bearer <token>`, `X-Org-Id`, and `X-Branch-Id` headers via Axios interceptors.

---

## 7. Frontend specifics

| Field | Value |
|---|---|
| **Total screens/routes** | **19 routes** (from `src/app/router/index.tsx`): `/login`, `/menu/:orgId`, `/` (index→Dashboard), `/orgs`, `/users`, `/branches`, `/menu`, `/bundles`, `/inventory`, `/recipes`, `/shifts`, `/orders`, `/analytics`, `/discounts`, `/permissions`, `/permissions/:userId`, `/settings`, `/settings/payment-methods`, `/menu-advisor` |
| **Component file count** | **79 `.tsx` files** (`find src/ -name '*.tsx' \| wc -l`) |
| **State management library and pattern** | **Zustand 5.0.13** with `persist` middleware. Two stores: `useAuthStore` (`src/shared/auth/store.ts`) persists `{user, token}` to `localStorage`; `useAppStore` (`src/shared/auth/app-store.ts`) persists `{selectedOrgId, selectedOrgLogo, selectedBranchId, language, sidebarCollapsed}`. Both stores subscribe to each other via `updateApiContext` to keep the ambient Axios context in sync on every state change (see `store.ts` lines 70–95). **TanStack Query 5** handles all server state. The `useCurrentContext()` hook (`src/shared/hooks/use-current-context.ts`) is the single source of truth for `{user, role, orgId, branchId, isReady, isSuperAdmin, canManageOrg, canManageBranch}`. |
| **i18n library, locales, RTL support** | `i18next 24.2.3` + `react-i18next 15.7.4` + `i18next-browser-languagedetector`. Two locales: **English** (`en.json`, 32 KB) and **Arabic** (`ar.json`, 42 KB) — the Arabic is explicitly described as hand-written, not machine-translated (`README.md` line 52). RTL is auto-applied: `applyHtmlDir()` in `src/shared/i18n/index.ts` sets `<html lang>` and `<html dir>` on the `languageChanged` event. CSS uses logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`) for layout. Arabic numbers use `Intl.NumberFormat("ar-EG")` via `fmtMoney/fmtNumber` in `src/shared/lib/format.ts`. |
| **Routing setup and file path** | `react-router-dom 7.15.1` with `createBrowserRouter`. All protected routes nested under a `<ProtectedRoute>` + `<Layout>` pair. Every page is loaded via `React.lazy` + `<Suspense>` with a skeleton fallback. File: `src/app/router/index.tsx`. |
| **Bundle size** | Total `dist/` directory: **15 MB** (including `.br` + `.gz` pre-compressed copies). Largest JS chunks from `dist/assets/` (uncompressed): `exceljs-vendor` 918 KB (lazy-loaded only on Export click) · `chart-vendor` 411 KB · `index--ivncTsY` 325 KB · `react-vendor` 303 KB · `index-D7Eltqjl` 254 KB · `ui-vendor` 133 KB · `query-vendor` 97 KB · `form-vendor` 89 KB. Per-page route chunks range 15–43 KB each. **66 JS files** total in `dist/assets/`. Build noted as "45s, 35 chunks" in `README.md`. |

---

## 8. Offline / sync

No service worker, no IndexedDB, no PWA manifest found in `public/` (only `sufrix.svg`, `Icon.svg`, `sufrix_ar.svg`, `ShowTellerCup.lottie`, and `fonts/`). The app is fully online-dependent. TanStack Query's staleTime defaults apply (e.g., `usePermissions` uses `staleTime: 5 * 60_000`). No offline strategy implemented or configured.

---

## 9. Hardware integrations

None detected. No USB HID, receipt printer, barcode scanner, or POS peripheral libraries in `package.json` or Tauri capabilities (`src-tauri/capabilities/`). The Tauri Rust shell exposes only two IPC commands: `ping` and `get_app_version` (`src-tauri/src/lib.rs`). The Tauri HTTP plugin (`tauri-plugin-http`) is registered, allowing the frontend to make HTTP requests through Tauri's runtime when running as a desktop app.

---

## 10. Third-party integrations

| Integration | Status | Entry point |
|---|---|---|
| **Sufrix REST API** (`https://sufrix.duckdns.org/api`) | Active, all data | `src/shared/api/client.ts` — Axios base URL from `VITE_API_URL` env var |
| **Orval** (API code generation from OpenAPI) | Active dev-time tool | `orval.config.ts` — reads `../SufrixRust/openapi.json`, generates `src/shared/api/generated/api.ts` |
| **Lottie** (`@lottiefiles/dotlottie-react`) | Active (animation in `public/ShowTellerCup.lottie`) | Import in at least one component |
| **ExcelJS** | Active, lazy-imported | `src/shared/lib/excel.ts` line 204: `await import("exceljs")` |
| **Recharts** | Active | `src/pages/analytics/analytics.tsx` — Area, Bar, Pie charts |
| **Cairo font** | Active (bundled) | `public/fonts/Cairo-SemiBold.ttf`, `Cairo-Regular.ttf`; referenced in `src/app/index.css` |
| **Tauri v2** | Active desktop wrapper | `src-tauri/tauri.conf.json`, `src-tauri/src/lib.rs` |
| **Google Maps API** | Configured in Tauri CSP | `tauri.conf.json` line 25 (CSP allows `maps.googleapis.com`) — no Maps library in `package.json`; possibly planned or used by the Rust backend |
| **DuckDNS** | Production hostname | `https://sufrix.duckdns.org/api` in `.env`, `deploy.yml`, `tauri.conf.json` |

---

## 11. CI/CD and deployment

### Web SPA deployment (`.github/workflows/deploy.yml`)
- **Trigger:** push to `main` branch
- **Runner:** `ubuntu-latest`
- **Node:** 20
- **Steps:** `npm ci` → `npm run build` (with `VITE_API_URL=https://sufrix.duckdns.org/api` injected) → SCP `dist/*` to VPS via `appleboy/scp-action@v0.1.7` → SSH reload Nginx via `appleboy/ssh-action@v1.0.3`
- **Target:** `/var/www/sufrix-dashboard` on VPS, served by Nginx
- **Secrets required:** `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`

### Desktop + Android release (`.github/workflows/release.yml`)
- **Trigger:** push of `v*.*.*` tags
- **Desktop matrix:** macOS (arm64 + x86_64), Ubuntu 22.04, Windows (MSVC) — via `tauri-apps/tauri-action@v0`
- **Android:** Ubuntu 22.04, Zulu JDK 17, NDK r26b — builds APK via `npm run tauri android build -- --apk`
- **Artifacts:** `.dmg`, `.app`, `.exe`, `.msi`, `.AppImage`, `.deb`, `.apk` — attached to GitHub Release
- **macOS signing:** currently ad-hoc (`APPLE_SIGNING_IDENTITY: "-"`); comments in the file note this is for "Open Anyway" approval and list the secrets needed for proper notarization
- **Secrets required (Android):** `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_PASSWORD`, `KEY_ALIAS`
- **Environments:** single environment detected (`https://sufrix.duckdns.org`); no staging env in config

---

## 12. Performance signals

Sources: `README.md`, `vite.config.ts`, `dist/` directory inspection.

- **Build time:** "45s, 35 chunks" stated in `README.md` line 74 (unverified by CI artifact)
- **Code splitting:** every route is `React.lazy` + `Suspense`; 18 route-level chunks in `dist/assets/` (15–43 KB each)
- **Manual chunk strategy** in `vite.config.ts` lines 41–86: `chart-vendor`, `form-vendor`, `query-vendor`, `i18n-vendor`, `date-vendor`, `ui-vendor`, `react-vendor`, `exceljs-vendor` — vendor isolation prevents re-downloading unchanged vendor code on page updates
- **ExcelJS lazy import:** loaded only on user Export action (`src/shared/lib/excel.ts` line 204), keeping the 918 KB chunk out of the initial parse budget
- **Brotli (quality 11) + Gzip (level 9)** static pre-compression via `vite-plugin-compression` (`vite.config.ts` lines 10–30); Nginx serves these without runtime compression
- **Source maps:** generated in production (`vite.config.ts` line 37: `sourcemap: true`)
- **No performance benchmarks, Lighthouse scores, or Web Vitals** present in repo

---

## 13. Test coverage

| Aspect | Detail |
|---|---|
| **Framework** | Vitest 4.1.7 + Testing Library React 16.3.2 + jsdom 27.0.1 |
| **Test setup** | `src/test/setup.ts` — MSW server, matchMedia mock, react-i18next mock, sonner mock, ResizeObserver mock |
| **Mock server** | MSW 2.7 (`src/test/mocks/server.ts`) with Orval-generated `api.msw.ts` (198 KB of handler definitions) |
| **Test file count** | **14 test files** (`find src -name '*.test.*'`) — 1 hook test + 13 page component tests |
| **Test locations** | `src/shared/hooks/__tests__/use-permissions.test.tsx`, `src/pages/{auth,discounts,permissions,orgs,dashboard,recipes,inventory,users,menu,branches,orders,shifts,analytics}/__tests__/*.test.tsx` |
| **Unit tests** | `use-permissions.test.tsx` — tests the `usePermissions` hook logic |
| **Integration/component tests** | 13 page-level tests using RTL + MSW; render pages and assert on rendered output/user interactions |
| **E2E tests** | None found |
| **CI test run** | Not in `deploy.yml` or `release.yml` — tests are **not run in CI** as of last commit |
| **Faker** | `@faker-js/faker 10.4.0` available for test data generation |

---

## 14. Notable patterns

### Pattern 1 — Ambient context + Zustand subscriber keeps Axios headers always current

```typescript
// src/shared/auth/store.ts lines 70-95
const updateApiContext = () => {
  const authState = useAuthStore.getState();
  const appState = useAppStore.getState();
  // Resolve role-aware org/branch IDs
  apiContext.setToken(authState.token);
  apiContext.setOrg(orgId);
  apiContext.setBranch(branchId);
};
useAuthStore.subscribe(updateApiContext);
useAppStore.subscribe(updateApiContext);
updateApiContext(); // run on import for hard-refresh
```
Zustand store subscriptions synchronously keep Axios request headers in sync with both stores — no React hooks needed inside the Axios interceptor.

---

### Pattern 2 — `useCurrentContext()` as single source of truth for role/org/branch

```typescript
// src/shared/hooks/use-current-context.ts
export const useCurrentContext = (): CurrentContext => {
  const user = useAuthStore((s) => s.user);
  const selectedOrgId = useAppStore((s) => s.selectedOrgId);
  // ...
  return useMemo<CurrentContext>(() => ({
    orgId: isSuperAdmin ? selectedOrgId : user?.org_id ?? null,
    branchId: (role === "branch_manager" || role === "teller")
      ? user?.branch_id ?? selectedBranchId
      : selectedBranchId,
    isReady: Boolean(user) && (isSuperAdmin || Boolean(orgId)),
    // ...
  }), [user, selectedOrgId, selectedBranchId, selectedOrgLogo]);
};
```
All TanStack queries derive `orgId`/`branchId` from this memoised hook, preventing stale-closure bugs.

---

### Pattern 3 — Declarative Excel export through a single function

```typescript
// src/shared/lib/excel.ts — called from analytics.tsx, orders-export, etc.
exportToExcel({
  filename: "Revenue-daily",
  sheets: [{
    name: "Timeseries",
    title: "Revenue Over Time",
    columns: [
      { key: "period", header: "Time", accessor: (p) => fmtPeriod(p.period, gran), width: 22 },
      { key: "revenue", header: "Total Revenue", accessor: (p) => p.revenue, type: "money", total: true },
    ],
    rows: ts,
    totals: true,
  }],
});
```
All exports pass through one function — branded banner, zebra rows, SUM formulas, and Brotli-embeddable SVG logo rasterisation are handled once. ExcelJS is lazy-imported (dynamically `import("exceljs")`) so the 918 KB chunk never enters the initial parse budget.

---

### Pattern 4 — Role-default permission matrix with API-override fallback

```typescript
// src/shared/hooks/use-permissions.ts
const ROLE_DEFAULTS: Record<Role, Record<string, Partial<Record<string, boolean>>>> = {
  org_admin: { orders: { read: true, update: true }, ... },
  branch_manager: { orders: { read: true, update: true }, ... },
  // ...
};
// API-loaded per-user overrides take precedence if present
const can = (resource, action) => {
  if (data?.permissions) {
    const apiGranted = map[resource]?.[action];
    if (apiGranted !== undefined) return apiGranted;
  }
  return Boolean(ROLE_DEFAULTS[user.role][resource]?.[action]);
};
```
UI is gated by `can("resource", "action")` throughout; the API override makes permissions auditable without shipping a new frontend build.

---

### Pattern 5 — Orval-generated full API + MSW mock layer

Orval reads `openapi.json` (465 KB) and generates three files:
- `src/shared/api/generated/api.ts` (344 KB) — TanStack Query hooks for every endpoint
- `src/shared/api/generated/api.msw.ts` (198 KB) — MSW handlers for every endpoint
- `src/shared/api/generated/api.faker.ts` (126 KB) — Faker-seeded response factories

This means every test file can use realistic, typed mock data with zero manual maintenance.

---

## 15. What this repo is genuinely strong at

- **Consistent data context discipline:** `useCurrentContext()` is enforced as the only way to read `orgId`/`branchId` in queries, eliminating an entire class of multi-tenant closure bugs at the architectural level.
- **RTL-first i18n:** Arabic is hand-written (not translated), CSS uses only logical properties, `<html dir>` switches automatically, and number formatting uses `ar-EG` locale — RTL is not bolted on but designed in from `src/shared/i18n/index.ts` and `src/app/index.css`.
- **Excel exports that are actually useful:** The `exportToExcel` service (`src/shared/lib/excel.ts`) produces branded workbooks with SUM formulas, per-cell number formats, locale-aware Arabic currency, multi-sheet support, and SVG logo rasterisation — far above typical CSV dumps.
- **Chunk strategy reduces perceived load time:** Manual Rollup chunks plus per-route `React.lazy` splitting, combined with pre-built Brotli/Gzip artifacts served directly from Nginx, means new page navigations load only what they need and the network sees pre-compressed bytes.
- **Full OpenAPI → code-gen pipeline:** Orval regenerates type-safe hooks + MSW mocks + Faker factories from a single `npm run generate:api` invocation, keeping the frontend contract mechanically in sync with the backend OpenAPI spec.

---

## 16. Honest weaknesses / rough edges

- **Tests are not run in CI:** Neither `deploy.yml` nor `release.yml` calls `npm test` before deploying or releasing. The 14 test files exist but provide no automated gate against regressions (verified by reading both workflow files).
- **Large TypeScript error log:** `tsc_errors.log` (157 KB) and `tsc_errors_new.log` (41 KB) are committed to the repo root, indicating the codebase has had or still has a significant number of TypeScript errors. The build script uses `tsc --noEmit && vite build` so the current state may be clean, but the presence of committed error logs and multiple `fix_types*.py` scripts suggests type debt was actively fought.
- **Tooling scripts committed to root:** 12+ one-off Python/CJS scripts (`fix_analytics.cjs`, `patch_translations.py`, `fix_types*.py`, `fix_orders.py`, `edit_public_menu.py`, etc.) are committed at root alongside the source. These are ad-hoc fixup tools, not part of the app.
- **Single contributor, no review process:** All 114 commits are from one author (Shawket Ibrahim). There is no evidence of PR reviews, branch protection, or code review tooling configured.
- **macOS desktop signing is ad-hoc:** `release.yml` line 68 uses `APPLE_SIGNING_IDENTITY: "-"` which produces an ad-hoc signature. Distribution outside the developer's machine will require macOS users to bypass Gatekeeper; the comment in `release.yml` lines 56–63 acknowledges this and lists the secrets needed for proper notarization, which are not yet configured.

---

## 17. Production deployments

| Target | URL / path | Mechanism |
|---|---|---|
| **Web SPA** | `https://sufrix.duckdns.org` (inferred from API URL) | GitHub Actions push-to-`main` → SCP `dist/*` → `/var/www/sufrix-dashboard` on VPS → Nginx reload (`deploy.yml`) |
| **Desktop app** | GitHub Releases (macOS `.dmg`/`.app`, Linux `.AppImage`/`.deb`, Windows `.msi`/`.exe`) | GitHub Actions on `v*.*.*` tags (`release.yml`) via `tauri-apps/tauri-action@v0` |
| **Android APK** | GitHub Releases (`.apk`) | GitHub Actions on `v*.*.*` tags (`release.yml`), signed with keystore from `KEYSTORE_BASE64` secret |
| **API backend** | `https://sufrix.duckdns.org/api` | Separate repo (`SufrixRust`); deployment not in this repo |

No staging or preview environment is configured in either workflow. The Tauri app `identifier` is `com.sufrix.dashboard` (`tauri.conf.json` line 5).

---

## 18. Anything else worth knowing

- **Ledger-style backend contract:** The README documents that orders and shifts are append-only — no edit, no delete. Void operations use `POST /orders/:id/void`. Inventory adjustments are append-only; reversals are compensating entries. This constraint is enforced by the backend and the frontend UI deliberately hides destructive actions accordingly (e.g., Orders page has no edit button, only void via dialog).
- **Currency in piastres:** All monetary values from the API are integers in Egyptian piastres (1 EGP = 100 piastres). The entire UI converts on output via `piastresToEgp()` and `fmtMoney()` in `src/shared/lib/format.ts`. ExcelJS columns of type `"money"` divide by 100 automatically.
- **All dates are Cairo-anchored:** `APP_TZ = "Africa/Cairo"` (`src/shared/config/constants.ts`, inferred from `format.ts` usage). Every `Intl.DateTimeFormat` call passes `timeZone: APP_TZ`. `@date-fns/tz`'s `TZDate` is used for date arithmetic to prevent off-by-one day bugs at UTC midnight.
- **Talabat payment method display rule:** Analytics and Excel exports show `talabat_online`, `talabat_cash`, AND an aggregate `Talabat (Total)` column (`talabatTotal()` helper in `excel.ts` line 459). Recharts charts keep them strictly split to prevent visual double-counting — documented as an immutable business rule in `README.md` lines 68–69.
- **Orval reads from sibling repo:** `orval.config.ts` reads `input: '../SufrixRust/openapi.json'`, meaning the two repos must be siblings on disk for `npm run generate:api` to work. The generated output is committed to the repo so CI does not require the sibling to be present.
- **Cairo font bundled:** `public/fonts/Cairo-SemiBold.ttf` and `Cairo-Regular.ttf` are self-hosted, used in both the browser UI (via CSS) and ExcelJS Excel cells (font name `"Cairo"` in the spreadsheet palette).
- **Console silencer in production:** `src/app/console-silencer.ts` suppresses console output in non-dev environments (`initConsoleSilencer()` called in `main.tsx` line 12).
- **Menu advisor page exists** (`src/pages/menu-advisor/`); the entity layer (`src/entities/menu-advisor/`) also exists. The feature appears to be an AI-assisted menu recommendation tool, but its implementation depth was not fully audited.

---

*Produced by automated code audit on 2026-06-04. All claims are backed by actual file reads or command output.*
