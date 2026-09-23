/* eslint-disable */
// @ts-nocheck
import type { OfflineStamp } from './offlineStamp';

export interface CheckOutRequest {
  /**
     * The fix's reported accuracy, metres (CL-9).
     * @nullable
     */
  accuracy_meters?: number | null;
  /**
     * The OS's mock-location marker for this fix (CL-9).
     * @nullable
     */
  is_mock?: boolean | null;
  /** @nullable */
  latitude?: number | null;
  /** @nullable */
  longitude?: number | null;
  offline?: null | OfflineStamp;
}
