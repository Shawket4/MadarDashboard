/* eslint-disable */
// @ts-nocheck

/**
 * An availability window. A combo or deal with no window is always
 * available; with windows, it is available while any window that applies to
 * the branch (its own, or an all-branch one) is open.
 */
export interface SaleWindow {
  /**
     * `null` = every branch.
     * @nullable
     */
  branch_id?: string | null;
  /** @nullable */
  ends_at?: string | null;
  /**
     * Ignored on write (windows are replaced as a set).
     * @nullable
     */
  id?: string | null;
  /**
     * "HH:MM"; with `ends_at`, or neither (the whole day). `ends_at` before
     * `starts_at` crosses midnight: the part after midnight belongs to the day
     * the window started (its weekday and date range).
     * @nullable
     */
  starts_at?: string | null;
  /**
     * Optional date range, inclusive, judged on the day the window started.
     * @nullable
     */
  valid_from?: string | null;
  /** @nullable */
  valid_to?: string | null;
  /** bit0 = Sunday … bit6 = Saturday; 127 = every day (the default). */
  weekdays?: number;
}
