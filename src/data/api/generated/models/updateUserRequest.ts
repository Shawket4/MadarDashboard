/* eslint-disable */
// @ts-nocheck
import type { UserRole } from './userRole';

export interface UpdateUserRequest {
  /** @nullable */
  email?: string | null;
  /** @nullable */
  is_active?: boolean | null;
  /** @nullable */
  name?: string | null;
  /**
     * Plain-text new password. Server-side bcrypt-hashed.
     * @nullable
     */
  password?: string | null;
  /** @nullable */
  phone?: string | null;
  /**
     * A NEW PIN is exactly 6 digits; an existing shorter one keeps working
     * until it is changed.
     * @minLength 6
     * @maxLength 6
     * @nullable
     * @pattern ^[0-9]{6}$
     */
  pin?: string | null;
  role?: null | UserRole;
}
