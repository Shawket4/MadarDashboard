/* eslint-disable */
// @ts-nocheck

export interface UpdateTillRequest {
  /** @nullable */
  is_active?: boolean | null;
  /** @nullable */
  is_default?: boolean | null;
  /** @nullable */
  name?: string | null;
  /**
     * Standard float in minor units. Absent → unchanged; `null` → cleared
     * (the shop no longer proposes a closing figure); a value → set. Same
     * `Option<Option<T>>` shape as the branch printer fields.
     * @nullable
     */
  standard_float?: number | null;
}
