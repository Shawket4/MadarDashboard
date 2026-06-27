/* eslint-disable */
// @ts-nocheck
import type { OfflineTellerCredential } from './offlineTellerCredential';

export interface OfflineAuthBundle {
  generated_at: string;
  /** The org's stable LAN-relay secret, hex-encoded. Devices derive a per-branch
   * HMAC-SHA256 subkey from it to sign every LAN message (Phase E), so only
   * branch-provisioned devices are trusted on the shared Wi-Fi. */
  lan_secret: string;
  org_id: string;
  /** All PIN-login credentials for the org (tellers, waiters, and kitchen
   * devices). Field name kept as `tellers` for wire compatibility; it carries
   * every offline-capable role, distinguished by `role`. */
  tellers: OfflineTellerCredential[];
}
