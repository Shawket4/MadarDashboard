/* eslint-disable */
// @ts-nocheck
import type { PublicTableBill } from './publicTableBill';

/**
 * A table, as the page that opened from its code needs to know it.
 */
export interface PublicTable {
  /**
     * The branch is not serving right now — no till is open. The page says so
     * instead of letting someone build a basket the kitchen will refuse.
     */
  accepting: boolean;
  bill?: null | PublicTableBill;
  branch_id: string;
  branch_name: string;
  /** What the table is called in the room — "7", "T7", "Terrace 2". */
  label: string;
  org_id: string;
  table_id: string;
}
