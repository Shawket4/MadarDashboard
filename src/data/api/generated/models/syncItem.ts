/* eslint-disable */
// @ts-nocheck
import type { SyncModifierGroup } from './syncModifierGroup';
import type { SyncSize } from './syncSize';

/**
 * One menu item with its sizes and attached modifier groups.
 */
export interface SyncItem {
  /** @nullable */
  category_id?: string | null;
  id: string;
  modifier_groups: SyncModifierGroup[];
  name: string;
  name_translations: unknown;
  sizes: SyncSize[];
}
