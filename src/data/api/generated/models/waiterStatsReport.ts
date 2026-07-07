/* eslint-disable */
// @ts-nocheck
import type { WaiterStats } from './waiterStats';

/**
 * Envelope for the waiters split: rows plus the branch-level totals needed
 * to caption coverage ("X of Y orders came through waiters").
 */
export interface WaiterStatsReport {
  /** Non-voided orders in range that carry a waiter. */
  attributed_orders: number;
  /** All non-voided orders in range (waiter or not). */
  total_orders: number;
  waiters: WaiterStats[];
}
