/* eslint-disable */
// @ts-nocheck

export interface StockMovement {
  /**
     * The manager who approved it on the till.
     * @nullable
     */
  approved_by_name?: string | null;
  balance_after: number;
  below_zero: boolean;
  branch_id: string;
  /**
     * Branch name; only populated by the all-branches waste roll-up (nil
     * {branch_id}). `None` for single-branch queries that do not select it.
     * @nullable
     */
  branch_name?: string | null;
  /** @nullable */
  branch_stock_id?: string | null;
  created_at: string;
  /** @nullable */
  created_by?: string | null;
  /** @nullable */
  created_by_name?: string | null;
  /** @nullable */
  device_id?: string | null;
  /** @nullable */
  device_name?: string | null;
  id: string;
  ingredient_name: string;
  /**
     * inventory_movement_type: sale | void_restock | adjustment_add |
     * adjustment_remove | waste | transfer_out | transfer_in | purchase_in |
     * purchase_return | stock_count
     */
  movement_type: string;
  /** @nullable */
  note?: string | null;
  /**
     * When the waste HAPPENED: the device's time for a till waste, the
     * refund's `issued_at`, the void's `voided_at`, else the post time. The
     * log is ordered by it.
     * @nullable
     */
  occurred_at?: string | null;
  /** @nullable */
  order_display_number?: string | null;
  /**
     * A refund's or void's waste: the sale.
     * @nullable
     */
  order_id?: string | null;
  org_ingredient_id: string;
  /** Signed delta applied to stock (consumption negative, replenishment positive). */
  quantity: number;
  /** @nullable */
  reason?: string | null;
  /**
     * When the server received it (= `created_at`). Differs from
     * `occurred_at` when a till queued the waste offline.
     * @nullable
     */
  received_at?: string | null;
  /**
     * A refund's waste: the refund it came from.
     * @nullable
     */
  refund_id?: string | null;
  /** @nullable */
  source_id?: string | null;
  /** @nullable */
  source_type?: string | null;
  /** @nullable */
  till_id?: string | null;
  unit: string;
  /**
     * Piastres per unit at movement time; `null` ⟺ unknown.
     * @nullable
     */
  unit_cost?: number | null;
  /**
     * The quantity as the person typed it, in `waste_unit`.
     * @nullable
     */
  waste_quantity?: number | null;
  /** @nullable */
  waste_size_label?: string | null;
  /**
     * `pos` | `dashboard` | `refund` (a refunded sale's stock) | `order` (a
     * made order voided before voids always restocked).
     * @nullable
     */
  waste_source?: string | null;
  /**
     * `ingredient` | `menu_item`, when the waste was recorded with a header.
     * @nullable
     */
  waste_subject_kind?: string | null;
  /**
     * What the person picked (the menu item for an exploded item waste).
     * @nullable
     */
  waste_subject_name?: string | null;
  /** @nullable */
  waste_unit?: string | null;
  /**
     * The whole waste's value (all its lines), piastres.
     * @nullable
     */
  waste_value_minor?: number | null;
}
