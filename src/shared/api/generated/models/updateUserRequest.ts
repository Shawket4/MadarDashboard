/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
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
     * @minLength 4
     * @maxLength 6
     * @nullable
     * @pattern ^[0-9]{4,6}$
     */
  pin?: string | null;
  role?: null | UserRole;
}
