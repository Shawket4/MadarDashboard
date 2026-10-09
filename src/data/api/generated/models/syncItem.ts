/* eslint-disable */
// @ts-nocheck
import type { ComboFeed } from './comboFeed';
import type { MealLink } from './mealLink';
import type { SyncModifierGroup } from './syncModifierGroup';
import type { SyncSize } from './syncSize';

/**
 * One menu item with its sizes and attached modifier groups.
 */
export interface SyncItem {
  /** @nullable */
  category_id?: string | null;
  combo?: null | ComboFeed;
  id: string;
  /** `item` | `combo` (combos module). Additive. */
  kind?: string;
  meal?: null | MealLink;
  modifier_groups: SyncModifierGroup[];
  name: string;
  name_translations: unknown;
  sizes: SyncSize[];
}
