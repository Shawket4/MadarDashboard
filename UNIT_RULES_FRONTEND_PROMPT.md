# Agent prompt — enforce unit rules in the inventory UI (dashboard)

> Paste this to the dashboard agent. Backend already enforces all of this (returns
> `400` otherwise); your job is to make the UI only offer valid choices and message
> the conversions clearly. No Orval regen is needed — these are validation rules,
> not contract/shape changes. Build on `INVENTORY_FRONTEND_HANDOFF.md`.

## Context
Ingredient quantities, stock and cost are all stored in the ingredient's **base unit**.
The backend supports unit conversion ONLY within a measure family:
- **weight:** `g ↔ kg`
- **volume:** `ml ↔ l`
- **count:** `pcs` (no conversion — pcs can only stay pcs)

## 1. Ingredient catalog — editing the base `unit`
`PATCH /inventory/orgs/{org_id}/catalog/{id}` with `{ "unit": "<new>" }` now **rebases every
reference** automatically (all recipe quantities + their unit labels, branch `current_stock` +
`reorder_threshold`, `cost_per_unit`, and cost history). It only allows **same-family** changes.

UI requirements on the **edit** form (not create):
- The unit dropdown must be **constrained to the current measure family**:
  - current `g` or `kg` → options `[g, kg]`
  - current `ml` or `l` → options `[ml, l]`
  - current `pcs` → `[pcs]` only (lock it; pcs can't convert)
- When the user picks a different (same-family) unit, show a confirm/notice:
  *"Changing the unit will convert this ingredient's recipes, stock and cost to the new unit."*
- **Do not send `cost_per_unit` in the same request that changes `unit`** — the backend returns
  `400` ("change the unit and the cost in separate requests"; the cost is auto-converted). If the
  user edited both, send two PATCHes (unit first, then cost) or block with a hint.
- On **create**, any of `g/kg/ml/l/pcs` is fine (no references exist yet).
- Surface the backend `400` message ("A unit can only change within the same measure: g ↔ kg or
  ml ↔ l.") if a bad change slips through.
- Note: `cost_per_unit` is now genuinely optional on create/update — omit it for "unknown cost".

## 2. Purchase orders — line `purchase_unit`
`POST /purchasing/branches/{branch_id}/orders` now requires each line's `purchase_unit` to be a
**real stock unit in the ingredient's measure** — free-text packs (e.g. "case") are rejected (`400`).

UI requirements on the PO line editor:
- `purchase_unit` is a **dropdown filtered by the selected ingredient's base-unit family**:
  - weight ingredient (base `g`/`kg`) → `[g, kg]`
  - volume ingredient (base `ml`/`l`) → `[ml, l]`
  - count ingredient (base `pcs`) → `[pcs]`
- **Remove the free-text unit and the `units_per_purchase_unit` input.** The backend derives the
  pack factor from the unit (e.g. buying in `kg` for a gram ingredient → factor 1000) and ignores
  any `units_per_purchase_unit` you send. `unit_cost` stays "piastres per purchase unit".
- Surface the backend `400` ("Purchase unit must match the ingredient's measure…") as a fallback.

## Acceptance
- Catalog edit unit dropdown never offers a cross-family option; pcs is locked.
- Changing g→kg (etc.) shows the conversion notice and succeeds; recipes/stock/cost update.
- PO line unit dropdown only shows the ingredient-family units; no free-text/pack-factor field.
- All backend `400`s are shown as readable messages, not generic errors.
