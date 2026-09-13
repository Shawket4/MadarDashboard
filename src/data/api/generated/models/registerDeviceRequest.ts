/* eslint-disable */
// @ts-nocheck

export interface RegisterDeviceRequest {
  /** @nullable */
  app_version?: string | null;
  branch_id: string;
  code: string;
  id: string;
  /** `pos` | `kds` | `waiter` */
  kind: string;
  /** @nullable */
  label?: string | null;
  /** @nullable */
  platform?: string | null;
}
