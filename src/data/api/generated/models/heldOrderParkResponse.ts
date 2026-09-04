/* eslint-disable */
// @ts-nocheck
import type { HeldOrderView } from './heldOrderView';

/**
 * Park/upsert result: the stored order plus whether a requested table
 * assignment was DROPPED because the table was taken (offline-first parks
 * keep the cart and lose the race, never the other way around).
 */
export interface HeldOrderParkResponse {
  held_order: HeldOrderView;
  table_conflict: boolean;
}
