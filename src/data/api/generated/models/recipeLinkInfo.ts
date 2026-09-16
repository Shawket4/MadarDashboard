/* eslint-disable */
// @ts-nocheck

/**
 * Link state of an item, from either side.
 */
export interface RecipeLinkInfo {
  /**
     * For a copy: `true` when its stored lines equal the source's for every size label
     * the copy has (lint F19, twin drift). `null` for an item that is not a copy.
     * @nullable
     */
  in_sync?: boolean | null;
  /** Live items whose recipe follows this one. */
  linked_copy_ids: string[];
  menu_item_id: string;
  /**
     * The item this one's recipe follows, or `null`.
     * @nullable
     */
  recipe_source_item_id?: string | null;
  /** @nullable */
  recipe_source_item_name?: string | null;
}
