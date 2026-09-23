/* eslint-disable */
// @ts-nocheck

export interface OfflineStamp {
  /** Time-since-boot elapsed from `server_time` to the event, in ms. */
  elapsed_ms: number;
  /**
     * The GPS fix's own satellite time, when it had one.
     * @nullable
     */
  gps_time?: string | null;
  /** The phone restarted after `server_time`, so `elapsed_ms` means nothing. */
  rebooted?: boolean;
  /** The last server time the phone saw (a response's `Date`). */
  server_time: string;
}
