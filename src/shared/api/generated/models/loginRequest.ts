/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

/**
 * Login is dual-mode:
 *
 * - **Email + password** (admins, managers, super-admins): supply
 *   `email` and `password`. `org_id` is optional — if provided, the
 *   user must belong to that org; if omitted, lookup is by email only.
 * - **PIN + name** (tellers): supply `name` and `pin`. The first
 *   active teller with a matching name and a `pin_hash` that verifies
 *   wins. `branch_id` may be supplied to lock the issued JWT to that
 *   branch; tellers without a branch lock can later be reassigned.
 */
export interface LoginRequest {
  /**
     * Teller-only: locks the issued JWT to a specific branch.
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
