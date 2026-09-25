/* eslint-disable */
// @ts-nocheck

/**
 * One of my claims on an open shift, and how it ended (SC-9, S-162): a
 * request like any other, so it stays in my Requests once decided.
 */
export interface MyClaim {
  branch_id: string;
  claimed_at: string;
  /**
     * When it was decided or withdrawn; null while pending, and on a claim
     * decided before the server kept this history.
     * @nullable
     */
  decided_at?: string | null;
  id: string;
  on_date: string;
  open_shift_id: string;
  shift_name: string;
  /**
     * `pending` · `approved` · `declined` · `withdrawn`. A shift the
     * manager took back while the claim waited is `declined`.
     */
  status: string;
  work_shift_id: string;
}
