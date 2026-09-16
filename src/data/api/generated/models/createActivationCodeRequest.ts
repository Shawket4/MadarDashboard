/* eslint-disable */
// @ts-nocheck
import type { DeviceKind } from './deviceKind';

export interface CreateActivationCodeRequest {
  branch_id: string;
  kind?: null | DeviceKind;
  /**
     * A name for the tablet it is meant for ("Front counter").
     * @nullable
     */
  label?: string | null;
}
