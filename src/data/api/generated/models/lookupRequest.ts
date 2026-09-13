/* eslint-disable */
// @ts-nocheck

export interface LookupRequest {
  branch_id: string;
  /**
     * A member the till already identified, re-read before a charge so the
     * balance and catalogue it prices against are the server's current ones.
     * @nullable
     */
  customer_id?: string | null;
  /**
     * Manual fallback for a customer whose phone is dead.
     * @nullable
     */
  phone?: string | null;
  /**
     * The token from the scanned pass barcode. Preferred.
     * @nullable
     */
  token?: string | null;
}
