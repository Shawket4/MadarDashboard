/* eslint-disable */
// @ts-nocheck

export interface CorrectRecordRequest {
  /** @nullable */
  check_in_at?: string | null;
  /** @nullable */
  check_out_at?: string | null;
  /** @nullable */
  notes?: string | null;
  /** Required — corrections are audited. */
  reason: string;
  /** @nullable */
  status?: string | null;
}
