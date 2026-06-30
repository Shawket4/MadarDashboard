/* eslint-disable */
// @ts-nocheck

export type ListBookingsParams = {
branch_id: string;
status?: string;
/**
 * Filter reservations to this calendar date (YYYY-MM-DD). Omit for the live
 * board (everything not yet completed/cancelled/no_show).
 */
date?: string;
};
