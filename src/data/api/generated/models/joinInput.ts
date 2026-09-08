/* eslint-disable */
// @ts-nocheck

export interface JoinInput {
  /** @nullable */
  birth_day?: number | null;
  /**
     * The day of their birthday, 1–12 and 1–31. Accepted ONLY where the org
     * asked for one: a field the shop turned off must not be storable by
     * posting past the form.
     *
     * No year, deliberately. A greeting needs to know WHEN, not how old — and
     * a full date of birth is an identity credential, which is a great deal
     * more than an annual message needs.
     * @nullable
     */
  birth_month?: number | null;
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
