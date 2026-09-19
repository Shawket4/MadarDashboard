/* eslint-disable */
// @ts-nocheck

export type ListStaffDrinksParams = {
branch_id: string;
/**
 * Business days, inclusive. Both default to the branch's today.
 */
from?: string;
to?: string;
/**
 * Only the drinks that went past the allowance.
 */
overspent_only?: boolean;
};
