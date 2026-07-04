/* eslint-disable */
// @ts-nocheck

/**
 * Customer-facing delivery context attached to a finalized delivery order's
 * detail view. Sourced from the linked `delivery_orders` row (joined to its
 * delivery zone for the zone name). The delivery *fee* lives on [Order];
 * this carries the non-financial fulfilment details a teller/manager needs.
 */
export interface OrderDeliveryInfo {
  /** @nullable */
  address_line?: string | null;
  /** "in_mall" or "outside". */
  channel: string;
  customer_phone: string;
  /** @nullable */
  delivery_notes?: string | null;
  /**
     * Human-readable delivery reference (e.g. "D-DT-260614-0042").
     * @nullable
     */
  delivery_ref?: string | null;
  /** @nullable */
  floor?: string | null;
  /** @nullable */
  landmark?: string | null;
  /**
     * Payment method the customer indicated at intake ("cash"/"card"); the
     * teller confirms the actual method at finalize.
     * @nullable
     */
  payment_method_hint?: string | null;
  /** @nullable */
  place_name?: string | null;
  /**
     * Road distance (meters) used to price the delivery, when known.
     * @nullable
     */
  road_distance_meters?: number | null;
  /** @nullable */
  unit_number?: string | null;
  /**
     * Name of the matched delivery zone ring, when an outside order matched one.
     * @nullable
     */
  zone_name?: string | null;
}
