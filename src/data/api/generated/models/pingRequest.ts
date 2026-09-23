/* eslint-disable */
// @ts-nocheck
import type { OfflineStamp } from './offlineStamp';

export interface PingRequest {
  /** @nullable */
  accuracy_meters?: number | null;
  /** @nullable */
  battery_percent?: number | null;
  /**
     * The OS's own mock-location marker (Android `isMock`, iOS
     * `isSimulatedBySoftware`) (CL-9).
     * @nullable
     */
  is_mock?: boolean | null;
  latitude: number;
  longitude: number;
  offline?: null | OfflineStamp;
}
