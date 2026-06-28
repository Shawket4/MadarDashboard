# Inventory Overhaul — Frontend Dashboard Sync Note

Backend changes from the 2026-06-16 inventory overhaul that the **MadarDashboard**
(React/Vite/Orval) and, where noted, the **Madar POS** must adopt. Start by
running `npm run generate:api` (Orval) in the dashboard — `openapi.json` was
regenerated and carries all new fields/endpoints/params. Items below explain the
*semantics* Orval can't convey.

Money convention is unchanged: **piastres** everywhere; **NULL cost = unknown,
never 0/free**.

---

## 1. Per-branch costing (BIGGEST change — affects every cost display)

Ingredient cost is now **two-tier**:

- `org_ingredients.cost_per_unit` = the **org default / standard cost** (set in the
  catalog editor). Used as a fallback and for org-wide views with no branch context.
- `branch_inventory.cost_per_unit` = each branch's **actual weighted-average cost**,
  moved only by that branch's purchase receipts. **This is the authoritative cost
  for that branch's COGS, margins, and inventory valuation.**
- `ingredient_cost_history` is now branch-scoped (`branch_id` column; NULL row =
  org-level standard epoch). Point-in-time cost resolves: branch epoch → org epoch
  → org default.

**Dashboard impact:**
- **Branch stock list** (`GET /inventory/branches/{id}/stock`): `cost_per_unit` now
  returns the **branch actual cost** (falls back to org default if the branch has
  none yet). Label it as the branch's cost, not the catalog cost.
- **Catalog editor**: `org_ingredients.cost_per_unit` is now the *standard/default*
  cost. Receipts no longer overwrite it (they update the branch cost). Consider
  relabeling the catalog field "standard cost" and showing per-branch actual cost
  separately. **A receive no longer changes the catalog cost** — don't expect it to.
- **Costing endpoints now accept an optional `branch_id` query param:**
  - `GET /costing/menu-items?org_id=…&branch_id=…`
  - `GET /costing/addon-items?org_id=…&branch_id=…`
  Pass the active branch to get that branch's actual food-cost; omit it for the
  org/standard cost. The menu catalog list (`GET /menu/items?...&branch_id=…`) also
  threads `branch_id` into its embedded SKU cost chips.
- **Menu engineering** (`/reports/branches/{branch_id}/menu-engineering?cost_basis=current`):
  single-branch uses that branch's actual cost; the all-branches (nil id) view uses
  the org default. No request shape change.
- **Inventory valuation reports** now value each branch's stock at its own cost and
  report a stock-weighted blended `cost_per_unit`. No shape change; numbers differ
  for multi-branch orgs.

---

## 2. Stocktakes — reconcile-to-live + cycle counts

**Behavior change (no shape change) at finalize:** a count now reconciles to **live**
stock by delta, and variance is measured against the live book stock at finalize
(captured in a new `stocktake_items.system_qty`), **not** the open-time snapshot. So
sales during the count no longer show up as shrinkage. The variance report's
`variance` / `variance_value` / `is_flagged` now reflect *true* unexplained variance.

**New (additive) on `POST /stocktakes/branches/{branch_id}`** — cycle/scoped counts:
- `category` (string, optional): snapshot only ingredients in this catalog category.
- `org_ingredient_ids` (uuid[], optional): snapshot only these ingredients.
- Omit both = full-branch count (unchanged).
- UI: add a "count scope" selector (whole branch / by category / pick items).

**Found items:** `PUT /stocktakes/{id}/items` now **upserts** — you can count an
ingredient that wasn't in the snapshot (untracked stock, or outside a cycle scope)
and it's added with its current stock as the baseline. UI: allow "add item to count".

Note: stocktakes are **not** blind (expected_qty still returned) per product decision.

**Validation (recipes):** saving a recipe / addon-ingredient / optional-field that links
an `org_ingredient_id` from a *different org* is now rejected with 400 ("Linked
ingredient not found in this organization's catalog"). The dashboard only offers
same-org ingredients, so this is just a defensive guard — surface the message if hit.

---

## 3. Catalog depth — pack sizes + par levels

**`org_ingredients` (catalog create/update) new fields:**
- `pack_unit` (string, optional) + `pack_size` (number, optional): a named purchase
  pack and how many **base stock units** it yields (e.g. `case` = 24 pcs). Lets
  purchasing buy in packs beyond g/kg/ml/l/pcs.
- `yield_pct` (number, optional): usable % after trim/cook loss (70 = 70%). See §4.
- `density_g_per_ml` (number, optional): bridges weight↔volume in recipes. See §4.
- UI: add these to the ingredient form (all optional/advanced).

**`branch_inventory` (add/update stock) new fields:**
- `par_min` (number, optional): reorder point (replaces/overrides `reorder_threshold`
  when set).
- `par_max` (number, optional): order-up-to level.
- `below_reorder` is now computed from `COALESCE(par_min, reorder_threshold)`.
- UI: replace the single reorder number with optional min/max par inputs.

---

## 4. Recipe depth — yield + density (applied at SAVE time)

When you save a recipe / addon-ingredient / optional-field deduction, the stored
`quantity_used` is now the **yield-adjusted consumption in the ingredient's base
unit**:
- **Density**: a recipe line in `ml` against a gram-based ingredient (or vice-versa)
  converts via `density_g_per_ml`. Without a density, cross-family (weight↔volume)
  is still rejected — show a clear hint to set density on the ingredient.
- **Yield**: the entered quantity is grossed up by `1 / (yield_pct/100)` (producing
  N usable units consumes more raw). So the stored/displayed `quantity_used` is the
  **raw consumption**, which may exceed what the chef "uses". If you want to show
  "recipe needs", divide back by yield client-side.
- **Changing `yield_pct` rebases existing recipes:** like a unit change, editing an
  ingredient's yield now rescales the stored `quantity_used` of every recipe /
  addon-ingredient / optional that links it (by old-yield ÷ new-yield), so historical
  recipes stay correct without manual re-entry. No frontend action — just don't be
  surprised that saving a new yield shifts dependent recipe quantities.

---

## 5. Purchasing — lifecycle, guards, price variance, reorder

- **New `POST /purchasing/orders/{id}/submit`**: `draft → ordered` (place with
  supplier). Receiving is still allowed directly from draft. UI: add a "Place order"
  action so "ordered/awaiting goods" is a real, filterable state.
- **PO list filters:** `GET …/orders` accepts `status` (draft|ordered|partially_received|
  received|cancelled) and `expected_before` (ISO datetime, for "arriving by") query
  params — wire them into the PO list filters.
- **Over-receive is now rejected** (cumulative received can't exceed ordered) — show
  the 400 message; if a supplier truly sent more, the operator edits the order qty.
- **Cancelling a partially-received PO is now blocked (409)** — must reverse received
  goods first. UI: hide/disable cancel once any stock has been received.
- **Price variance**: `POST /purchasing/orders/{id}/receive` line input accepts an
  optional `unit_cost` (actual invoice piastres per purchase unit). When provided it
  drives the branch WAC + ledger instead of the ordered price. UI: let the receiver
  enter the actual invoiced price per line.
- **`received_at` / `received_by`** are now stamped on **every** receipt (partial
  included).
- **New `GET /purchasing/branches/{branch_id}/reorder-suggestions`**: ingredients at
  or below their reorder point, with the qty to reach `par_max`, **grouped by the
  ingredient's default supplier**. UI: a "Reorder" screen → one draft PO per supplier
  (currently a suggestion list; auto-create-PO is a follow-up).
- **Goods receipts (GRN):** receiving now records a first-class goods-receipt per
  delivery (multi-shipment audit + per-line actual cost). **New
  `GET /purchasing/orders/{id}/receipts`** returns them (`GoodsReceipt` with `lines`,
  `is_return`, receiver/time). UI: show a delivery history on the PO.
- **Supplier returns: new `POST /purchasing/branches/{branch_id}/returns`** —
  `{supplier_id?, purchase_order_id?, reference?, note?, lines:[{org_ingredient_id,
  quantity, unit_cost?}]}`. Decrements stock and posts a `purchase_return` movement;
  recorded as a return goods-receipt. UI: a "Return to supplier" action.

---

## 6. POS impact (Madar POS)

- Order creation/cost snapshot is now per-branch (uses the order's branch cost) — no
  request change, but COGS figures will differ per branch.
- Deterministic size fallback: a line sent **without** a `size_label` for a sized
  item now deducts/cost the canonical smallest-size recipe (was arbitrary). Prefer
  always sending the size.
- **Void / cancel logging (no API change, reporting change):** voiding or
  cancelling a made-but-not-restocked order now records the consumption as **waste**
  (a void reverses the sale via `void_restock` then re-deducts as `waste`; a delivery
  cancel deducts as `waste`) — consistent across both. Net stock is unchanged; the
  difference is reports show it as waste, not as a sale on a voided order. Both the
  void and delivery-cancel paths are concurrency-safe (guarded compare-and-swap), so
  a double-tap can't double-deduct. The auto-logged waste reason is **`order_cancelled`**
  (distinct from `overproduction`) — add it to the waste-reason filter/labels in
  reports, but it is system-generated, not a manual waste-entry option.
- **Migrations now run on server boot** (`sqlx::migrate!` in main.rs) and fail fast on a
  checksum mismatch — deploys no longer need a separate migrate step, and a binary can't
  serve against a schema that's missing its columns. Prod will auto-apply on next deploy.

---

## 7. Migrations added (run order on prod, all additive except the adjustments DROP)

- `20260616000000_per_branch_costing.sql` — branch_inventory.cost_per_unit (seeded
  from org cost) + ingredient_cost_history.branch_id + one-open-epoch unique indexes.
- `20260616100000_stocktake_reconcile_to_live.sql` — stocktake_items.system_qty.
- `20260616110000_catalog_depth.sql` — org_ingredients.pack_unit/pack_size +
  branch_inventory.par_min/par_max.
- `20260616130000_recipe_depth.sql` — org_ingredients.yield_pct/density_g_per_ml.
- `20260617000000_adjustment_reasons.sql` — (superseded) added the adjustment reason
  enum/column.
- `20260617010000_goods_receipts.sql` — goods_receipts + goods_receipt_lines tables +
  the `purchase_return` movement type.
- `20260617020000_remove_adjustments.sql` — **DROPs** branch_inventory_adjustments +
  inventory_adjustment_type/reason enums (the only non-additive migration; no backfill).

(Dev DB on 5432 is migrated. **Prod is NOT yet migrated.**)

---

## 8. Follow-up round — now DONE (was deferred)

Built + tested:
- **Pagination** — opt-in `limit`/`offset` on the waste + transfers list endpoints
  (default 200, max 1000).
- **Yield-change rebase** — changing `yield_pct` now rebases existing recipe
  quantities by old/new (the §4 caveat is resolved).
- **Transfer destination WAC blend** — a transfer now blends the source branch's cost
  into the destination's weighted-average cost (transfers stay instant).
- **Goods-receipts (GRN) + supplier returns** — see §5.
- **De-duplicated the order cost/deduction paths** — the standalone order line and the
  bundle component now share ONE resolver (`component_resolve::resolve_menu_item_configuration`);
  the recipe/swap/optional logic lives in one place. Internal-only; no API change.

## 9. BREAKING — manual stock adjustments REMOVED

The whole manual-adjustment feature is gone (backend + DB; **frontend must follow**):
- **Deleted endpoints:** `POST /inventory/branches/{id}/adjustments` and
  `GET /inventory/branches/{id}/adjustments`. The `branch_inventory_adjustments`
  table + `inventory_adjustment_type`/`inventory_adjustment_reason` enums are dropped
  (no backfill — branch stock is re-established from scratch; **catalog + recipes are
  untouched**).
- **Frontend action:** remove the "Add/Remove stock" (adjustment) screens and the
  adjustments history view. Stock corrections now happen via **stocktakes**
  (count-to-truth) and **waste**; stock-in via **purchase receipts** and **transfers**.
- Transfers still work and are audited via the movement ledger (no behavior change for
  the user). The categorized-adjustment-reasons work from the previous round was
  superseded by this removal.

## 10. Deliberately NOT done (with rationale)

- **Two-step transfers** (dispatch → receive / in-transit). Adds a multi-step transfer
  workflow that complicates the user flow; only worthwhile if branches have real
  transit time. The *cost* half (destination WAC blend) is done; the workflow is not.
- **Movement idempotency unique index.** Genuinely unsafe: a multi-line order
  legitimately produces multiple same-ingredient movements, so a unique index would
  reject valid writes. App-level guards already cover the real double-write cases.
- **Preview path swap logic** (`orders/handlers.rs` order-preview) is still a separate
  copy of the swap rules — it's a read-only estimate (no money/stock effect), so lower
  risk; the two *order-creation* paths are unified.

(The delivery double-cancel race is now **fixed** — see §6: cancel uses a guarded
compare-and-swap, same as void. Not a frontend concern.)
