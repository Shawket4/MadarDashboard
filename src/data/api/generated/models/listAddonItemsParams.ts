/* eslint-disable */
// @ts-nocheck

export type ListAddonItemsParams = {
org_id: string;
addon_type?: string;
/**
 * When set, prices are branch-effective (override replaces default_price) and
 * addons disabled at this branch are excluded — the per-branch addon list the
 * POS consumes. Omitted → the plain org list (legacy behaviour).
 */
branch_id?: string;
};
