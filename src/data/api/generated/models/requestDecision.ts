/* eslint-disable */
// @ts-nocheck

export interface RequestDecision {
  /**
     * Whether the excused time is paid. Applies to `excuse` and
     * `early_departure`; omitted falls back to the org's
     * `excused_time_paid_default`.
     * @nullable
     */
  is_paid?: boolean | null;
  /** @nullable */
  note?: string | null;
  /** `approved` | `rejected` | `cancelled`. */
  status: string;
}
