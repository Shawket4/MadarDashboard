/* eslint-disable */
// @ts-nocheck
import type { OfflineStamp } from './offlineStamp';

export interface CheckOutRequest {
  /** @nullable */
  latitude?: number | null;
  /** @nullable */
  longitude?: number | null;
  offline?: null | OfflineStamp;
}
