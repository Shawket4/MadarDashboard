/* eslint-disable */
// @ts-nocheck

export interface QuoteResponse {
  /** @nullable */
  distance_meters?: number | null;
  /** @nullable */
  fee?: number | null;
  /** "ok" | "out_of_range" | "unavailable" */
  status: string;
  /** @nullable */
  zone_id?: string | null;
  /** @nullable */
  zone_name?: string | null;
}
