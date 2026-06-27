/* eslint-disable */
// @ts-nocheck

export interface RoutingModeResponse {
  /** What actually applies right now (auto resolves to kds-if-stations-else-till). */
  effective: string;
  /**
     * Stored override (`kds` | `till` | `both`), or null when auto.
     * @nullable
     */
  mode?: string | null;
}
