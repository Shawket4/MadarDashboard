/* eslint-disable */
// @ts-nocheck

export interface CreateWasteRequest {
  /** @nullable */
  note?: string | null;
  org_ingredient_id: string;
  quantity: number;
  /** expired | spoiled | damaged | overproduction | order_cancelled | theft | other
   * (`order_cancelled` is normally auto-logged by void/cancel, not entered here) */
  reason: string;
}
