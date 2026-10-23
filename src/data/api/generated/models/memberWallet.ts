/* eslint-disable */
// @ts-nocheck

/**
 * How the member's card is held, and the last message it carried.
 */
export interface MemberWallet {
  apple_devices: number;
  /** @nullable */
  apple_registered_at?: string | null;
  google_card: boolean;
  marketing_opt_out: boolean;
  /** Dashboard messages this member was sent. */
  messages_received: number;
  /** @nullable */
  notice?: string | null;
  /** @nullable */
  notice_at?: string | null;
  /**
     * Apple's device fetched the pass after the push.
     * @nullable
     */
  notice_seen_at?: string | null;
  /** @nullable */
  notice_wallets?: string | null;
  /**
     * When the pass was last rebuilt for them.
     * @nullable
     */
  pass_updated_at?: string | null;
}
