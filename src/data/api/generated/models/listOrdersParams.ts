/* eslint-disable */
// @ts-nocheck

export type ListOrdersParams = {
branch_id?: string;
shift_id?: string;
updated_after?: string;
page?: number;
per_page?: number;
teller_name?: string;
payment_method?: string;
status?: string;
from?: string;
to?: string;
/**
 * Filter by order origin: "dine_in" or "delivery".
 */
order_type?: string;
/**
 * Filter delivery orders by channel: "in_mall" or "outside".
 */
channel?: string;
/**
 * When true, each order in `data` embeds its full line items
 * (addons/optionals/bundle components) — the response shape becomes
 * [PaginatedOrdersFull]. Lets offline-first clients cache complete
 * orders in one round trip instead of fetching each order separately.
 */
include_items?: boolean;
};
