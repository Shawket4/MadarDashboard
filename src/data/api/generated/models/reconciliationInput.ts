/* eslint-disable */
// @ts-nocheck

/**
 * What the teller said about one method at close.
 */
export interface ReconciliationInput {
  /** @nullable */
  declared_amount?: number | null;
  method: string;
  /** @nullable */
  note?: string | null;
  /** `checked` | `disagreed` */
  status: string;
}
