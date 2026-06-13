/* eslint-disable */
// @ts-nocheck

/**
 * One cell of the resolved permission matrix for a user.
 * `effective` = `user_override` if present, else `role_default`, else false.
 */
export interface PermissionMatrix {
  action: string;
  effective: boolean;
  resource: string;
  /** @nullable */
  role_default?: boolean | null;
  /** @nullable */
  user_override?: boolean | null;
}
