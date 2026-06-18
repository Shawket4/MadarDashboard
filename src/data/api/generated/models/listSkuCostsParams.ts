/* eslint-disable */
// @ts-nocheck

export type ListSkuCostsParams = {
org_id: string;
/**
 * Optional: resolve costs at this branch's actual cost (falling back to the
 * org default per ingredient). Omit for the org default / standard cost.
 * @nullable
 */
branch_id?: string | null;
};
