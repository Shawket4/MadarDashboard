/* eslint-disable */
// @ts-nocheck

export interface CreateWasteRequest {
  /** @nullable */
  note?: string | null;
  org_ingredient_id: string;
  quantity: number;
  /** expired | spoiled | damaged | overproduction | theft | other */
  reason: string;
}
