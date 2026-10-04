/* eslint-disable */
// @ts-nocheck

/**
 * `GET /inventory/warehouses/{id}/replenishment?branch_id=`: one row per
 * ingredient the branch is at or under its low-stock level on.
 */
export interface ReplenishmentRow {
  available: number;
  category_name: string;
  in_transit: number;
  ingredient_name: string;
  /** See [`crate::replenish::Suggestion`]. */
  need: number;
  on_hand: number;
  open_inbound: number;
  org_ingredient_id: string;
  /** @nullable */
  par_max?: number | null;
  par_min: number;
  suggested: number;
  unit: string;
  warehouse_on_hand: number;
}
