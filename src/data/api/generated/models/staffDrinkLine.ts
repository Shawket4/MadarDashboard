/* eslint-disable */
// @ts-nocheck

/**
 * `staff_drink` on an order line. Additive: a client that never heard of it
 * omits it and the line is an ordinary paid line.
 */
export interface StaffDrinkLine {
  /**
     * What the TILL comped on this line (whole line, minor units). Read ONLY
     * when a queued offline sale is replayed; live, the server prices the comp
     * and this is ignored.
     * @nullable
     */
  comp_minor?: number | null;
  /**
     * Client-minted; the idempotency key AND the `staff_drinks` row's id. A
     * row an older flow already recorded under this id is reused and the
     * order attached to it — never a second drink off the allowance.
     */
  id: string;
  /** REQUIRED. Who the drink is for and why, in the teller's own words. */
  note: string;
  /**
     * Whether the till believed this drink went past the allowance. Replay
     * only, and only to tell a convergence from a surprise.
     * @nullable
     */
  overspent?: boolean | null;
}
