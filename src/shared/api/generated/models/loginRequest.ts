/* eslint-disable */
// @ts-nocheck

/**
 * Login is dual-mode:
 *
 * - **Email + password** (admins, managers, super-admins): supply
 *   `email` and `password`. `org_id` is optional — if provided, the
 *   user must belong to that org; if omitted, lookup is by email only.
 * - **PIN + name** (tellers): supply `name`, `pin`, and **`branch_id`**
 *   (required). The teller must be assigned to that branch. `org_id` is
 *   derived server-side from the branch — never trusted from the client.
 */
export interface LoginRequest {
  /**
     * Required for PIN login. The org is derived from this branch server-side.
     * @nullable
     */
  branch_id?: string | null;
  /** @nullable */
  email?: string | null;
  /**
     * Teller's display name (required for PIN login, unused otherwise).
     * @nullable
     */
  name?: string | null;
  /** @nullable */
  org_id?: string | null;
  /** @nullable */
  password?: string | null;
  /**
     * @minLength 4
     * @maxLength 6
     * @nullable
     * @pattern ^[0-9]{4,6}$
     */
  pin?: string | null;
}
