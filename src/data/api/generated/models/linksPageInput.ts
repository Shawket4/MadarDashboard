/* eslint-disable */
// @ts-nocheck
import type { LinksPageBranchInput } from './linksPageBranchInput';
import type { LinksPageInputSocialLinks } from './linksPageInputSocialLinks';
import type { LinksPageItem } from './linksPageItem';

/**
 * What the editor saves.
 */
export interface LinksPageInput {
  branches?: LinksPageBranchInput[];
  items: LinksPageItem[];
  show_branches?: boolean;
  show_cover?: boolean;
  /**
     * The organisation's social links — the SAME map `PATCH /orgs/{id}`
     * takes, stored in the same column, under the same closed list and
     * https rule. Omitted = unchanged.
     * @nullable
     */
  social_links?: LinksPageInputSocialLinks;
  /** @nullable */
  tagline_ar?: string | null;
  /** @nullable */
  tagline_en?: string | null;
}
