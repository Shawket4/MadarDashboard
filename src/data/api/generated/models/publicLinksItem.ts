/* eslint-disable */
// @ts-nocheck
import type { LinksItemKind } from './linksItemKind';

/**
 * One button on the public page, already resolved.
 */
export interface PublicLinksItem {
  /** Order / book: the branches where it is on. */
  branch_names: string[];
  /**
     * Order: the channels on anywhere — `pickup`, `delivery`, `in_mall`,
     * `umbrella`.
     */
  channels: string[];
  /**
     * Absolute. For a module: the shop's own host when it has one, else the
     * generic host. For a custom link: the shop's URL.
     */
  href: string;
  kind: LinksItemKind;
  /**
     * Modules only: the same place as a path on the shop's own host, for a
     * page being read ON that host.
     * @nullable
     */
  path?: string | null;
  /** @nullable */
  title_ar?: string | null;
  /**
     * Custom links only (a module's title is the page's own words).
     * @nullable
     */
  title_en?: string | null;
}
