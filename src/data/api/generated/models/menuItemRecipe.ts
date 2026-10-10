/* eslint-disable */
// @ts-nocheck

export interface MenuItemRecipe {
  category: string;
  ingredient_name: string;
  ingredient_unit: string;
  /** @nullable */
  org_ingredient_id?: string | null;
  quantity_used: number;
  size_label: string;
  /**
     * The usable amount before yield loss: `quantity_used` × the linked
     * ingredient's yield, 3 dp (madar-units `usable_qty`). What the catalog
     * item dialog shows.
     */
  usable_quantity: number;
}
