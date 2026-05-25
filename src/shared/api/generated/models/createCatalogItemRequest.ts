/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface CreateCatalogItemRequest {
  category: string;
  /** @nullable */
  cost_per_unit?: number | null;
  /** @nullable */
  description?: string | null;
  name: string;
  unit: string;
}
