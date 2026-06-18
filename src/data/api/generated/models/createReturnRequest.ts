/* eslint-disable */
// @ts-nocheck
import type { ReturnLineInput } from './returnLineInput';

export interface CreateReturnRequest {
  lines: ReturnLineInput[];
  /** @nullable */
  note?: string | null;
  /** @nullable */
  purchase_order_id?: string | null;
  /** @nullable */
  reference?: string | null;
  /** @nullable */
  supplier_id?: string | null;
}
