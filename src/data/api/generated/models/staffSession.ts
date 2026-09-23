/* eslint-disable */
// @ts-nocheck
import type { StaffOrgChoice } from './staffOrgChoice';
import type { UserRole } from './userRole';

export interface StaffSession {
  /**
     * Kept in the phone's secure storage and sent as `X-Staff-Device` on every
     * punch and ping (RO-3).
     * @nullable
     */
  device_token?: string | null;
  /** @nullable */
  name?: string | null;
  /**
     * Set when the number works at more than one business and none was
     * picked: ask, then verify again with `org_id`. The code stays valid.
     */
  needs_org: boolean;
  /** True when this sign-in moved the account from another phone. */
  new_phone: boolean;
  /** @nullable */
  org_id?: string | null;
  orgs: StaffOrgChoice[];
  role?: null | UserRole;
  /**
     * `Authorization: Bearer` for every other call.
     * @nullable
     */
  token?: string | null;
  /** @nullable */
  user_id?: string | null;
}
