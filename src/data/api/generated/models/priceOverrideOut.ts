/* eslint-disable */
// @ts-nocheck

/**
 * The persisted override row (returned by the upsert).
 */
export interface PriceOverrideOut {
  /** @nullable */
  branch_id?: string | null;
  /** @nullable */
  channel?: string | null;
  id: string;
  /** @nullable */
  is_available?: boolean | null;
  /** @nullable */
  price?: number | null;
  scope: string;
  target_id: string;
  target_type: string;
}
