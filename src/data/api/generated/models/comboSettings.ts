/* eslint-disable */
// @ts-nocheck
import type { BranchChannelOverride } from './branchChannelOverride';
import type { ChannelToggles } from './channelToggles';

/**
 * `GET /settings/combos`: the minimum margin (C11) and the channel toggles
 * (§11.1) that gate every combo and every deal.
 */
export interface ComboSettings {
  /** Every branch that overrides at least one toggle. */
  branch_overrides: BranchChannelOverride[];
  /** The org-wide toggles. */
  channels: ChannelToggles;
  /**
     * The owner's minimum margin as a decimal fraction string ("0.5500");
     * `null` = no margin warning.
     * @nullable
     */
  min_margin?: string | null;
}
