/* eslint-disable */
// @ts-nocheck

export type ExportOrdersParams = {
branch_id?: string;
shift_id?: string;
teller_name?: string;
/**
 * Filter by the WAITER who opened the ticket (ILIKE, partial match).
 */
waiter_name?: string;
payment_method?: string;
status?: string;
from?: string;
to?: string;
};
