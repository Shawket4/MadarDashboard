/* eslint-disable */
// @ts-nocheck
import type { LinksModuleStatus } from './linksModuleStatus';
import type { LinksPageBranch } from './linksPageBranch';
import type { LinksPageItem } from './linksPageItem';
import type { LinksPageSettingsSocialLinks } from './linksPageSettingsSocialLinks';

/**
 * The editor's view: what is saved, plus what it is built from.
 */
export interface LinksPageSettings {
  /** Every active branch, with its settings. */
  branches: LinksPageBranch[];
  /**
     * The shop's card image, which the page uses as its cover.
     * @nullable
     */
  card_image_url?: string | null;
  /** Whether the shop wears its own colours on the page. */
  custom_branding: boolean;
  items: LinksPageItem[];
  /** @nullable */
  loyalty_mode?: string | null;
  modules: LinksModuleStatus[];
  /**
     * Where the page is: the root of the shop's own host, for a shop on the
     * branding tier with a slug. `None` otherwise — there is no generic links
     * host.
     * @nullable
     */
  public_url?: string | null;
  show_branches: boolean;
  show_cover: boolean;
  /** `organizations.social_links`, as stored. */
  social_links: LinksPageSettingsSocialLinks;
  /** @nullable */
  tagline_ar?: string | null;
  /** @nullable */
  tagline_en?: string | null;
}
