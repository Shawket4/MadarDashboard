/* eslint-disable */
// @ts-nocheck

export interface OpenTicketItemView {
  id: string;
  /**
     * The line's name and quantity from its relational columns (DB Phase
     * 5.1). Additive: older tills keep reading them out of `line`.
     * @nullable
     */
  item_name?: string | null;
  /** The frozen priced SnapshotLine (name, size, addons, totals). */
  line: unknown;
  line_total: number;
  /** @nullable */
  menu_item_id?: string | null;
  /** @nullable */
  quantity?: number | null;
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
