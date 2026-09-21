/* eslint-disable */
// @ts-nocheck

/**
 * One recipe line of a modifier option, as the group editor shows it.
 */
export interface GroupOptionRecipeLine {
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  /**
     * `null` = the generic line (every size); else the per-size amount for that
     * size label (menu modeling B9). The editor must round-trip it on save.
     * @nullable
     */
  size_label?: string | null;
  unit: string;
}
