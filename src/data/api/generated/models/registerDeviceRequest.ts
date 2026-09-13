/* eslint-disable */
// @ts-nocheck
import type { DeviceKind } from './deviceKind';

export interface RegisterDeviceRequest {
  /** @nullable */
  app_version?: string | null;
  branch_id: string;
  code: string;
  id: string;
  /** `pos` | `kds` | `waiter` */
  kind: DeviceKind;
  /** @nullable */
  label?: string | null;
  /** @nullable */
  platform?: string | null;
}
