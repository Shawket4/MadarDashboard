/* eslint-disable */
// @ts-nocheck

/**
 * One table's geometry in a bulk drag-save. `section_id` lets a drag move a
 * table between sections in the same save.
 */
export interface TablePosition {
  height: number;
  id: string;
  pos_x: number;
  pos_y: number;
  rotation: number;
  /** @nullable */
  section_id?: string | null;
  width: number;
}
