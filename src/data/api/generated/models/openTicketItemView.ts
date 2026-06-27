/* eslint-disable */
// @ts-nocheck

export interface OpenTicketItemView {
  id: string;
  /** The frozen priced SnapshotLine (name, size, addons, totals). */
  line: unknown;
  line_total: number;
  /** @nullable */
  menu_item_id?: string | null;
  round_number: number;
  voided: boolean;
}
