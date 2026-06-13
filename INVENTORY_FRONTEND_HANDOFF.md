# Inventory Module — Frontend Build Handoff

> For the dashboard agent building the **Inventory** product. The backend is now
> Foodics-grade and complete for every journey. This is greenfield UI work — the
> `/inventory` route is still a "coming soon" placeholder and there is no
> `src/features/inventory/` directory yet.
>
> **Design spec (read first):** `/Users/shawket/Desktop/SufrixRust/INVENTORY_AUDIT_AND_WIREFRAMES.md`
> — the 8 manager journeys as ASCII wireframes + click-paths + information architecture.
> This handoff is the API contract that backs those wireframes.

---

## 0. First steps

1. **Regenerate the Orval client** — the backend spec changed (new endpoints + fields).
   ```
   npm run generate:api      # orval.config.ts reads ../SufrixRust/openapi.json (702 KB, current)
   ```
   New hooks/models you'll get: `useGetInventorySettings`, `useUpdateInventorySettings`,
   `useListOrgOrders`, `useBranchShrinkage`, `useOrgShrinkage`, `useOrgConsumption`,
   `useOrgWasteReport`, plus changed shapes (see §2). Fix any type breaks.
2. Delete 3 dead generated files if still present (Orval split mode leaves them):
   `models/inventoryCountInput.ts`, `inventoryCountRow.ts`, `inventoryDiscrepancy.ts`.
3. The whole `inventory.*` i18n string set already exists in `src/i18n/locales/{en,ar}.json`
   (catalog, stock, movements, waste, stocktakes, purchasing, reports, …) — wire `t("inventory.…")`.

Everything else from the prior overhaul (close-shift, void note, `display_order`) is already
absorbed in the dashboard — nothing to redo there.

---

## 1. Information architecture (manager language, never engineering terms)

`Inventory` is a top-level nav item under **Operations**. Sub-sections:

```
Inventory
├─ Today            home: stock value, low-stock, deliveries arriving, counts due
├─ Items            ingredients: cost, stock/branch, low-stock level, supplier, "used in"
│    └─ (item)      drawer: Stock history (movements), recipes, adjust/edit
├─ Purchasing  ▸ Orders (PO → receive)  ·  Suppliers
├─ Stock counts     start → enter counts → differences → finalize → variance
├─ Waste            log spoilage with a reason
├─ Transfers        move stock between branches
└─ Reports          stock value · COGS & margins · usage · waste · shrinkage
```

Wording map (use the right column in the UI): movement ledger → **Stock history**;
variance → **Difference**; reorder threshold → **Low-stock level**; stocktake → **Stock count**;
weighted average cost → just **Cost**; below_zero → **Sold past zero**.

**Scope:** Catalog/Items + Suppliers + inventory **Settings** are **org-scoped**. Stock,
Movements, Waste, Counts, Transfers, POs are **branch-scoped** → gate on a branch selection
(`inventory.pickBranch` exists). Org/branch come from the existing scope stores
(`app.store.ts` / `scope.store.ts`); headers `X-Org` / `X-Branch` are set by `apiContext`.

---

## 2. What's new/changed in this pass (since `BACKEND_HANDOFF_inventory_overhaul.md`)

This pass added the **stock-count variance guardrail** and closed the Foodics gaps. New fields
and endpoints:

### Stock-count variance guardrail (the headline)
- `StocktakeFull` now includes **`variance_threshold_pct: number`** (org tolerance, default 10).
- `StocktakeItem` and `VarianceRow` now include **`variance_reason: string | null`**.
- `VarianceRow` now includes **`is_flagged: boolean`**; `VarianceReport` includes
  **`variance_threshold_pct: number`**.
- `PUT /stocktakes/{id}/items` body items now accept an optional **`variance_reason`**
  (`theft | spoilage | breakage | miscount | supplier_short | transfer_error | other`).
- **`POST /stocktakes/{id}/finalize` returns `409`** if any *flagged* row has no `variance_reason`.
  The 409 body `error` lists the offending item names.
- A row is **flagged** when `|counted − expected|` is ≥ `variance_threshold_pct`% of expected,
  or when stock appears-from / vanishes-to zero. **Compute this client-side** from
  `expected_qty`, `counted_qty`, and `variance_threshold_pct` so you can highlight rows live as
  the manager types, and require a reason on flagged rows before enabling "Finalize."
- Org threshold is read/set via **`GET|PUT /inventory/orgs/{org_id}/settings`**
  → `{ stocktake_variance_threshold_pct: number }` (perm `inventory` read/update). Put this in an
  Inventory ▸ Settings panel.

### Shrinkage is single-source (no double counting)
Finalizing writes the captured reason onto each `stock_count` movement. A **shrinkage-by-reason**
report reads those movements — do **not** create separate waste entries for shrinkage.
- `GET /reports/branches/{branch_id}/shrinkage?from&to` and `GET /reports/orgs/{org_id}/shrinkage?from&to`
  → `ShrinkageRow[] { reason, org_ingredient_id, ingredient_name, unit, shrinkage_qty, shrinkage_value (piastres|null) }`.

### Ingredient → supplier link (G2)
- `OrgIngredient` gains **`supplier_id: string | null`** and **`supplier_name: string | null`**.
- `CreateCatalogItemRequest` / `UpdateCatalogItemRequest` accept **`supplier_id`** (PATCH can set/replace,
  not clear-to-null).
- `LowStockRow` gains **`supplier_id`** + **`supplier_name`** → the reorder view can group/pre-fill a PO by supplier.

### Partial multi-shipment receiving (G1)
- `purchase_order_status` gains **`partially_received`**. `POST /purchasing/orders/{id}/receive`
  no longer force-closes the PO: it sets `received` only when **all** lines are fully received,
  otherwise `partially_received`, and **can be called again** for the remaining quantity.
- Receive screen: show `quantity_ordered`, `quantity_received` (already), and a "remaining"
  column; allow a partial receive and keep the PO openable.

### Low-stock noise fixed (G3)
- `below_reorder` / low-stock now require **`reorder_threshold > 0`** — items with no low-stock
  level set no longer false-flag. No client change needed; just trust the flag.

### "Counts due" signal (G4)
- `BranchInventoryItem` gains **`last_counted_at: string | null`** (timestamp of the last finalized
  count that included the item; null = never). Use it for the Today ▸ "counts due" tile
  (e.g. `> 14 days` or null).

### Org-wide rollups + PO list (G5, G7)
- `GET /purchasing/orgs/{org_id}/orders?status&expected_before` — org-wide PO list with filters.
  Branch list `GET /purchasing/branches/{branch_id}/orders` now also accepts `?status&expected_before`.
  Use `status=ordered|partially_received` + `expected_before=<today EOD>` for the Today
  "deliveries arriving" tile.
- `GET /reports/orgs/{org_id}/consumption?from&to` and `GET /reports/orgs/{org_id}/waste-report?from&to`
  — org rollups alongside the existing branch versions.

### Permissions (G9)
- All inventory-domain reports now gate on **`inventory`/`read`** (was a mix of `reports`/`read`).
  So a manager with inventory read sees the whole inventory Reports tab. New permission resources
  from the overhaul: `stocktakes`, `inventory_waste`, `suppliers`, `purchase_orders`
  (org_admin full, branch_manager operate). Bake these into the permission-matrix UI; drop
  `shift_counts`.

---

## 3. Screen → endpoint map

Exact request/response shapes are in `../SufrixRust/openapi.json` (the Orval source). Money is
**piastres** everywhere — divide by 100 for EGP display, multiply on save (the catalog form already
does this). **`cost*: null` = unknown — render "—", never 0.**

| Screen | Endpoints (Orval hooks) |
|---|---|
| **Today** | `useOrgInventoryValuation` (stock value) · `useOrgLowStock` (low-stock, supplier-aware) · `useListOrgOrders({status, expected_before})` (deliveries) · branch `useListWaste` (today's waste) · `useListBranchStock` → `last_counted_at` (counts due) |
| **Items** (list) | `useListCatalog` (org) → `OrgIngredient[]` incl. `supplier_id/name` · per-branch stock `useListBranchStock` → `current_stock`, `reorder_threshold`, `below_reorder`, `last_counted_at` |
| **Item create/edit** | `useCreateCatalogItem` / `useUpdateCatalogItem` (name, unit, category, `cost_per_unit`, `supplier_id`) · per-branch `useAddToBranchStock` / `useUpdateBranchStock` (`current_stock`, `reorder_threshold`) |
| **Item drawer → Stock history** | `useListMovements({org_ingredient_id, type?, from?, to?})` — render plain "Stock history" |
| **Item drawer → recipes** | link into existing **Menu ▸ Recipes** (`useListDrinkRecipe` / addon recipes); ingredient unit normalized server-side |
| **Suppliers** | `useListSuppliers` / `useCreateSupplier` / `useUpdateSupplier` / `useDeleteSupplier` (org) |
| **Purchase orders** | `useCreatePurchaseOrder` (branch) · `useListOrders` / `useListOrgOrders` · `useGetPurchaseOrder` · `useReceivePurchaseOrder` (partial OK) · `useCancelPurchaseOrder` |
| **Stock counts** | `useCreateStocktake` (branch) · `useListStocktakes` (history) · `useGetStocktake` (incl. `variance_threshold_pct`) · `useUpsertStocktakeItems` (counts + `variance_reason`) · `useFinalizeStocktake` (handle 409) · `useCancelStocktake` · `useVarianceReport` |
| **Waste** | `useCreateWaste` (reason ∈ expired/spoiled/damaged/overproduction/theft/other) · `useListWaste` · `useBranchWasteReport` / `useOrgWasteReport` |
| **Transfers** | `useCreateTransfer` · `useListTransfers({direction})` · `useUpdateTransfer` · `useDeleteTransfer` |
| **Reports** | valuation (`useBranch/OrgInventoryValuation`) · COGS/margins (`useBranchMenuEngineering?cost_basis=`) · consumption (`useBranch/OrgConsumption`) · waste (`useBranch/OrgWasteReport`) · shrinkage (`useBranch/OrgShrinkage`) |
| **Settings** | `useGetInventorySettings` / `useUpdateInventorySettings` (variance threshold %) |

---

## 4. Behaviors to get right

- **Stock count flow** (see wireframe #4): start → enter counts (autosave via `PUT items`) →
  rows where `is_flagged` (computed from `variance_threshold_pct`) must collect a `variance_reason`
  before "Finalize" is enabled; the backend also enforces this (409). After finalize, show the
  variance report (shrinkage/overage/net, `unknown_cost_count`). History list = `useListStocktakes`;
  open a finalized one read-only.
- **Receiving** (#3): a partial receive returns `partially_received` and the PO stays openable —
  surface a "receive remaining" affordance. Full receive returns `received`.
- **Reorder → PO** (#7): `useOrgLowStock` rows carry `supplier_id/name` + `deficit` — let the manager
  select rows and create one PO per branch+supplier, pre-filling quantity from `deficit`.
- **Unknown cost**: any `*_value` / `cost_per_unit` of `null` means unknown — show "—" and exclude
  from totals (the backend already excludes and reports `unknown_cost_count`).
- **Bilingual + RTL**: mirror layouts for `ar`; the i18n keys and `applyHtmlDir` are already wired.

---

## 5. Reference
- Wireframes + IA + click-paths: `../SufrixRust/INVENTORY_AUDIT_AND_WIREFRAMES.md`
- API spec (Orval source): `../SufrixRust/openapi.json`
- Prior overhaul changelog: `BACKEND_HANDOFF_inventory_overhaul.md` (this doc supersedes its "build new screens" section)
