/* eslint-disable */
// @ts-nocheck

export interface CreateCatalogItemRequest {
  category: string;
  /** @nullable */
  cost_per_unit?: number | null;
  /** @nullable */
  density_g_per_ml?: number | null;
  /** @nullable */
  description?: string | null;
  name: string;
  /** @nullable */
  pack_size?: number | null;
  /**
     * Optional named purchase pack and its base-unit size.
     * @nullable
     */
  pack_unit?: string | null;
  /**
     * Optional default supplier for reordering.
     * @nullable
     */
  supplier_id?: string | null;
  unit: string;
  /** @nullable */
  yield_pct?: number | null;
}
