/* eslint-disable */
// @ts-nocheck
import type { AvailabilityOut } from './availabilityOut';
import type { ItemOptionOut } from './itemOptionOut';
import type { ModifierGroupOut } from './modifierGroupOut';
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
  /** @nullable */
  image_url?: string | null;
  is_active: boolean;
  modifier_groups: ModifierGroupOut[];
  name: string;
  name_translations: unknown;
  options: ItemOptionOut[];
  org_id: string;
  sizes: SizeOut[];
  used_in_bundles: UsedInBundleOut[];
}
