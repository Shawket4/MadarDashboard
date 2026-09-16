/* eslint-disable */
// @ts-nocheck
import type { AssetGroupRef } from './assetGroupRef';
import type { AvailabilityOut } from './availabilityOut';
import type { ItemOptionOut } from './itemOptionOut';
import type { ModifierGroupOut } from './modifierGroupOut';
import type { RecipeStep } from './recipeStep';
import type { SizeOut } from './sizeOut';
import type { UsedInBundleOut } from './usedInBundleOut';

/**
 * The full item aggregate the one-page Menu Studio editor renders.
 */
export interface StudioAggregate {
  availability: AvailabilityOut;
  catalog_revision: number;
  /** @nullable */
  category_id?: string | null;
  /** @nullable */
  description?: string | null;
  id: string;
  image?: null | AssetGroupRef;
  /** @nullable */
  image_url?: string | null;
  is_active: boolean;
  /** Live items whose recipe follows this one. */
  linked_copy_ids?: string[];
  modifier_groups: ModifierGroupOut[];
  name: string;
  name_translations: unknown;
  options: ItemOptionOut[];
  org_id: string;
  /**
     * The item this one's recipe follows (linked copy), or `null`.
     * @nullable
     */
  recipe_source_item_id?: string | null;
  /**
     * How the item is made, in order. Edited through `PUT /recipes/steps/{id}`
     * and saved by the studio alongside the recipe lines.
     */
  recipe_steps: RecipeStep[];
  sizes: SizeOut[];
  used_in_bundles: UsedInBundleOut[];
}
