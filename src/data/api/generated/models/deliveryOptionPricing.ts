/* eslint-disable */
// @ts-nocheck
import type { DeliveryOptionPricingView } from './deliveryOptionPricingView';

/**
 * One option as madar-catalog prices it at this branch, plus this channel's
 * own price for it: online intake charges a channel price instead of the
 * rule's (see `delivery::snapshot`).
 */
export interface DeliveryOptionPricing {
  /** @nullable */
  channel_price?: number | null;
  view: DeliveryOptionPricingView;
}
