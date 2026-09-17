/* eslint-disable */
// @ts-nocheck
import type { SpotCheckMethodLine } from './spotCheckMethodLine';

export interface TillSpotCheck {
  /** @nullable */
  approval_id?: string | null;
  /** @nullable */
  approved_by?: string | null;
  /** @nullable */
  approved_by_name?: string | null;
  branch_id: string;
  /** `counted_cash - expected_cash`. */
  cash_discrepancy: number;
  checked_at: string;
  checked_by: string;
  checked_by_name: string;
  counted_cash: number;
  created_at: string;
  /** @nullable */
  device_id?: string | null;
  expected_cash: number;
  id: string;
  methods: SpotCheckMethodLine[];
  /** @nullable */
  note?: string | null;
  till_id: string;
}
