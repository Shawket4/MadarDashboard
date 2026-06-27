/* eslint-disable */
// @ts-nocheck
import type { OrderItemInput } from './orderItemInput';

export interface AddRoundRequest {
  /** @nullable */
  idempotency_key?: string | null;
  items: OrderItemInput[];
}
