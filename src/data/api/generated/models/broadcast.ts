/* eslint-disable */
// @ts-nocheck
import type { Audience } from './audience';

/**
 * What the log can honestly say about a broadcast.
 */
export interface Broadcast {
  /** Reached an Apple card (pushed). */
  apple: number;
  audience: Audience;
  created_at: string;
  /** @nullable */
  created_by_name?: string | null;
  failed: number;
  /** @nullable */
  finished_at?: string | null;
  /** Accepted by Google (Google gives no delivery signal). */
  google: number;
  id: string;
  line_ar: string;
  line_en: string;
  pending: number;
  recipients: number;
  scheduled_for: string;
  /** Apple devices that fetched the card after the push: delivered. */
  seen: number;
  sent: number;
  skipped_opted_out: number;
  skipped_recent: number;
  /** @nullable */
  started_at?: string | null;
  /** `scheduled`, `sending`, `sent` or `cancelled`. */
  status: string;
  /** No card and no WhatsApp asked for. */
  unreachable: number;
  whatsapp: number;
  whatsapp_fallback: boolean;
}
