/* eslint-disable */
// @ts-nocheck
import type { MenuDisplayBranch } from './menuDisplayBranch';
import type { MenuDisplayMenu } from './menuDisplayMenu';
import type { PublicBrand } from './publicBrand';

/**
 * Everything the menu-without-prices page shows, in one request.
 */
export interface PublicMenuDisplay {
  branch: MenuDisplayBranch;
  /**
     * The shop's header, with the branding tier already applied (a shop off
     * the tier wears Madar's colours under its own name).
     */
  brand: PublicBrand;
  menu: MenuDisplayMenu;
  /** @nullable */
  title_ar?: string | null;
  /** @nullable */
  title_en?: string | null;
}
