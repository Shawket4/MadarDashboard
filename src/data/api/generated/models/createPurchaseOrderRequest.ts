/* eslint-disable */
// @ts-nocheck
import type { POLineInput } from './pOLineInput';

export interface CreatePurchaseOrderRequest {
  /** @nullable */
  expected_at?: string | null;
  lines: POLineInput[];
  /** @nullable */
  note?: string | null;
  /** @nullable */
  reference?: string | null;
  /** @nullable */
  supplier_id?: string | null;
}
