/* eslint-disable */
// @ts-nocheck
import type { HeldOrderView } from './heldOrderView';

/**
 * The `GET /held-orders` sync payload. With `since`, tombstones are included
 * so devices retire local copies; `server_time` is the client's next cursor.
 */
export interface HeldOrdersSyncResponse {
  held_orders: HeldOrderView[];
  server_time: string;
}
