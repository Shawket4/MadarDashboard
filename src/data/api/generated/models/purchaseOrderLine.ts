/* eslint-disable */
// @ts-nocheck

export interface PurchaseOrderLine {
  id: string;
  ingredient_name: string;
  org_ingredient_id: string;
  purchase_order_id: string;
  purchase_unit: string;
  quantity_ordered: number;
  quantity_received: number;
  /** Ingredient's base stock unit. */
  unit: string;
  /** Piastres per PURCHASE unit. */
  unit_cost: number;
  units_per_purchase_unit: number;
}
