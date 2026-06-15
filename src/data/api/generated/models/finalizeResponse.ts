/* eslint-disable */
// @ts-nocheck
import type { DeliveryOrder } from './deliveryOrder';

export interface FinalizeResponse {
  delivery_order: DeliveryOrder;
  order_id: string;
  /** @nullable */
  order_ref?: string | null;
  warnings: string[];
}
