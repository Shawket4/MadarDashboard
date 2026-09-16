/* eslint-disable */
// @ts-nocheck

export interface CreateCustomerRequest {
  /**
     * The branch where the customer was added (a till sends its own).
     * @nullable
     */
  branch_id?: string | null;
  /**
     * Client-minted id; a repeat with the same id returns the stored customer.
     * @nullable
     */
  id?: string | null;
  /** @nullable */
  loyalty_customer_id?: string | null;
  name: string;
  /** @nullable */
  notes?: string | null;
  /** @nullable */
  phone?: string | null;
}
