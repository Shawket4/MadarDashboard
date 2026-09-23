/* eslint-disable */
// @ts-nocheck

export interface PeriodStatusRequest {
  /**
     * Why (AD-9). Required to reopen.
     * @nullable
     */
  reason?: string | null;
  /**
     * `draft` (reopen an approved month, before anyone is paid) or `closed`
     * (archive a paid month). Approving is `POST …/generate`; Paid is
     * reached by marking everyone paid (PAY-7), never by hand.
     */
  status: string;
}
