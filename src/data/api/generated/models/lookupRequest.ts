/* eslint-disable */
// @ts-nocheck

export interface LookupRequest {
  branch_id: string;
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
