/* eslint-disable */
// @ts-nocheck
import type { Device } from './device';

export interface ActivateDeviceResponse {
  branch_id: string;
  branch_name: string;
  device: Device;
  /**
     * The device's own credential. Returned ONCE; store it in the device
     * vault. Sent later as `X-Madar-Device-Token`.
     */
  device_token: string;
  org_id: string;
  org_name: string;
  /**
     * The branch-plan slot this device now fills, when the code was made for one.
     * @nullable
     */
  slot_id?: string | null;
}
