/* eslint-disable */
// @ts-nocheck

/**
 * Snapshot returned to the dashboard. Combines the gateway's live link state
 * with the backend's persisted pause switch.
 */
export interface WhatsappStatus {
  /** `WHATSAPP_SERVICE_URL` is set on the backend. */
  configured: boolean;
  /** Underlying socket is connected to WhatsApp. */
  connected: boolean;
  /** A pairing QR is currently available to scan. */
  has_qr: boolean;
  /** A number is linked and ready to send. */
  logged_in: boolean;
  /**
     * Sending is paused by an admin — the number stays linked but every
     * outbound message (OTP + status) is suppressed until resumed.
     */
  paused: boolean;
  /**
     * When sending was last paused (audit).
     * @nullable
     */
  paused_at?: string | null;
  /**
     * Current pairing QR as a `data:image/png;base64,…` URL (only when `has_qr`).
     * @nullable
     */
  qr_image?: string | null;
  /** The gateway answered over HTTP (false = not configured or unreachable). */
  reachable: boolean;
  /** Session name the relay pairs/sends under. */
  session: string;
}
