/* eslint-disable */
// @ts-nocheck
import type { LinksItemKind } from './linksItemKind';

/**
 * One button, as stored and as edited.
 */
export interface LinksPageItem {
  /**
     * Custom links only: a stable id, so the editor can tell two links with
     * the same title apart. Minted by the server when missing.
     * @nullable
     */
  id?: string | null;
  kind: LinksItemKind;
  /**
     * Custom links only. Falls back to the English title when empty.
     * @nullable
     */
  title_ar?: string | null;
  /**
     * Custom links only.
     * @nullable
     */
  title_en?: string | null;
  /**
     * Custom links only — a full `https://` address.
     * @nullable
     */
  url?: string | null;
  /** Off = kept in the list (and its place) but not shown. */
  visible?: boolean;
}
