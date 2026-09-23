/* eslint-disable */
// @ts-nocheck
import type { StaffOrgChoice } from './staffOrgChoice';
import type { UserRole } from './userRole';

export interface StaffSession {
  /**
     * Kept in the phone's secure storage and sent as `X-Staff-Device` on
     * every call (RO-3). It is what refreshes the session.
     * @nullable
     */
  device_token?: string | null;
  /**
     * Who signed in: the employee.
     * @nullable
     */
  employee_id?: string | null;
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
     * The staff token: `Authorization: Bearer` on `/staff/*` only. It lives
     * an hour; refresh it with `POST /auth/staff/refresh`.
     * @nullable
     */
  token?: string | null;
  /** @nullable */
  token_expires_at?: string | null;
  /**
     * Their Madar account when they have one (a manager, a cashier). Manager
     * acts in the app go through it.
     * @nullable
     */
  user_id?: string | null;
}
