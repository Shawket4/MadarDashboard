/* eslint-disable */
// @ts-nocheck

/**
 * Per-branch settings for "Visit us".
 */
export interface LinksPageBranchInput {
  branch_id: string;
  /**
     * A Google Maps (or any https) link, so Directions opens the shop's own
     * pin. Without one, Directions searches the branch's coordinates or
     * address.
     * @nullable
     */
  maps_url?: string | null;
  visible?: boolean;
}
