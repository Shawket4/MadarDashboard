/* eslint-disable */
// @ts-nocheck

export type GetLoyaltyAnalyticsParams = {
/**
 * Omit for the whole organisation; supply a branch to narrow the
 * redemption figures to it (the liability is org-wide either way — a
 * balance can be spent at any branch).
 * @nullable
 */
branch_id?: string | null;
/**
 * Inclusive start of the range. Defaults to 30 days before `to`.
 * @nullable
 */
from?: string | null;
/**
 * Exclusive end of the range. Defaults to now.
 * @nullable
 */
to?: string | null;
};
