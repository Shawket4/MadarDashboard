/* eslint-disable */
// @ts-nocheck
import type { DeliveryOrder } from './deliveryOrder';

/**
 * What rides the SSE wire. The POS upserts `order` by id, and on
 * `event_type == "created"` fires its new-order alert. `order` is the exact
 * same shape returned by `GET /delivery-orders`, so the client needs no second
 * model.
 */
export interface DeliveryEvent {
  /** `"created"` (intake) | `"updated"` (status / cancel / finalize / prep-time). */
  event_type: string;
  order: DeliveryOrder;
}
