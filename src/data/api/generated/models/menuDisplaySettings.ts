/* eslint-disable */
// @ts-nocheck
import type { MenuDisplayBranchOption } from './menuDisplayBranchOption';

/**
 * The editor's view.
 */
export interface MenuDisplaySettings {
  /**
     * The branch the shop picked; `None` = the default (its first branch).
     * @nullable
     */
  branch_id?: string | null;
  /** Every open branch, for the picker. */
  branches: MenuDisplayBranchOption[];
  /**
     * The branch the page shows right now (the pick, else the default).
     * `None` when the shop has no open branch.
     * @nullable
     */
  effective_branch_id?: string | null;
  enabled: boolean;
  /**
     * Where the page is: `<slug>.madar-pos.cloud/menu` on a shop's own host,
     * else the generic host's `/menu/<org id>`. `None` when no host is
     * configured on this server.
     * @nullable
     */
  public_url?: string | null;
  /** @nullable */
  title_ar?: string | null;
  /** @nullable */
  title_en?: string | null;
}
