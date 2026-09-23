/* eslint-disable */
// @ts-nocheck

/**
 * A Madar user who can be made an employee.
 */
export interface LinkableUser {
  /** @nullable */
  email?: string | null;
  name: string;
  /** @nullable */
  phone?: string | null;
  /** Their POS role (`org_admin`, `branch_manager`, `teller`, …). */
  role: string;
  user_id: string;
}
