/* eslint-disable */
// @ts-nocheck

/**
 * One named thing a check found wrong: a branch, an item, an attachment, an ingredient.
 */
export interface ReadinessProblem {
  entity_id: string;
  /** `branch` | `item` | `attachment` | `option` | `ingredient`. */
  entity_type: string;
  /**
     * The modifier group to open, when the problem is about one.
     * @nullable
     */
  group_id?: string | null;
  /**
     * The item to open, when the problem is about one.
     * @nullable
     */
  item_id?: string | null;
  /**
     * The lint's sentence, English, for the menu-lint problems only.
     * @nullable
     */
  message?: string | null;
  name: string;
  /**
     * The menu lint rule (`F1`…) when the problem comes from the lint.
     * @nullable
     */
  rule?: string | null;
}
