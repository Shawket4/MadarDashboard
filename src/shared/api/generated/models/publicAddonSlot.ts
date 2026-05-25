/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { PublicAddonItem } from './publicAddonItem';

export interface PublicAddonSlot {
  addon_items: PublicAddonItem[];
  addon_type: string;
  id: string;
  is_required: boolean;
  /** @nullable */
  label?: string | null;
  /** @nullable */
  max_selections?: number | null;
  min_selections: number;
}
