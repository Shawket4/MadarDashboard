/* eslint-disable */
// @ts-nocheck

export interface PackagingRuleLineOut {
  ingredient_id: string;
  ingredient_name: string;
  /** Base-unit quantity as a string. */
  quantity: string;
  sort: number;
  unit: string;
  /**
     * The usable amount before yield loss, like `RecipeLineOut::usable_quantity`:
     * what an editor shows and sends back (a line sent back unchanged keeps
     * its stored `quantity`).
     */
  usable_quantity: string;
}
