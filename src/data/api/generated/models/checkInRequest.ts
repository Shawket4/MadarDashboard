/* eslint-disable */
// @ts-nocheck
import type { OfflineStamp } from './offlineStamp';

export interface CheckInRequest {
  branch_id: string;
  /**
     * Device coordinates. Required whenever the org enforces the geofence.
     * @nullable
     */
  latitude?: number | null;
  /** @nullable */
  longitude?: number | null;
  offline?: null | OfflineStamp;
  /**
     * "Always" location was refused: the shift is marked and the manager told
     * (CL-5). Location at the punch is still required.
     * @nullable
     */
  tracking_off?: boolean | null;
}
