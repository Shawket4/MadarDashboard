/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { PublicAddonSlot } from './publicAddonSlot';
import type { PublicItemSize } from './publicItemSize';

export interface PublicMenuItem {
  addon_slots: PublicAddonSlot[];
  base_price: number;
  /** @nullable */
  description?: string | null;
  display_order: number;
  id: string;
  /** @nullable */
  image_url?: string | null;
  name: string;
  sizes: PublicItemSize[];
}
