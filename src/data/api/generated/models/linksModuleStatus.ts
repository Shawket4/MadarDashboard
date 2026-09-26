/* eslint-disable */
// @ts-nocheck
import type { LinksItemKind } from './linksItemKind';

/**
 * Whether a module can be shown, and why — the editor's hint line.
 */
export interface LinksModuleStatus {
  /**
     * The switch that governs it is on somewhere. A hidden module that is
     * available is the shop's choice; an unavailable one cannot be shown.
     */
  available: boolean;
  /**
     * The branches where it is on (menu: every active branch; rewards: none,
     * the programme is the org's).
     */
  branch_names: string[];
  kind: LinksItemKind;
  /** Where it opens on the shop's own host. */
  path: string;
}
