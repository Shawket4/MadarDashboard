/* eslint-disable */
// @ts-nocheck

export type ListHeldOrdersParams = {
branch_id: string;
/**
 * Sync cursor: return everything updated after this instant, INCLUDING
 * completed/discarded tombstones. Omit for the live board (held+resumed).
 */
since?: string;
};
