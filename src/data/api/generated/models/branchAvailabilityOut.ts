/* eslint-disable */
// @ts-nocheck
import type { ChannelOverrideOut } from './channelOverrideOut';
import type { SizeOverrideOut } from './sizeOverrideOut';

export interface BranchAvailabilityOut {
  branch_id: string;
  channels: ChannelOverrideOut[];
  sizes: SizeOverrideOut[];
}
