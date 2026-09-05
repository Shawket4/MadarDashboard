/* eslint-disable */
// @ts-nocheck
import type { StocktakeScope } from './stocktakeScope';

export interface Stocktake {
  branch_id: string;
  /**
     * Branch label — only populated by the stocktakes list (so the "All
     * branches" view can show which branch each stocktake belongs to).
     * @nullable
     */
  branch_name?: string | null;
  /**
     * Items counted / items in scope; populated by the list endpoint only.
     * @nullable
     */
  counted_items?: number | null;
  created_at: string;
  /** @nullable */
  finalized_at?: string | null;
  /** @nullable */
  finalized_by?: string | null;
  id: string;
  /** @nullable */
  note?: string | null;
  org_id: string;
  /**
     * `{"kind":"full"}`, `{"kind":"category","category_id":…}` or
     * `{"kind":"items","org_ingredient_ids":[…]}`.
     */
  scope: StocktakeScope;
  started_at: string;
  started_by: string;
  /** @nullable */
  started_by_name?: string | null;
  status: string;
  /** @nullable */
  total_items?: number | null;
}
