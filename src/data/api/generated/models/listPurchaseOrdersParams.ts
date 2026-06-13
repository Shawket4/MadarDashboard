/* eslint-disable */
// @ts-nocheck

export type ListPurchaseOrdersParams = {
/**
 * Filter by status: draft | ordered | partially_received | received | cancelled.
 */
status?: string;
/**
 * Only orders expected on or before this instant (for "arriving by" views).
 */
expected_before?: string;
};
