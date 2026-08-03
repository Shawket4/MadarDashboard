/* eslint-disable */
// @ts-nocheck

export type AnalyticsOrdersParams = {
/**
 * First business day to include, `YYYY-MM-DD`, in the branch's timezone.
 */
from: string;
/**
 * Last business day to include, `YYYY-MM-DD`, INCLUSIVE.
 */
to: string;
/**
 * Optional page size (max 5000). Omit for the whole window.
 */
limit?: number;
/**
 * Optional row offset, used with `limit`. Defaults to 0.
 */
offset?: number;
};
