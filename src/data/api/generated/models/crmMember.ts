/* eslint-disable */
// @ts-nocheck
import type { MemberTrack } from './memberTrack';

/**
 * One row of the CRM table.
 */
export interface CrmMember {
  /** Apple devices holding the card. */
  apple_devices: number;
  /** Track 1's balance in the programme's currency. */
  balance: number;
  /** @nullable */
  birth_month?: number | null;
  enrolled_at: string;
  /** A Google Wallet object was created for them. */
  google_card: boolean;
  id: string;
  /** Their latest stamp, point or reward (or when they joined). */
  last_visit_at: string;
  lifetime: number;
  locale: string;
  marketing_opt_out: boolean;
  name: string;
  phone: string;
  /** Rewards earned on track 1, not yet taken. */
  rewards_ready: number;
  /**
     * Every track, when the card has more than one.
     * @nullable
     */
  tracks?: MemberTrack[] | null;
}
