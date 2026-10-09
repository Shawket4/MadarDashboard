/* eslint-disable */
// @ts-nocheck
import type { ChannelToggles } from './channelToggles';
import type { ComboSlot } from './comboSlot';
import type { SaleWindow } from './saleWindow';

/**
 * The `combo` object on a `kind=combo` row of `GET /menu-items?full=true`,
 * `/catalog/sync` and the `/sync/pull` `menu_item` row. The price is in the
 * row's usual price fields. Choices keep `category_id`: the till expands a
 * category from its own menu.
 */
export interface ComboFeed {
  is_fixed: boolean;
  /** The org's channel toggles, resolved for the requested branch. */
  sell: ChannelToggles;
  slots: ComboSlot[];
  /** Only the windows for this branch or for every branch. */
  windows: SaleWindow[];
}
