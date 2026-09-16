/* eslint-disable */
// @ts-nocheck

export interface PreviewRequest {
  /**
     * Price and cost as at this branch; absent = catalogue / org-level cost.
     * @nullable
     */
  branch_id?: string | null;
  /** Chosen modifier options, including item-private optional-field ids. */
  option_ids?: string[];
  quantity?: number;
  /**
     * `takeaway` (default) | `dine_in`.
     * @nullable
     */
  service_mode?: string | null;
  /**
     * Size to price and deduct; absent = the order path's default (base price,
     * first size's recipe).
     * @nullable
     */
  size_label?: string | null;
}
