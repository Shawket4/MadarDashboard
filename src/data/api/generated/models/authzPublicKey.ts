/* eslint-disable */
// @ts-nocheck

/**
 * A public key a device verifies snapshots with.
 */
export interface AuthzPublicKey {
  kid: string;
  /** Hex-encoded 32-byte Ed25519 public key. */
  public_key: string;
}
