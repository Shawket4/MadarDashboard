/* eslint-disable */
// @ts-nocheck

/**
 * One table's geometry in a bulk drag-save. `section_id` lets a drag move a
 * table between sections in the same save.
 */
export interface TablePosition {
  /**
     * Optimistic-concurrency token: the `updated_at` the client last saw for
     * this table.
     *
     * The dashboard autosaves every gesture, so two managers arranging the
     * same room no longer collide rarely and visibly -- they collide often and
     * silently, each overwriting the other's last drag. When this is sent, the
     * write only lands if the row has not moved since; otherwise the whole
     * request is rejected and the caller is told exactly which tables changed.
     *
     * Optional so existing clients (and the POS) keep working unchanged: absent
     * means "no guard", which is the previous last-write-wins behaviour.
     * @nullable
     */
  expected_updated_at?: string | null;
  height: number;
  id: string;
  pos_x: number;
  pos_y: number;
  rotation: number;
  /** @nullable */
  section_id?: string | null;
  width: number;
}
