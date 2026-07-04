/* eslint-disable */
// @ts-nocheck

export interface AddonInput {
  addon_item_id: string;
  quantity?: number;
  /**
     * Charged unit price (piastres) the POS applied for this addon. When present
     * it is RECORDED as the addon's unit_price; absent → the server's expected
     * (catalog) price is used. Bundle-component addons ignore this (server-priced).
     * @nullable
     */
  unit_price?: number | null;
}
