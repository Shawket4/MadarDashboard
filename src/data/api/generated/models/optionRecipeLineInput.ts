/* eslint-disable */
// @ts-nocheck

/**
 * One recipe line as submitted to the option-recipe replace endpoint. `quantity`
 * may be 0 (a swap marker). Server normalizes to the ingredient base unit.
 */
export interface OptionRecipeLineInput {
  ingredient_id: string;
  quantity: number;
  /**
     * Size this amount is for (`Cup`, `Can`); `null`/absent = every size. At order
     * time a line for the ordered size's exact label replaces the `null` line for the
     * same ingredient. Legacy tills only ever see the `null` lines.
     * @nullable
     */
  size_label?: string | null;
  unit: string;
}
