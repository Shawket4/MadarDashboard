/* eslint-disable */
// @ts-nocheck

export interface DecisionRequest {
  /** @nullable */
  note?: string | null;
  /** `approved` | `rejected` | `cancelled`. */
  status: string;
}
