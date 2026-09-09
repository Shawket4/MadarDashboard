/* eslint-disable */
// @ts-nocheck

/**
 * One past visit, as the customer's own page shows it.
 */
export interface PastOrder {
  branch_name: string;
  id: string;
  /**
     * What they had. The customer asked for this to be here; see the note on
     * the handler about who else can see it.
     */
  items: string[];
  placed_at: string;
  /** In piastres, like every other figure on the wire. */
  total: number;
}
