/* eslint-disable */
// @ts-nocheck

export interface OpenTicketItemView {
  id: string;
  /** The frozen priced SnapshotLine (name, size, addons, totals). */
  line: unknown;
  line_total: number;
  /** @nullable */
  menu_item_id?: string | null;
  /**
     * When the round this line came in on was fired. A bill is read as a
     * sequence of visits to the table — "the drinks at seven, the food at
     * half past" — and without the clock a till can only show a flat list
     * that says nothing about how the evening went.
     */
  round_fired_at: string;
  round_number: number;
  voided: boolean;
}
