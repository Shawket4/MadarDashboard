/* eslint-disable */
// @ts-nocheck

export type ListShiftsParams = {
/**
 * 1-based page number. Omit (along with `per_page`) to fetch every shift.
 */
page?: number;
/**
 * Page size (clamped to [1, 200]). Omit to fetch every shift in one page.
 */
per_page?: number;
};
