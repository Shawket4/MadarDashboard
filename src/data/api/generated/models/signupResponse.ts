/* eslint-disable */
// @ts-nocheck
import type { LoginResponse } from './loginResponse';

/**
 * A session like `POST /auth/login`'s, for the owner just made, plus the
 * ids the dashboard lands on.
 */
export type SignupResponse = LoginResponse & {
  /** The first (and, on Free, only) branch. */
  branch_id: string;
  org_id: string;
};
