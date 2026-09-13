/* eslint-disable */
// @ts-nocheck

/**
 * One reward, by how often it was claimed in the range.
 */
export interface TopReward {
  menu_item_id: string;
  name: string;
  /** Balance spent on it, net of anything given back by a void or refund. */
  points: number;
  /** Redemption rows (one per covered order line). */
  redemptions: number;
  /** Units handed over. */
  units: number;
  /** Minor units of goods given away (what the covered lines were charged). */
  value_minor: number;
}
