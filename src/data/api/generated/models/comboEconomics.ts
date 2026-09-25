/* eslint-disable */
// @ts-nocheck
import type { ComboWarning } from './comboWarning';

/**
 * The editor's live panel: list value, cost, margin and saving of a combo at
 * a branch (or the org's catalogue prices when `branch_id` is null).
 */
export interface ComboEconomics {
  /** @nullable */
  branch_id?: string | null;
  /**
     * `null` when any cost involved is unknown.
     * @nullable
     */
  cost_default?: number | null;
  /** @nullable */
  cost_max?: number | null;
  /** À la carte value of the default picks at their included sizes. */
  list_default: number;
  list_max: number;
  /** The cheapest and dearest valid pick sets, at their included sizes. */
  list_min: number;
  /**
     * Fractions as strings ("0.5933"); `null` when the cost is unknown or P is 0.
     * @nullable
     */
  margin_default?: string | null;
  /** @nullable */
  margin_worst?: string | null;
  /** @nullable */
  min_margin?: string | null;
  /** P at this branch. */
  price: number;
  /** `list_default − price`. */
  saving_default: number;
  warnings: ComboWarning[];
}
