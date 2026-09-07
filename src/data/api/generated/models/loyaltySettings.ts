/* eslint-disable */
// @ts-nocheck

export interface LoyaltySettings {
  /**
     * `null` = the org-wide default. A branch id = that branch's override.
     * @nullable
     */
  branch_id?: string | null;
  /**
     * The cost offered by default when an admin adds a reward, in whatever this
     * scope collects. Each reward may override it, so one catalogue holds
     * "espresso, 5 visits" beside "cake, 10 visits". Also the pass's fallback
     * target when no rewards have been curated yet.
     */
  default_reward_cost: number;
  /** Add tax to the basis. Tips never earn and have no toggle. */
  earn_include_tax: boolean;
  /** Earn on what was actually paid rather than the pre-discount subtotal. */
  earn_on_discounted: boolean;
  /**
     * One point per this many piastres. 1000 = a point per 10 EGP. The
     * dashboard shows and accepts EGP; the wire is always piastres.
     */
  earn_piastres_per_point: number;
  /** The program switch for this scope. */
  enabled: boolean;
  /**
     * What this scope collects: `"points"` (from money spent) or `"visits"`
     * (one stamp per sale). One or the other — never both.
     */
  mode: string;
  org_id: string;
  program_name: string;
  /** @nullable */
  program_name_ar?: string | null;
  /** Verify the signup phone by WhatsApp code, like bookings and ordering. */
  require_otp: boolean;
  /** @nullable */
  terms?: string | null;
  /** @nullable */
  terms_ar?: string | null;
}
