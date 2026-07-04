/* eslint-disable */
// @ts-nocheck
import type { UserRole } from './userRole';

export interface CreateUserRequest {
  /**
     * Branches to assign the new user to immediately. Branch managers
     * can only assign to branches they themselves are assigned to.
     * @nullable
     */
  branch_ids?: string[] | null;
  /**
     * Required for admins and managers; ignored for tellers.
     * @nullable
     */
  email?: string | null;
  name: string;
  org_id: string;
  /**
     * Required when `role` is anything other than `teller`. Plain text;
     * hashed server-side with bcrypt before storage.
     * @nullable
     */
  password?: string | null;
  /** @nullable */
  phone?: string | null;
  /**
     * Required when `role = teller`. 4–6 ASCII digits.
     * @minLength 4
     * @maxLength 6
     * @nullable
     * @pattern ^[0-9]{4,6}$
     */
  pin?: string | null;
  role: UserRole;
}
