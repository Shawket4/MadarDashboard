/* eslint-disable */
// @ts-nocheck

export type PublicBranchesParams = {
org_id: string;
/**
 * The read-only menu (`/menu`): every active branch, not only the ones
 * taking online orders — a shop with ordering switched off still has a
 * menu to show. Each branch's channel flags stay as they are, so a client
 * never offers an order where none is taken.
 * @nullable
 */
browse?: boolean | null;
};
