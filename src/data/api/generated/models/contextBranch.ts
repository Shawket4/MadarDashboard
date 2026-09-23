/* eslint-disable */
// @ts-nocheck

export interface ContextBranch {
  /** @nullable */
  geo_radius_meters?: number | null;
  id: string;
  /**
     * The fence centre, so the phone can say inside/outside offline.
     * @nullable
     */
  latitude?: number | null;
  /** @nullable */
  longitude?: number | null;
  name: string;
  timezone: string;
}
