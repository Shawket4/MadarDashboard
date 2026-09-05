/* eslint-disable */
// @ts-nocheck

export interface CreateCatalogItemRequest {
  /**
     * Omitted ⟹ the org's `general` category.
     * @nullable
     */
  category_id?: string | null;
  /** @nullable */
  cost_per_unit?: number | null;
  /** @nullable */
  density_g_per_ml?: number | null;
  /** @nullable */
  description?: string | null;
  name: string;
  /** @nullable */
  pack_size?: number | null;
  /** @nullable */
  pack_unit?: string | null;
  /** @nullable */
  supplier_id?: string | null;
  unit: string;
  /** @nullable */
  yield_pct?: number | null;
}
