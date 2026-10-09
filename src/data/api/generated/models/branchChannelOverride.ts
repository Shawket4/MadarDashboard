/* eslint-disable */
// @ts-nocheck
import type { ChannelOverride } from './channelOverride';
import type { ChannelToggles } from './channelToggles';

/**
 * One branch's override, with what it resolves to.
 */
export interface BranchChannelOverride {
  branch_id: string;
  /** The org's toggles with this override applied. */
  effective: ChannelToggles;
  sell: ChannelOverride;
}
