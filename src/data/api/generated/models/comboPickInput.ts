/* eslint-disable */
// @ts-nocheck
import type { AddonInput } from './addonInput';

/**
 * One pick of a combo line. On replay the till's `share` and `surcharge`
 * (per combo unit) and add-on prices are stored as charged; live they are
 * ignored and the server prices every part.
 */
export interface ComboPickInput {
  addons?: AddonInput[];
  menu_item_id: string;
  /** @nullable */
  notes?: string | null;
  optional_field_ids?: string[];
  /** Units per combo unit; the part line's quantity is this × the line's. */
  quantity?: number;
  /**
     * Replay only: this pick's share of P, per combo unit.
     * @nullable
     */
  share?: number | null;
  /** @nullable */
  size_label?: string | null;
  slot_id: string;
  /**
     * Replay only: this pick's surcharge (choice + size), per combo unit.
     * @nullable
     */
  surcharge?: number | null;
}
