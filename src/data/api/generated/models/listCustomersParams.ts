/* eslint-disable */
// @ts-nocheck

export type ListCustomersParams = {
/**
 * Matches name (contains) or phone (digits).
 */
q?: string;
/**
 * `true` = loyalty members only, `false` = non-members only.
 */
member?: boolean;
/**
 * Only customers that first came from this source (`pos`, `online`,
 * `loyalty`, `booking`, `table_qr`, `aggregator`, `dashboard`).
 */
source?: string;
/**
 * Default 100, at most 500.
 */
limit?: number;
offset?: number;
};
