/* eslint-disable */
// @ts-nocheck

export interface RevokeOrgRequest {
  /**
     * Only these kinds (e.g. `["pin", "device"]` signs out every till). Absent:
     * every session of the org, and older tokens of its people too.
     * @nullable
     */
  kinds?: string[] | null;
  reason: string;
}
