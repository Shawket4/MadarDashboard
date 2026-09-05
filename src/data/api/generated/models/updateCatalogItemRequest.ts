/* eslint-disable */
// @ts-nocheck

export interface UpdateCatalogItemRequest {
  /** @nullable */
  category_id?: string | null;
  /** @nullable */
  cost_per_unit?: number | null;
  /** @nullable */
  density_g_per_ml?: number | null;
  /** @nullable */
  description?: string | null;
  /** @nullable */
  is_active?: boolean | null;
  /** @nullable */
  name?: string | null;
  /** @nullable */
  pack_size?: number | null;
  /** @nullable */
  pack_unit?: string | null;
  /**
     * Set/replace the default supplier (omitted = unchanged).
     * @nullable
     */
  supplier_id?: string | null;
  /** @nullable */
  unit?: string | null;
  /** @nullable */
  yield_pct?: number | null;
}
