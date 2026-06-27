/* eslint-disable */
// @ts-nocheck

export type FeedParams = {
branch_id: string;
/**
 * Optional station filter — only tickets with pending work for this station.
 * (Items are returned in full; the client greys/filters by station.)
 */
station_id?: string;
};
