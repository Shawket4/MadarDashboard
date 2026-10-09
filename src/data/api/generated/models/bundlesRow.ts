/* eslint-disable */
// @ts-nocheck
import type { BundlesRowNameTranslations } from './bundlesRowNameTranslations';

/**
 * One combo or deal over the period.
 */
export interface BundlesRow {
  cost: number;
  /** True when any line's cost was unknown (`cost` then counts the known part). */
  cost_missing: boolean;
  /** The combo's menu item id, or the deal rule's id. */
  id: string;
  /** `combo` | `deal`. */
  kind: string;
  /** The same lines at their normal prices. */
  list_value: number;
  /**
     * `(revenue − cost) / revenue` as a fraction string; `null` when revenue is 0.
     * @nullable
     */
  margin?: string | null;
  name: string;
  name_translations: BundlesRowNameTranslations;
  orders: number;
  /**
     * A combo: Σ its parts' line_total + their add-ons. A deal: Σ the
     * consumed lines' line_total (after the deal).
     */
  revenue: number;
  /** `list_value − revenue`. */
  saving: number;
  /** Combo units (Σ header quantity, refunds netted) or deal applications (Σ times). */
  sold: number;
}
