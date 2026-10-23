/* eslint-disable */
// @ts-nocheck

export type ListSessionsParams = {
/**
 * @nullable
 */
org_id?: string | null;
/**
 * @nullable
 */
user_id?: string | null;
/**
 * @nullable
 */
branch_id?: string | null;
/**
 * `password` | `pin` | `device` | `signup` | `demo` | `legacy`.
 * @nullable
 */
kind?: string | null;
/**
 * Matches the person's name or email, the device id or the IP.
 * @nullable
 */
q?: string | null;
/**
 * `active` (default) | `revoked` | `expired` | `all`.
 * @nullable
 */
state?: string | null;
/**
 * @nullable
 */
limit?: number | null;
/**
 * Keyset cursor: the `next` of the previous page.
 * @nullable
 */
before?: string | null;
/**
 * @nullable
 */
before_id?: string | null;
};
