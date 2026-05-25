/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { PublicCategory } from './publicCategory';

export interface PublicMenuResponse {
  categories: PublicCategory[];
  /** @nullable */
  logo_url?: string | null;
  org_id: string;
  org_name: string;
}
