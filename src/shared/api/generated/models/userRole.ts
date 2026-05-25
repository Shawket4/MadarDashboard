/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export type UserRole = typeof UserRole[keyof typeof UserRole];


export const UserRole = {
  super_admin: 'super_admin',
  org_admin: 'org_admin',
  branch_manager: 'branch_manager',
  teller: 'teller',
} as const;
