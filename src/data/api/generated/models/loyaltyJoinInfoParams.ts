/* eslint-disable */
// @ts-nocheck

export type LoyaltyJoinInfoParams = {
/**
 * The counter QR of one branch. Its settings and its catalogue apply.
 */
branch_id?: string;
/**
 * The organisation's own code, for a shop that wants ONE card to hand out
 * — a poster, a receipt footer, a link in a bio. The programme's org-level
 * settings apply, which is also what the wallet pass has always used.
 */
org_id?: string;
};
