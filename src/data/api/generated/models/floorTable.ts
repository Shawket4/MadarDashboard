/* eslint-disable */
// @ts-nocheck

export interface FloorTable {
  branch_id: string;
  created_at: string;
  height: number;
  id: string;
  is_active: boolean;
  label: string;
  org_id: string;
  pos_x: number;
  pos_y: number;
  rotation: number;
  seats: number;
  /** @nullable */
  section_id?: string | null;
  shape: string;
  status: string;
  updated_at: string;
  width: number;
}
