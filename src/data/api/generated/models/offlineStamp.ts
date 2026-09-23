/* eslint-disable */
// @ts-nocheck

export interface OfflineStamp {
  /**
     * The `X-Dawam-Time` value of the last response the phone saw (signed).
     * @nullable
     */
  anchor?: string | null;
  /** Time-since-boot elapsed from `server_time` to the event, in ms. */
  elapsed_ms: number;
  /**
     * The GPS fix's own satellite time, when the platform gives one (Android's
     * GNSS provider; iOS gives none).
     * @nullable
     */
  gps_time?: string | null;
  /** The phone restarted after `server_time`, so `elapsed_ms` means nothing. */
  rebooted?: boolean;
  /**
     * The last server time the phone saw. Only a guide: a valid `anchor`
     * replaces it, and without one the punch is marked unverified.
     */
  server_time: string;
}
