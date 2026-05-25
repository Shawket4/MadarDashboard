/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface CreateDiscountRequest {
  dtype: string;
  /** @nullable */
  is_active?: boolean | null;
  name: string;
  org_id: string;
  value: number;
}
