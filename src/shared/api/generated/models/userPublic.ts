/* eslint-disable */
// @ts-nocheck
import type { UserRole } from './userRole';

export interface UserPublic {
  /** @nullable */
  branch_id?: string | null;
  /** @nullable */
  email?: string | null;
  id: string;
  is_active: boolean;
  name: string;
  /** @nullable */
  org_id?: string | null;
  /** @nullable */
  phone?: string | null;
  role: UserRole;
}
