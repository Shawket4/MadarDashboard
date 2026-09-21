/* eslint-disable */
// @ts-nocheck

export interface PreviewDeduction {
  category_slug: string;
  /** @nullable */
  ingredient_id?: string | null;
  name: string;
  /**
     * `swapped from X` | `follows the chosen X` | `skipped on dine-in`.
     * @nullable
     */
  note?: string | null;
  quantity: number;
  /** Shown but not deducted (dine-in packaging). */
  skipped: boolean;
  /** `recipe` | `swap` | `option` | `packaging`. */
  source: string;
  unit: string;
}
