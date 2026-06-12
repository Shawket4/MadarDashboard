/* eslint-disable */
// @ts-nocheck
import type { InventoryCountRow } from './inventoryCountRow';
import type { Shift } from './shift';

export interface CloseShiftResponse {
  inventory_counts: InventoryCountRow[];
  shift: Shift;
}
