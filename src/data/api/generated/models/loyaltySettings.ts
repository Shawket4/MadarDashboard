/* eslint-disable */
// @ts-nocheck

export interface LoyaltySettings {
  /**
     * Ask for a birthday at signup, and greet them on the day.
     *
     * Off means the form does not ASK — not that it asks and ignores. A date of
     * birth is the most sensitive thing this feature collects, and a shop that
     * does not run birthday rewards has no business holding one.
     */
  birthday_enabled?: boolean;
  /**
     * Overrides the built-in greeting. `{name}` is substituted; nothing else is.
     * @nullable
     */
  birthday_message?: string | null;
  /** @nullable */
  birthday_message_ar?: string | null;
  /**
     * Points or stamps given on the day. `None` is a greeting and nothing else,
     * which is deliberately the default: plenty of shops want to say happy
     * birthday without giving away a drink.
     * @nullable
     */
  birthday_reward_amount?: number | null;
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
  /**
     * Any menu item may be taken as a reward, at `default_reward_cost`.
     *
     * Off by default. A curated catalogue is the safer shape — it offers an
     * espresso for five stamps without also offering the steak — and this is
     * for the shops whose programme genuinely is "collect five, get anything",
     * which a catalogue can only express by listing the entire menu and
     * keeping that list in step with it forever.
     *
     * The two are alternatives, not layers: with this on, the catalogue's
     * per-item prices no longer apply, because an item's cost can no longer
     * depend on which item it is.
     *
     * Defaulted on the way in, because this type is the REQUEST body as well
     * as the response: every till and dashboard already in the field sends a
     * settings object without this key, and rejecting those would switch the
     * programme off for everyone who had not updated yet.
     */
  reward_any_item?: boolean;
  /** @nullable */
  terms?: string | null;
  /** @nullable */
  terms_ar?: string | null;
  /**
     * Nudge a member who has not been in for a while. Off by default, like
     * everything here that speaks to a customer unprompted.
     *
     * The timing is not a per-shop setting: how long "a while" is, whether it
     * repeats, and how stale is too stale are one operational judgement across
     * the estate, and they live in the environment
     * (`LOYALTY_WINBACK_*`) rather than in a form where a shop could set it to
     * a day and burn its own list down.
     */
  winback_enabled?: boolean;
  /**
     * ONE override, in whichever language the shop writes it, replacing the
     * built-in English and Arabic both. `{name}` is substituted; nothing else.
     *
     * Unset is the better default: the built-ins are written in each language
     * rather than translated into one, so a customer reads a sentence that was
     * composed for them.
     * @nullable
     */
  winback_message?: string | null;
  /**
     * Points or stamps to arrive with the nudge. `None` is words only.
     * @nullable
     */
  winback_reward_amount?: number | null;
}
