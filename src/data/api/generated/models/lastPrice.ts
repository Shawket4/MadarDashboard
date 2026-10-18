/* eslint-disable */
// @ts-nocheck
import type { LastPriceSource } from './lastPriceSource';
import type { LastUnitPrice } from './lastUnitPrice';

/**
 * The last price paid for one ingredient, the default for a new PO line.
 */
export interface LastPrice {
  /** When the purchase order was raised. */
  ordered_at: string;
  org_ingredient_id: string;
  /** The purchase order the price comes from. */
  po_id: string;
  po_status: string;
  /**
     * The same price in every unit a new line for this ingredient can be
     * ordered in (its measure's units and its named pack), converted through
     * the ingredient's units. A unit that does not convert is left out: the
     * client then offers no default for it.
     */
  prices: LastUnitPrice[];
  /**
     * True when the price is what a delivery was actually invoiced at (a
     * goods receipt), false when it is only what was ordered.
     */
  received: boolean;
  /**
     * When the delivery the price comes from was received (`received` only).
     * @nullable
     */
  received_at?: string | null;
  source: LastPriceSource;
  /** @nullable */
  supplier_id?: string | null;
  /** @nullable */
  supplier_name?: string | null;
  /** The remembered line's purchase unit. */
  unit: string;
  /** Piastres per one `unit`, exact (6 dp). */
  unit_price: number;
}
