/* eslint-disable */
// @ts-nocheck

export interface CheckInRequest {
  branch_id: string;
  /**
     * Device coordinates. Required whenever the org enforces the geofence.
     * @nullable
     */
  latitude?: number | null;
  /** @nullable */
  longitude?: number | null;
}
