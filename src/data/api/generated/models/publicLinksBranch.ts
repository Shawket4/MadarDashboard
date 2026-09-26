/* eslint-disable */
// @ts-nocheck

export interface PublicLinksBranch {
  /** @nullable */
  address?: string | null;
  /**
     * The shop's Maps link, else a search for the coordinates, else for the
     * address. `None` when the branch has none of the three.
     * @nullable
     */
  directions_url?: string | null;
  id: string;
  name: string;
  /** @nullable */
  phone?: string | null;
}
