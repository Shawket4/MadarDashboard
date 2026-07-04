/* eslint-disable */
// @ts-nocheck
import type { DeliveryModifierGroupNameTranslations } from './deliveryModifierGroupNameTranslations';
import type { DeliveryModifierOption } from './deliveryModifierOption';

/**
 * A per-item modifier group from the unified model (`menu_item_modifier_groups`
 * → `modifier_groups`/`modifier_options`), constraints resolved (attachment
 * overrides beat group defaults) and options already filtered to the
 * attachment's `included_option_ids`. Only addon-sourced options appear here —
 * the item's priced optionals stay in `optionals`. Empty until the org's
 * catalog is backfilled onto the unified tables; the customizer falls back to
 * the flat `addons` catalog + `allowed_addon_ids` in that case.
 */
export interface DeliveryModifierGroup {
  /**
     * The group's legacy addon type (`milk_type` / `coffee_type` / `extra` /
     * custom) — the swap-family hint the customizer keys its delta-price
     * estimate on. `None` for groups with no legacy lineage.
     * @nullable
     */
  addon_type?: string | null;
  group_id: string;
  is_required: boolean;
  /** @nullable */
  max_selections?: number | null;
  min_selections: number;
  name: string;
  name_translations: DeliveryModifierGroupNameTranslations;
  options: DeliveryModifierOption[];
  /** "single" | "multi". */
  selection_type: string;
}
