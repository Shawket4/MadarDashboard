/* eslint-disable */
// @ts-nocheck

export interface SlotAvailability {
  available: boolean;
  ends_at: string;
  starts_at: string;
  /**
     * The tables the auto-assigner would pick (host view only; empty when
     * unavailable).
     */
  table_ids: string[];
}
