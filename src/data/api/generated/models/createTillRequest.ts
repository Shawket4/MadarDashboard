/* eslint-disable */
// @ts-nocheck

export interface CreateTillRequest {
  branch_id: string;
  /** @nullable */
  is_active?: boolean | null;
  /** @nullable */
  is_default?: boolean | null;
  name: string;
  /**
     * Standard float in minor units; must not be negative. Omit or `null`
     * for "not decided".
     * @nullable
     */
  standard_float?: number | null;
}
