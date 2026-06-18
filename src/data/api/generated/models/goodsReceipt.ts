/* eslint-disable */
// @ts-nocheck
import type { GoodsReceiptLine } from './goodsReceiptLine';

export interface GoodsReceipt {
  branch_id: string;
  id: string;
  /** true ⟹ a return to supplier (negative stock effect). */
  is_return: boolean;
  lines: GoodsReceiptLine[];
  /** @nullable */
  note?: string | null;
  /** @nullable */
  purchase_order_id?: string | null;
  received_at: string;
  received_by: string;
  /** @nullable */
  received_by_name?: string | null;
  /** @nullable */
  reference?: string | null;
  /** @nullable */
  supplier_id?: string | null;
  /** @nullable */
  supplier_name?: string | null;
}
