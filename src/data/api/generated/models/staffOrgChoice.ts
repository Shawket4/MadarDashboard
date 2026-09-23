/* eslint-disable */
// @ts-nocheck

/**
 * A business the number works at.
 */
export interface StaffOrgChoice {
  /** False when the business is suspended: sign-in is stopped (SA-3). */
  active: boolean;
  org_id: string;
  org_name: string;
}
