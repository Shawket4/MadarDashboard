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
     * Required when `role = teller`. A NEW PIN is exactly 6 ASCII digits
     * (owner decision, 2026-09-16); PINs already in use keep working at their
     * old length. Ask `GET /users/pin-suggestion` for a free one.
     * @minLength 6
     * @maxLength 6
     * @nullable
     * @pattern ^[0-9]{6}$
     */
  pin?: string | null;
  role: UserRole;
}
