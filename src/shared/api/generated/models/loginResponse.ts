/* eslint-disable */
// @ts-nocheck
import type { UserPublic } from './userPublic';

export interface LoginResponse {
  /** JWT to send as `Authorization: Bearer <token>` on subsequent requests. */
  token: string;
  user: UserPublic;
}
