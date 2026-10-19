/* eslint-disable */
// @ts-nocheck

/**
 * What a valid menu holds, for the preview and the server's answer.
 */
export interface BulkSummary {
  /** @minimum 0 */
  categories: number;
  /** @minimum 0 */
  groups: number;
  /** @minimum 0 */
  items: number;
  /** @minimum 0 */
  links: number;
  /** @minimum 0 */
  optionals: number;
  /** @minimum 0 */
  options: number;
  /** @minimum 0 */
  sizes: number;
}
