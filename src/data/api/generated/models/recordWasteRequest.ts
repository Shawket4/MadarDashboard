/* eslint-disable */
// @ts-nocheck

/**
 * One waste as a till (or the API) records it.
 */
export interface RecordWasteRequest {
  branch_id: string;
  /** @nullable */
  device_id?: string | null;
  /** Client-minted; the idempotency key. */
  id: string;
  /** @nullable */
  note?: string | null;
  /**
     * When it happened on the device. Default: now.
     * @nullable
     */
  occurred_at?: string | null;
  /** In `unit`. Whole units for a menu item. */
  quantity: number;
  /** expired | spoiled | damaged | overproduction | theft | other */
  reason: string;
  /**
     * Menu items only: the size whose recipe is wasted (default: the first size).
     * @nullable
     */
  size_label?: string | null;
  /** An org ingredient id, or a menu item id. */
  subject_id: string;
  /** `ingredient` | `menu_item` */
  subject_kind: string;
  /** @nullable */
  till_id?: string | null;
  /**
     * `g` | `kg` | `ml` | `l` | `pcs`. Default: the ingredient's own unit; a
     * menu item is always `pcs`.
     * @nullable
     */
  unit?: string | null;
}
