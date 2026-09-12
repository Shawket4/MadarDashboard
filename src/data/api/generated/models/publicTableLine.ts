/* eslint-disable */
// @ts-nocheck

export interface PublicTableLine {
  line_total: number;
  name: string;
  quantity: number;
  /**
     * Taken off the bill after it was ordered — struck through rather than
     * hidden, so a customer who watches a plate go back sees it go.
     */
  voided: boolean;
}
