/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export type ListUsersParams = {
/**
 * Filter to a specific organization. Optional for super-admins
 * (who see all orgs when omitted); required-by-policy for everyone
 * else (overridden server-side to the caller's own org).
 */
org_id?: string;
};
