/* eslint-disable */
// @ts-nocheck

/**
 * One live thing that uses an ingredient.
 */
export interface IngredientUsageRef {
  /**
     * Extra context: the size label, the option's group, the PO's branch, the
     * transfer's route.
     * @nullable
     */
  detail?: string | null;
  /** The using entity's id (menu item, option, base, rule, PO, count, transfer). */
  id: string;
  /**
     * `recipe` (a menu item size's recipe) | `modifier_option` (an add-on's
     * or option's recipe line) | `swap` (an option that replaces it, e.g. a
     * milk swap) | `recipe_base` | `packaging_rule` | `purchase_order` (open:
     * draft, ordered, partially received) | `stocktake` (open count) |
     * `transfer` (requested, draft or dispatched).
     */
  kind: string;
  /**
     * Its display name (menu item / option / base / rule name, PO reference
     * or supplier, the count's branch, `#<number>` for a transfer).
     */
  name: string;
}
