/* eslint-disable */
// @ts-nocheck
import type { IngredientBranchStock } from './ingredientBranchStock';
import type { IngredientUsageRef } from './ingredientUsageRef';

/**
 * Where an ingredient is still used, for the archive confirmation.
 */
export interface IngredientUsage {
  /** @nullable */
  archived_at?: string | null;
  ingredient_id: string;
  name: string;
  /** `usages` or `stock` is non-empty: an archive must send `confirm: true`. */
  needs_confirmation: boolean;
  /**
     * Nothing references it at all, history included (no movement, recipe,
     * PO, count, transfer or waste row), so a delete loses nothing.
     */
  never_used: boolean;
  /**
     * Branches holding non-zero stock of it. Archiving leaves the balances
     * alone; such a branch keeps seeing it in counts until it reaches zero.
     */
  stock: IngredientBranchStock[];
  unit: string;
  /**
     * Active recipes, add-on/option lines, swaps, bases, packaging rules and
     * open documents that reference it. Archiving does NOT change them:
     * those recipes keep deducting and costing the ingredient.
     */
  usages: IngredientUsageRef[];
}
