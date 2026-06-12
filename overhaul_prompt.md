⏺ Here's the combined prompt. Copy this and paste it directly to the dashboard
  Claude Code agent:

  ---
  You are working on the SufrixDashboard React application at the current
  working directory. 
  
  ## Stack
  - React 19, TypeScript, Vite
  - React Router v7 (`src/app/router/index.tsx`)
  - TanStack Query v5 + Orval-generated API client (`src/shared/api/generated/`)
  - Zustand v5 for auth (`src/shared/auth/store.ts`) and app state
  (`src/shared/auth/app-store.ts`)
  - Radix UI primitives + Tailwind CSS (shadcn-style component kit in
  `src/shared/ui/`)
  - react-i18next — bilingual EN/AR, RTL is a first-class requirement
  - Recharts for all charts
  
  ## Project layout (actual conventions — follow these exactly)
  src/
    app/         → router, providers
    pages/       → one folder per page/feature (e.g. src/pages/branches/)
    widgets/     → layout, header, sidebar, command-palette
    features/    → reusable feature segments (e.g. features/orders-export)
    entities/    → query wrappers, schemas, models (e.g. entities/branch/)
    shared/      → ui/, api/, hooks/, lib/, config/, i18n/, auth/

  ## Before writing any code — do these first

  ### Step 0: Regenerate the API client
  Run `cargo run --bin export-openapi` from the backend repo at
  `/Users/shawket/Desktop/SufrixRust` and copy the resulting `openapi.json`
  to this project, then run `pnpm orval` (or whatever the codegen script is)
  to regenerate `src/shared/api/generated/`. Every new endpoint below is
  already implemented in the backend and will appear in the spec. Do this
  before touching any feature code.

  ---

  ## CRITICAL AUDIT 1 — Piastres ↔ EGP correctness
  **Complete this before writing new features.**

  The backend stores and transmits ALL monetary values as integer piastres
  (minor units). Frontend must always display EGP (÷100) and send piastres
  (×100, truncated). `cost: null` = unknown, NOT free — never render as
  "0.00 EGP", always render as em-dash or "cost missing" badge.

  Audit tasks:
  1. Run `grep -rn "price\|cost\|sales\|profit\|margin\|/ 100\|* 100\|fmtMoney"
  src/`
     and classify every result as correct, missing conversion, or
  double-conversion.
  2. Every display site (StatCard, DataTable columns, chart axes, tooltips,
     Badge) — confirm divide by 100.
  3. Every form/input site — confirm multiply by 100 before API call,
     display current value ÷100.
  4. Menu Engineering report (`GET /reports/branches/{id}/menu-engineering`):
     all of total_sales, total_cost, total_profit, item_profit, sales are
     piastres — divide by 100 for display.
  5. Costing endpoints (`GET /costing/menu-items`, `/costing/addon-items`):
     price and cost are piastres — divide by 100.
  6. Order line DTOs: line_cost, unit_cost are piastres — divide by 100 in
     order detail drawer and exports.
  7. Fix all mismatches. Comment each fix: `// FIX: was displaying raw piastres,
  now divides by 100`
  8. Unit-test fmtMoney: fmtMoney(100)==="1.00 EGP", fmtMoney(0)==="0.00 EGP",
     fmtMoney(null)==="—" (never "0.00 EGP").

  ---

  ## CRITICAL AUDIT 2 — Form reliability
  **Complete alongside the piastres audit.**

  Every form that creates or edits data must satisfy all of these:

  1. **Forms must actually fire the request.** Audit for: onSubmit not calling
     the mutation; handleSubmit not wired to `<form onSubmit>`; submit buttons
     with type="button" instead of type="submit"; early returns that discard
     the submission silently.
  2. **Optimistic updates must roll back on error.** Every useMutation with
     onMutate must have a matching onError rollback.
  3. **After a successful mutation, invalidate the relevant queries.** Check
     every onSuccess for queryClient.invalidateQueries on affected keys:
     - Menu item CRUD → invalidate ['menu-items', orgId]
     - Recipe save → invalidate ['recipes', ...] and ['costing', 'menu-items',
  orgId]
     - Category CRUD → invalidate ['categories', orgId]
     - Ingredient create/edit → invalidate ['catalog', orgId] and ['costing',
  ...]
     - Stock edit → invalidate ['stock', branchId]
     - Bundle CRUD → invalidate ['bundles', orgId]
  4. **Dialogs must close after successful save.** Confirm open state is set
     to false in mutation onSuccess.
  5. **Errors must surface.** Never swallow errors silently — show toast or
     inline message.
  6. **Loading states.** Submit buttons disabled + spinner while isPending.
  7. **react-hook-form wiring:** `<form onSubmit={handleSubmit(onSubmit)}>`,
     register/Controller on every field, formState.errors displayed,
     reset() called after success when form should clear.

  Audit: menu, recipes, categories, bundles, inventory, and all shared dialogs.

  ---
  
  ## GROUND RULES (apply to every change)

  1. Never remove a feature. Make the better way the default; keep the old
     way as a visible option.
  2. Zero backend modifications. No new endpoints, no changed shapes.
  3. Use the shadcn-style kit in src/shared/ui/ — PageShell, StatCard, Card,
     Badge, Button, EmptyState, Skeleton, DataTable, DateRangePicker, Tabs,
     SearchableSelect, Tooltip. Do not introduce a second component vocabulary.
  4. Styling: Tailwind + project tokens. Semantic classes only
     (text-muted-foreground, bg-muted, text-warning, text-primary) — never raw
  hex.
  5. i18n: every user-facing string through t(...) with keys in src/shared/i18n.
     Bilingual EN/AR + RTL is non-negotiable.
  6. RBAC: gate with usePermissions().can(resource, action) and
     useCurrentContext().isSuperAdmin exactly as the pages already do.
  7. No new heavy dependencies. Use what's installed.
  8. Definition of done per phase: `pnpm exec tsc --noEmit` adds no new errors;
     `pnpm vitest run` green for touched areas; `pnpm exec vite build` succeeds;
     flows verified in EN (LTR) and AR (RTL).

  ---
  
  ## PART 1 — Onboarding wizard (new feature, highest priority)

  ### Backend contract (already live — no changes needed)

  **GET /orgs/{id}/onboarding → OnboardingStatus**
  ```ts
  {
    org_id: string,
    completed: boolean,        // THE routing flag — persisted, never regresses
    completed_at: string | null,
    can_complete: boolean,     // all required steps done → enables Finish
  button
    recipe_coverage: number,   // 0..1 ratio of active items with ≥1 recipe row
    steps: Array<{
      key: "branch" | "payment_methods" | "categories" | "menu_items"
         | "ingredients" | "recipes" | "addons" | "team" | "first_order",
      done: boolean,
      count: number,
      required: boolean,  // branch/payment_methods/categories/menu_items are
  required
    }>
  }
  
  POST /orgs/{id}/onboarding/complete → OnboardingStatus
  Idempotent. Sets completed = true permanently. Call ONLY from Finish or Skip
  (when can_complete is true). Orgs with existing orders are pre-marked
  completed = true — they must never see the wizard.

  Permissions: GET needs orgs:read, POST needs orgs:update (org_admin only).

  CRITICAL design fact: Step progress is derived server-side from data
  presence on EVERY read. There is no "mark step done" client call. Creating
  a branch IS completing the branch step. Never store step state client-side.

  Routing & gating

  1. After auth resolves, fetch onboarding status once with staleTime: 30_000.
  2. If completed === false AND user is org_admin (check can("orgs","update"))
  → redirect to /onboarding. This is a FULL-SCREEN route outside the normal
  app shell — no sidebar, no header scope switcher.
  3. A "Skip setup →" link must exist in the wizard footer at all times.
  4. If completed === true, /onboarding redirects to /. The wizard is
  unreachable after completion.
  5. After every create mutation inside the wizard, invalidate
  ['onboarding', orgId] so the stepper updates immediately.
  6. Session-scoped "skipped this session" flag (sessionStorage): if the user
  clicks Skip, don't bounce them back to the wizard for the rest of the
  session. Only bounce again on next sign-in.
  7. Skip semantics: POST .../complete ONLY if can_complete is true. If not,
  route to / without completing — wizard reappears next session.
  NEVER mark an org complete when it has no branch.

  Wizard structure

  Single route /onboarding with ?step= URL sync (so refresh/back work).

  ┌─────┬────────────────────────┬───────────────────────────────┬──────────┐
  │  #  │      Step key(s)       │           Title EN            │ Required │
  ├─────┼────────────────────────┼───────────────────────────────┼──────────┤
  │ 0   │ —                      │ Welcome                       │ —        │
  ├─────┼────────────────────────┼───────────────────────────────┼──────────┤
  │ 1   │ branch                 │ Create your first branch      │ ✅       │
  ├─────┼────────────────────────┼───────────────────────────────┼──────────┤
  │ 2   │ payment_methods        │ How do customers pay?         │ ✅       │
  ├─────┼────────────────────────┼───────────────────────────────┼──────────┤
  │ 3   │ categories +           │ Build your menu               │ ✅       │
  │     │ menu_items             │                               │          │
  ├─────┼────────────────────────┼───────────────────────────────┼──────────┤
  │ 4   │ ingredients + recipes  │ Ingredient costs              │ ⬜       │
  │     │                        │ (recommended)                 │          │
  ├─────┼────────────────────────┼───────────────────────────────┼──────────┤
  │ 5   │ addons                 │ Addons & extras               │ ⬜       │
  ├─────┼────────────────────────┼───────────────────────────────┼──────────┤
  │ 6   │ team                   │ Invite your team              │ ⬜       │
  ├─────┼────────────────────────┼───────────────────────────────┼──────────┤
  │ 7   │ —                      │ Review & finish               │ —        │
  └─────┴────────────────────────┴───────────────────────────────┴──────────┘

  REUSE, DON'T REBUILD. Every step embeds the existing feature's form/list
  components in a narrowed layout. If a form is page-coupled, extract the form
  into its feature folder so both the page and the wizard import it. The wizard
  contributes only: framing copy, the stepper, progress logic, empty-state
  illustrations.

  Step behaviors:

  - Welcome (0): org name + logo (reuse org settings form fields). If org has
  partial data from a previous session, say "Picking up where you left off"
  and jump to the first incomplete required step.
  - Branch (1): single branch form. After create show success card +
  - Payments (2): payment-methods list is PRE-SEEDED by the backend (cash,
  card, digital_wallet, mixed, talabat_online, talabat_cash) when the org
  is created — so payment_methods.done is almost always ALREADY TRUE. Frame
  step 2 as "These are on — confirm and customize" not "add your first method".
  Note: payment_methods counts ACTIVE methods — if user deactivates all of
  them, the step regresses; surface that inline.
  - Menu (3): two-pane — categories left, items right (reuse existing
  components). Gate "Continue" on ≥1 category AND ≥1 active item, but the
  authoritative check is the refetched steps.done values.
  - Costs (4): sell the cost engine — "Add ingredient costs and Sufrix
  computes profit per item." Show recipe_coverage as a live progress ring.
  Fully skippable, never guilt-block.
  - Addons (5) / Team (6): thin wrappers over existing managers, both skippable.
  - Review (7): render steps array as checklist (done = green, optional-undone
  = gray "later"), recipe_coverage ring, and Finish button bound to
  can_complete. If can_complete is false, disable Finish and show
  "Finish requires: <missing required steps>" where each links back to its
  step. On Finish → POST .../complete → light confetti → route to /.

  Files to create

  src/pages/onboarding/
    index.tsx                  → page entry, routing guard
    wizard-shell.tsx           → full-screen frame, stepper, footer
    stepper.tsx                → step indicator (direction-aware for RTL)
    step-frame.tsx             → title/description wrapper per step
    step-welcome.tsx
    step-branch.tsx            → imports existing branch form
    step-payments.tsx          → imports existing payment methods manager
    step-menu.tsx              → imports existing category + item forms
    step-costs.tsx             → imports existing ingredient/recipe forms
    step-addons.tsx            → imports existing addon manager
    step-team.tsx              → imports existing user form
    step-review.tsx            → checklist + CoverageRing + Finish
    coverage-ring.tsx          → circular progress ring for recipe_coverage
    use-onboarding.ts          → TanStack Query hooks for status + complete

  src/widgets/setup-checklist/
    setup-checklist.tsx        → dismissible card on overview (post-wizard)

  Files to edit

  - src/app/router/index.tsx — add /onboarding route (outside shell),
  add routing guard that redirects org_admins to /onboarding when not completed
  - src/pages/dashboard/dashboard.tsx — add SetupChecklist widget

  Post-wizard: setup checklist widget

  After completion, on the overview screen, render a dismissible card while
  any optional step has done === false OR recipe_coverage < 0.8:
  - Shows optional steps only, each deep-linking to its normal screen
  - first_order step says "Open a shift on the iPad and ring up your first
  order" (POS bridge)
  - Dismiss state in localStorage (follow existing persistence util)
  - Disappears automatically when all optional steps are done

  i18n

  Full Egyptian-Arabic coverage. Suggested AR step titles:
  الفرع، طرق الدفع، المنيو، تكلفة المكونات، الإضافات، الفريق، المراجعة والإنهاء
  Stepper connector lines must mirror correctly in RTL — verify with existing
  direction provider.

  Pitfalls
  
  - Do NOT store step completion client-side. done can regress (deleting the
  only branch un-checks the branch step). Only the completed flag never
  regresses.
  - Do NOT gate wizard on steps array order — gate on required/done fields.
  - Do NOT call POST .../complete on an org that can_complete is false.
  - Test the backfill path: an org with historical orders must land on /, never
  /onboarding.

  ---
  PART 2 — Backend integration (cost engine)
  
  A.1 Menu Engineering screen (new page)

  New route: /menu/engineering (tab under /menu or standalone — follow existing
  conventions).
  Permission gate: can("orders", "read").

  Endpoint: GET /reports/branches/{branch_id}/menu-engineering?from=&to=&limit=
  Default the date picker to last 30 days.

  Response types (all monetary in piastres → display ÷100):

  MenuEngineeringReport {
    rows: MenuEngineeringRow[],
    total_sales, total_cost, total_profit,  // piastres → ÷100
    rows_cost_missing: number,
  } 
  MenuEngineeringRow {
    menu_item_id, size_label, item_name, category_id, category_name,
    quantity_sold,
    sales,            // piastres → ÷100
    total_cost,       // piastres | null (null = ≥1 line had unknown cost)
    item_profit,      // per-unit, piastres | null → ÷100
    total_profit,     // piastres | null → ÷100
    popularity_pct,   // 0..1 ratio, no conversion
    cost_missing_lines: number,
    profit_category: "high" | "low" | null,
    popularity_category: "high" | "low",
    class: "star" | "workhorse" | "challenge" | "dog" | null,
  } 
  
  Two views, one toggle:

  Scatter/quadrant view (default):
  - Recharts ScatterChart. X = popularity_pct, Y = item_profit ÷ 100 (EGP).
  - ReferenceLine at popularity threshold and weighted-average per-unit profit.
  - Color by class: star=green, workhorse=blue, challenge=amber, dog=red.
  class:null rows = hollow/gray dots with tooltip "Add ingredient costs to
  classify". 
  - Quadrant labels: Stars / Workhorses / Challenges / Dogs (Foodics
  vocabulary).
  - Tooltip: name + size, sales EGP, qty, profit EGP, popularity %.

  Table view:
  - TanStack Table. Columns: Item, Size, Sales, Quantity, Total Cost, Item
  Profit,
  Total Profit, Popularity %, Profit Category, Popularity Category, Class.
  - Category filter (client-side), search by name, Excel export (existing util,
  EGP columns).
  - class as a colored Badge. total_cost: null rows: em-dash in cost/profit
  cells
    - "N lines missing cost" linking to recipe editor for that item.
  - class Arabic strings: نجم / حصان عمل / لغز / عبء
  
  Header: 4 StatCards — Total Sales EGP, Total COGS EGP, Gross Profit EGP,
  "Items missing costs: N". Clicking missing-costs card filters table to those
  rows.

  FSD placement: src/features/menu-engineering/ for the screen components,
  src/entities/costing/queries.ts for shared SkuCost/AddonCost hooks.

  A.2 Cost columns on menu and addon screens

  GET /costing/menu-items?org_id={org_id} → SkuCost[]:
  - price, cost: piastres → ÷100 for display
  - margin_pct, food_cost_pct: ratios, no conversion
  - cost_missing: boolean
  - Join on (menu_item_id, size_label) pair — NEVER on menu_item_id alone
  
  Add "Cost / Margin" column pair to menu items screen. Show food_cost_pct as
  chip: green <30%, amber 30-40%, red >40%. cost_missing rows get warning icon
  linking to recipe editor.

  Same for addon items screen using /costing/addon-items.

  After recipe save, invalidate ['costing','menu-items',orgId] and
  ['costing','addon-items',orgId].

  A.3 Order detail cost rows

  OrderItem gained: line_cost (piastres|null), unit_cost (piastres|null),
  cost_missing.
  OrderItemAddon gained: line_cost (piastres|null).

  In the order detail drawer, add muted "Cost" column and footer row:
  "COGS: X EGP · Gross profit: Y EGP (Z%)"
  If any line has cost_missing, show profit as "≥ lower-bound" with tooltip.
  NEVER silently treat missing cost as zero.

  Orders export: use line_cost for the COGS column (true sale-time cost, ÷100).

  A.4 Menu Advisor changes

  1. POST .../runs now returns 409 (was 400) when a run is in progress.
  Treat 409 as "run in flight — start polling", not a generic error toast.
  2. Stale-run takeover: in_progress runs >15 min are auto-failed. Remove any
  "stuck run" escape hatch UI.
  3. Failed-run visibility: GET .../runs/latest?any_status=true returns the
  most recent run regardless of status. Advisor empty state is now a
  three-way switch:
    - completed → render report
    - in_progress → progress state + poll
    - failed → error card showing error_message + "Run again" button
  4. price_changed_in_window flag: badge these items as "recently repriced".
  5. Do NOT chart old runs against new ones — old runs have costs ~100× too
  small.
  Gate run-over-run comparisons to runs created after the deploy date.

  A.5 Fixed report endpoints

  GET /reports/branches/{id}/addons and /items-combined were broken (missing
  translation columns). They now work correctly — re-enable any disabled
  widgets or workarounds for these endpoints.

  ---
  PART 3 — Dashboard UX streamlining
  
  B.1 Global scope context (org · branch · period)

  New Zustand store src/shared/scope/scope-store.ts:
  interface ScopeState {
    branchId: string | null;
    from: string | null;
    to: string | null;
    preset: "today" | "yesterday" | "7d" | "30d" | "mtd" | "custom";
    setBranch(id: string | null): void;
    setRange(from, to, preset): void;
  } 
  Persist branchId + preset to localStorage. Recompute from/to from preset on
  load.
  
  src/shared/scope/use-scope-url-sync.ts: mount in Layout, mirror store to
  ?branch=&from=&to=&preset= and hydrate from URL on first load (URL wins).

  Global scope bar in header: branch selector (SearchableSelect, hidden if only
  one branch — show static text) + period preset chips + DateRangePicker.

  src/shared/scope/use-scoped-params.ts: returns {branchId, from, to}.

  Refactor analytics, orders, shifts, inventory, recipes, bundles, users,
  permissions, and all other scoped pages to read from useScopedParams().
  Remove all bespoke branch selects and per-page DateRangePickers.

  Acceptance: grep -rn "DateRangePicker" src/pages returns empty.

  B.2 Overview redesign (src/pages/dashboard/dashboard.tsx)

  Kill duplicate fetching: lift per-branch queries to useQueries in the page,
  pass results as props to BranchCard. Delete BranchCard's own
  useGetCurrentShift.

  New layout:
  1. KPI row — 4 StatCards with trend vs prior equal period: revenue EGP,
  orders,
  AOV EGP, active shifts. Add delta/trend prop to StatCard (▲/▼ %).
  2. Attention panel — prioritized list: branches with no open shift during
  business hours, low-stock items, stuck/failed states. Replaces separate
  low-stock card. 
  3. Branch status grid — BranchCard (prop-fed). Click sets scope.branchId then
  navigates to /orders with scope. Show today's sales EGP, open-shift teller,
  running duration, low-stock badge.
  4. Recent activity — RecentOrdersPanel driven by scope.branchId.
  5. Remove quick-actions card (duplicates sidebar).
  6. Also add SetupChecklist widget here (see Part 1).

  B.3 Analytics streamlining

  Adopt global scope (B.1). Delete local branch select and DateRangePicker.
  Keep granularity control and all 6 tabs.
  Consistent skeletons for every tab (ChartCard should accept loading prop).
  RTL charts: mirror axis/legend using i18n.dir(). Verify tooltips + fmtMoney.

  B.4 Cross-cutting polish

  - Deep-linking with scope: every "All →" / row click carries current scope.
  - Replace ad-hoc text-[10px]/text-[11px] with text-xs/text-sm + tabular class.
  grep -rn "text-\[1[01]px\]" src must return empty.
  - Every page renders through PageShell with title/description/action.
  - AsyncBoundary (src/shared/ui/async-boundary.tsx): shared loading/error/
  empty wrapper for all list/table pages.

  ---
  PART 4 — Menu, Recipes, Inventory streamlining
  
  C.1 Merge Menu + Recipes + Bundles navigation

  Routing: /menu parent with tabbed children: /menu/items, /menu/recipes,
  /menu/bundles, /menu/add-ons. Redirect /recipes → /menu/recipes, /bundles
  → /menu/bundles for backwards compat.

  Sidebar: collapse menu/recipes/bundles/menuAdvisor into a single expandable
  "Menu" entry with sub-items. Preserve all RBAC.

  Menu shell: src/pages/menu/menu-layout.tsx — Tabs strip + Outlet inside
  one PageShell. Each existing page becomes a tab panel (strip its own PageShell
  to avoid double padding).

  C.2 Reusable editable grid + bulk runner

  src/shared/ui/editable-grid.tsx (wraps existing DataTable):
  - Inline edit of designated cells committing on blur/Enter via
  onCommitRow(row, patch)
  - Add-row affordance
  - Bulk-select toolbar
  - Paste-to-create: paste TSV/CSV → column-mapping → preview with per-row
  validation
  → "Create N" fan-out

  src/shared/lib/bulk-runner.ts:
  async function runBulk<T>(rows: T[], op: (row: T) => Promise<unknown>, {
    concurrency = 4,
    onProgress, // (done, total, lastError?) => void
  }): Promise<{ ok: T[]; failed: {row: T; error: unknown}[] }>
  Bounded concurrency (4). Does not abort on one failure. Returns summary
  → toast "Created 57, 3 failed" with "retry failed" action.
  
  C.3 Menu items streamlining

  - Inline grid as default (Phase C.2 grid): edit name, base_price (÷100
  display, ×100 send), category, is_active via PATCH /menu-items/{id}.
  Full dialog stays for sizes/translations/advanced.
  - Bulk add via paste/CSV → fan-out POST /menu-items.
  - Duplicate item: GET → POST (name + " (copy)") → replay sizes → replay recipe
  lines.
  - Size templates: named size sets in client localStorage.
  - Bulk price ops: select rows → "+N EGP" / "×N%" → fan-out PATCH. Convert to
  piastres.
  - Image flow: create → (1) POST /menu-items, (2) POST
  /uploads/menu-items/{id}.
  Item appears immediately; image fills in when upload resolves.

  C.4 Recipe single-screen builder

  - useFieldArray across all sizes, commit in one POST /recipes/drinks/{id} per
  size.
  - Base-size scaling opt-in toggle.
  - Live cost & margin preview as lines are edited (browser-computed from
  cost_per_unit ÷ 100 × quantity_used). Label as "current-cost estimate".
  - Copy recipe from another item.
  - Inline "create ingredient" in picker without leaving screen.
  - Add-ons recipes get the same builder.

  C.5 Cost & margin helpers

  src/entities/menu/cost.ts — pure functions, unit-tested:
  // All inputs in piastres; output in piastres
  function recipeCost(recipe: DrinkRecipe, catalog: OrgIngredient[]): number |
  null
  function itemMargin(item: MenuItem, recipe: DrinkRecipe, catalog:
  OrgIngredient[]): number | null
  // null when any ingredient lacks cost_per_unit
  Surface in items grid (cost ÷100 EGP, margin% per base size), recipe builder
  (live running cost), and bundles (per-component margin).
  
  Unit test minimum: recipeCost with multi-size + missing cost ingredients;
  itemMargin with zero-cost and null-cost cases.

  C.6 Inventory streamlining

  - "Receive delivery" batch: editable grid → fan-out PATCH /stock + POST
  /adjustments.
  - Low-stock → quick restock: multi-select → enter received qty → fan-out.
  - Inline stock + reorder-threshold editing. Optimistic + undo.
  - One-step ingredient onboarding: POST catalog then POST stock in one gesture.
  - Depletion forecast: min(current_stock / quantity_used) per ingredient. Info
  panel.
  - Transfer-from-alert: one-click "transfer from <branch with surplus>"
  prefilling form.
  - Stock-take CSV import/export.

  ---
  SEQUENCING
  
  Do these in order:

  1. Regenerate API client (Step 0 above) — first, blocks everything else
  2. Piastres audit + form reliability audit — before any new feature code
  3. Onboarding wizard (Part 1) — highest visible priority
  4. Menu Advisor 409 fix + failed-run visibility (Part 2, A.4) — unblocks ops
  5. Global scope store + URL sync (Part 3, B.1) — backbone for later phases
  6. Order-detail cost rows (A.3) + costing columns on menu/addon (A.2)
  7. Menu Engineering screen (A.1) + Overview redesign (B.2) — can run in
  parallel
  8. Analytics streamlining (B.3)
  9. Menu IA merge (C.1) + Editable grid + bulk runner (C.2)
  10. Menu items (C.3) + Recipe builder (C.4) + Cost helpers (C.5)
  11. Inventory (C.6) + Cross-cutting polish (B.4)

  ---
  ABSOLUTE PITFALLS — NEVER DO THESE
  
  - cost ?? 0 anywhere. null is "unknown", not free.
  - Render null cost as "0.00 EGP". Use em-dash or "cost missing" badge.
  - Join costing data on menu_item_id alone — always join on (menu_item_id,
  size_label).
  - Store step completion state client-side in the onboarding wizard.
  - Call POST .../onboarding/complete on an org where can_complete is false.
  - Chart old advisor runs (pre-cost-engine-rebuild) against new runs.
  - Remove any existing feature — make the new way the default, keep the old as
  an option.

  ---
  VERIFICATION

  pnpm install
  pnpm exec tsc --noEmit                      # no new errors
  pnpm vitest run                             # touched suites green
  pnpm exec vite build                        # production build succeeds
  grep -rn "cost ?? 0" src                    # must be empty
  grep -rn "null.*0\.00" src                  # must be empty
  grep -rn "text-\[1[01]px\]" src            # must be empty (after B.4)
  grep -rn "DateRangePicker" src/pages        # must be empty (after B.1)
  # Manual: toggle to AR, verify RTL on overview + analytics + wizard stepper
