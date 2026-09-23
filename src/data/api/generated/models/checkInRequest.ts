/* eslint-disable */
// @ts-nocheck
import type { OfflineStamp } from './offlineStamp';

export interface CheckInRequest {
  /**
     * The fix's reported accuracy, metres (CL-9: a perfect one is suspicious).
     * @nullable
     */
  accuracy_meters?: number | null;
  branch_id: string;
  /**
     * The OS's mock-location marker for this fix (CL-9).
     * @nullable
     */
  is_mock?: boolean | null;
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
