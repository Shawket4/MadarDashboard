/* eslint-disable */
// @ts-nocheck
import type { ActivationCodeState } from './activationCodeState';
import type { DeviceKind } from './deviceKind';

export interface ActivationCode {
  branch_id: string;
  /** The 8 digits. Shown while free; kept afterwards so the list reads. */
  code: string;
  created_at: string;
  expires_at: string;
  id: string;
  kind: DeviceKind;
  /** @nullable */
  label?: string | null;
  /** @nullable */
  revoked_at?: string | null;
  /**
     * The branch-plan slot this code fills, when it was made from the
     * branch builder. The device that uses it takes the slot.
     * @nullable
     */
  slot_id?: string | null;
  state: ActivationCodeState;
  /** @nullable */
  used_at?: string | null;
  /** @nullable */
  used_by_device?: string | null;
}
