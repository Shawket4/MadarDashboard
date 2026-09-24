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
  /**
     * A slot of the branch plan (`GET /branch-plan`). The code takes the
     * slot's kind and name, and the device that uses it fills the slot.
     * @nullable
     */
  slot_id?: string | null;
}
