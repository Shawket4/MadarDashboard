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
/**
 * OPT-IN, with `full=true` only: `compact` answers an OBJECT
 * `{shape: "compact-1", items, group_options}` instead of the array —
 * every attached choice group's options once in `group_options` (keyed by
 * group id) rather than copied into each item's `pricing.groups`, and
 * without the fields no client reads (`org_id`, `image`, `created_at`,
 * `updated_at`). See `menu::compact`. Any other value, or none, is the
 * default array, unchanged.
 */
shape?: string;
};
