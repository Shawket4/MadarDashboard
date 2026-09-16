/* eslint-disable */
// @ts-nocheck

export interface ActivateDeviceRequest {
  /** @nullable */
  app_version?: string | null;
  /** The 8-digit code from the dashboard. */
  code: string;
  /**
     * The device's short code on receipts (`T1`); a default is derived when
     * absent or invalid.
     * @nullable
     */
  device_code?: string | null;
  /** The install's own id (the core's `lan_device_id`). */
  device_id: string;
  /** @nullable */
  platform?: string | null;
}
