/* eslint-disable */
// @ts-nocheck

export interface SetTicketCustomerResponse {
  /** False when nothing was written: unknown customer, unknown or voided bill. */
  applied: boolean;
  /**
     * What the bill now says, after the merge chain: the survivor of a merged
     * id, `null` when the customer was taken off, and the PREVIOUS value when
     * the id was unknown (the pick is dropped, the bill is untouched).
     * @nullable
     */
  customer_id?: string | null;
  /**
     * The sale the change landed on instead, when the bill was already
     * settled by the time this arrived.
     * @nullable
     */
  order_id?: string | null;
  ticket_id: string;
}
