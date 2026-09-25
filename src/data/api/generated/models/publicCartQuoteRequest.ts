/* eslint-disable */
// @ts-nocheck
import type { OrderItemInput } from './orderItemInput';

/**
 * `POST /public/branches/{id}/cart-quote` (online) and
 * `POST /public/tables/{id}/cart-quote` (QR): the cart priced by the server
 * exactly as the order will be, with the best deals applied automatically.
 */
export interface PublicCartQuoteRequest {
  /**
     * Online only: the delivery sub-channel whose prices apply
     * (`in_mall` | `outside` | `umbrella` | `pickup`); default `pickup`.
     * @nullable
     */
  channel?: string | null;
  items: OrderItemInput[];
}
