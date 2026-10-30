/* eslint-disable */
// @ts-nocheck

/**
 * One person's share of a till's sold sales (`madar_till::report::PersonLine`),
 * named.
 */
export interface TillPersonLine {
  /**
     * Their name (`users.name`); `null` when there is no such person.
     * @nullable
     */
  name?: string | null;
  order_count: number;
  /**
     * The person picked at checkout, else whoever was signed in; `null` for
     * sales with nobody on them.
     * @nullable
     */
  person_id?: string | null;
  tips: number;
  /** The sales' tenders (the payment summary's figure), minor units. */
  total: number;
}
