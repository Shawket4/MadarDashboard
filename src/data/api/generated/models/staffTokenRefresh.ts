/* eslint-disable */
// @ts-nocheck

export interface StaffTokenRefresh {
  employee_id: string;
  expires_at: string;
  org_id: string;
  /** A fresh staff token for `/staff/*`. */
  token: string;
}
