/* eslint-disable */
// @ts-nocheck

export type GetLoyaltyStatsParams = {
/**
 * Start of the range (an instant, like the other loyalty analytics); its
 * day in the shop's time zone is the first day. Default: 29 days before `to`.
 */
from?: string;
/**
 * End of the range (inclusive); its day in the shop's zone is the last.
 * Default: today.
 */
to?: string;
};
