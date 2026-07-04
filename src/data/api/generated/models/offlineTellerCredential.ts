/* eslint-disable */
// @ts-nocheck

export interface OfflineTellerCredential {
  is_active: boolean;
  name: string;
  /**
     * argon2id verifier of the user's PIN (derived at online login). `null`
     * until the user has logged in online at least once.
     * @nullable
     */
  offline_pin_hash?: string | null;
  /**
     * PIN-login role: `teller`, `waiter`, or `kitchen`. The device uses this to
     * route the offline session (a waiter lands on tickets, a kitchen device on
     * the KDS) without re-querying the backend.
     */
  role: string;
  user_id: string;
}
