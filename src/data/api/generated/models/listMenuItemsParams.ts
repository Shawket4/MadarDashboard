/* eslint-disable */
// @ts-nocheck

export type ListMenuItemsParams = {
org_id: string;
category_id?: string;
/**
 * When true, embed sizes + addon slots + optionals + recipes per item
 * (the shape the POS/teller consumes). Always returns a plain, unpaginated
 * array — the POS depends on this contract.
 */
full?: boolean;
/**
 * When set, prices are branch-effective (branch override replaces base_price)
 * and items disabled at this branch are excluded — the per-branch menu the POS
 * consumes. Omitted → the plain org catalog (legacy behaviour).
 */
branch_id?: string;
};
