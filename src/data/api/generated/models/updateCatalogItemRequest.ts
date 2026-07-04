/* eslint-disable */
// @ts-nocheck

export interface UpdateCatalogItemRequest {
  /** @nullable */
  category?: string | null;
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
     * Set/replace the default supplier. (Omitted = unchanged; clearing to
     * none is not supported via this field.)
     * @nullable
     */
  supplier_id?: string | null;
  /** @nullable */
  unit?: string | null;
  /** @nullable */
  yield_pct?: number | null;
}
