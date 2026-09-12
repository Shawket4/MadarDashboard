/* eslint-disable */
// @ts-nocheck
import type { TableBookingHint } from './tableBookingHint';

export interface FloorTable {
  branch_id: string;
  created_at: string;
  height: number;
  id: string;
  is_active: boolean;
  label: string;
  next_booking?: null | TableBookingHint;
  org_id: string;
  pos_x: number;
  pos_y: number;
  rotation: number;
  /**
     * When the party at this table sat down — the hold's stamp, else the
     * bill's opening. `null` unless the table is seated. Every device renders
     * its table clock from this, so they all agree.
     * @nullable
     */
  seated_at?: string | null;
  seats: number;
  /** @nullable */
  section_id?: string | null;
  shape: string;
  status: string;
  updated_at: string;
  width: number;
}
