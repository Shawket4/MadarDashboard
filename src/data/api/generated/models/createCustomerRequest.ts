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
  /**
     * DEPRECATED and ignored: a membership shares the customer's id, so there
     * is nothing to link. Accepted so deployed tills keep working.
     * @nullable
     */
  loyalty_customer_id?: string | null;
  name: string;
  /** @nullable */
  notes?: string | null;
  /** @nullable */
  phone?: string | null;
  /**
     * Where the customer came from. Defaults to `pos` when a branch is named
     * (a till) and `dashboard` otherwise.
     * @nullable
     */
  source?: string | null;
}
