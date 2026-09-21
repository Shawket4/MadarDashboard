/* eslint-disable */
// @ts-nocheck

export interface OrgTemplate {
  key: string;
  name_ar: string;
  name_en: string;
  /** Role kinds the template is meant to use. */
  roles: string[];
  /** @minimum 0 */
  version: number;
}
