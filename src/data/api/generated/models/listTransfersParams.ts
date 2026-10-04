/* eslint-disable */
// @ts-nocheck

export type ListTransfersParams = {
/**
 * `incoming` | `outgoing`; omitted = both.
 */
direction?: string;
/**
 * `requested` | `draft` | `dispatched` | `received` | `cancelled`; omitted = all.
 */
status?: string;
limit?: number;
offset?: number;
};
