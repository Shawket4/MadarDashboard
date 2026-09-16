/* eslint-disable */
// @ts-nocheck

export interface ProvisionOwner {
  email: string;
  name: string;
  /** At least 8 characters. */
  password: string;
  /**
     * Optional six-digit PIN so the owner can also work a till.
     * @nullable
     */
  pin?: string | null;
}
