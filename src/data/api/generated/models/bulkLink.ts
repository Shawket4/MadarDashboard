/* eslint-disable */
// @ts-nocheck

/**
 * An item's use of a group, with the limits that apply on this item.
 */
export interface BulkLink {
  /** A [`BulkGroup::key`]. */
  group: string;
  /**
     * @minimum 0
     * @nullable
     */
  max?: number | null;
  /** @minimum 0 */
  min: number;
}
