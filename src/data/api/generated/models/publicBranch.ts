/* eslint-disable */
// @ts-nocheck

export interface PublicBranch {
  code: string;
  id: string;
  in_mall_enabled: boolean;
  /** Effective-open right now (enabled + open shift + override + window). */
  in_mall_open_now: boolean;
  name: string;
  outside_enabled: boolean;
  outside_open_now: boolean;
}
