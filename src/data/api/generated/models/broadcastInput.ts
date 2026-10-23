/* eslint-disable */
// @ts-nocheck
import type { Audience } from './audience';
import type { Message } from './message';

export interface BroadcastInput {
  audience?: Audience;
  message: Message;
  /**
     * Absent = now. Otherwise 5 minutes to 30 days ahead.
     * @nullable
     */
  scheduled_for?: string | null;
  /** Also WhatsApp members with no card in a wallet (costs the shop). */
  whatsapp_fallback?: boolean;
}
