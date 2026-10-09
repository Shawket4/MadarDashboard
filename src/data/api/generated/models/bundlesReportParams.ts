/* eslint-disable */
// @ts-nocheck

export type BundlesReportParams = {
/**
 * Business date, inclusive.
 */
from: string;
/**
 * Business date, inclusive.
 */
to: string;
branch_id?: string;
/**
 * `combo` | `deal`; omitted = both.
 */
kind?: string;
};
