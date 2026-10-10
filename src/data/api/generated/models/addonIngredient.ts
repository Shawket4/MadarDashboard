/* eslint-disable */
// @ts-nocheck

export interface AddonIngredient {
  addon_item_id: string;
  id: string;
  ingredient_name: string;
  /** @nullable */
  org_ingredient_id?: string | null;
  quantity_used: number;
  unit: string;
  /**
     * The usable amount before yield loss: `quantity_used` × the linked
     * ingredient's yield, 3 dp (madar-units `usable_qty`). What an editor shows
     * and sends back; a line sent back unchanged keeps its stored quantity.
     */
  usable_quantity: number;
}
