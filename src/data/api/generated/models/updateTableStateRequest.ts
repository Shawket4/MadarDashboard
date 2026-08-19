/* eslint-disable */
// @ts-nocheck

/**
 * Operational table-state edit from the POS: the layout (geometry/shape) is
 * dashboard-authored, but STATE — status walks (bussing a dirty table) and
 * which zone the physical table currently sits in — belongs to the floor
 * staff. Both fields optional; `clear_section` moves the table out of every
 * section (`section_id` wins when both are sent).
 */
export interface UpdateTableStateRequest {
  clear_section?: boolean;
  /** @nullable */
  section_id?: string | null;
  /**
     * `free` | `held` | `seated` | `dirty`.
     * @nullable
     */
  status?: string | null;
}
