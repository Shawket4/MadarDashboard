/* eslint-disable */
// @ts-nocheck
import type { DealPoolEntry } from './dealPoolEntry';
import type { DealWriteNameTranslations } from './dealWriteNameTranslations';
import type { SaleWindow } from './saleWindow';

/**
 * `POST /deals`, `PUT /deals/{id}`.
 */
export interface DealWrite {
  /**
     * buy_get only (1–100; 100 = free).
     * @nullable
     */
  get_percent?: number | null;
  /**
     * buy_get only (1–20).
     * @nullable
     */
  get_qty?: number | null;
  is_active?: boolean;
  /** `n_for_price` | `buy_get`. */
  kind: string;
  /** @nullable */
  max_per_order?: number | null;
  name: string;
  name_translations?: DealWriteNameTranslations;
  pool: DealPoolEntry[];
  /**
     * n_for_price only.
     * @nullable
     */
  price?: number | null;
  /** N (n_for_price, 2–20) or the "buy" count (buy_get, 1–20). */
  qty: number;
  reward_pool?: DealPoolEntry[];
  sort?: number;
  windows?: SaleWindow[];
}
