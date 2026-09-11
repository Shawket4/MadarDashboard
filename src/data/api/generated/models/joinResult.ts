/* eslint-disable */
// @ts-nocheck
import type { CardBrand } from './cardBrand';
import type { PassLinks } from './passLinks';

/**
 * What the customer sees after signing up: their card, and the buttons — or,
 * for a phone that is already a member and has not been proved, an invitation
 * to prove it.
 *
 * The member token is a bearer credential: whoever holds it holds the card,
 * the balance, the purchase history and the wallet passes. So it is handed out
 * on exactly two occasions — to a NEW member, whose token nobody else could
 * want yet, and to an existing member whose device has verified THIS phone by
 * OTP. Typing a phone number is not proof of owning it; anyone who knows a
 * customer's number can type it.
 */
export interface JoinResult {
  /**
     * True when this phone was already a member — the page says "welcome back"
     * rather than pretending to have made a new card.
     */
  already_member: boolean;
  /**
     * The live balance, in `mode`'s currency. Zero for a fresh member, and zero
     * (not the real figure) while `verify_required`.
     */
  balance: number;
  brand: CardBrand;
  /**
     * While `verify_required`: the card link was also sent to the number on
     * file, by WhatsApp — the one channel that proves possession without a
     * code. False when no gateway is configured or there is no public base to
     * build a link on; the page then offers only the OTP.
     */
  card_link_sent: boolean;
  /**
     * Absent when `verify_required`: the page has nothing to show yet.
     * @nullable
     */
  member_token?: string | null;
  mode: string;
  /**
     * The name as the caller typed it. For a returning member the name ON FILE
     * is not echoed until they have verified — it is a fact about the person
     * who owns the phone, not about the person typing it.
     */
  name: string;
  next_reward_cost: number;
  passes?: null | PassLinks;
  /**
     * This phone already has a card and the device has not proved it owns the
     * phone. The page should run the ordinary OTP flow (`/public/otp/request`
     * then `/public/otp/verify`) and POST here again with the `device_token`
     * it is handed; the card comes back on that call.
     */
  verify_required: boolean;
}
