/* eslint-disable */
// @ts-nocheck

export interface CreateCatalogItemRequest {
  category: string;
  /** @nullable */
  cost_per_unit?: number | null;
  /** @nullable */
  description?: string | null;
  name: string;
  /**
     * Optional default supplier for reordering.
     * @nullable
     */
  supplier_id?: string | null;
  unit: string;
}
