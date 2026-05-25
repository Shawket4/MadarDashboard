/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { PublicMenuItem } from './publicMenuItem';

export interface PublicCategory {
  display_order: number;
  id: string;
  /** @nullable */
  image_url?: string | null;
  items: PublicMenuItem[];
  name: string;
}
