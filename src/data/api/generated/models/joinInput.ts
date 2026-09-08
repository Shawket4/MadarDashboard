/* eslint-disable */
// @ts-nocheck

export interface JoinInput {
  /**
     * Date of birth, `YYYY-MM-DD`. Accepted ONLY where the org asked for one:
     * a field the shop turned off must not be storable by posting past the
     * form, and the year is kept because a date without one is not a date.
     * @nullable
     */
  birthday?: string | null;
  /**
     * The branch whose counter code was scanned, when one was. Absent for an
     * org-wide code — see [`BranchQuery`].
     * @nullable
     */
  branch_id?: string | null;
  /**
     * Device-trust token from `/public/otp/verify`. Required only when the
     * branch's `require_otp` is on.
     * @nullable
     */
  device_token?: string | null;
  /**
     * 'en' or 'ar' — the language the pass is written in.
     * @nullable
     */
  locale?: string | null;
  name: string;
  /** @nullable */
  org_id?: string | null;
  phone: string;
}
