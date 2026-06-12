/* eslint-disable */
// @ts-nocheck
import type { InventoryCountInput } from './inventoryCountInput';

export interface CloseShiftRequest {
  /** @nullable */
  cash_note?: string | null;
  /** @nullable */
  closed_at?: string | null;
  closing_cash_declared: number;
  inventory_counts: InventoryCountInput[];
}
