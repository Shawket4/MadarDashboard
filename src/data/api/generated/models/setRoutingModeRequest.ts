/* eslint-disable */
// @ts-nocheck

export interface SetRoutingModeRequest {
  branch_id: string;
  /**
     * `kds` | `till` | `both`, or null to clear the override (back to auto).
     * @nullable
     */
  mode?: string | null;
}
