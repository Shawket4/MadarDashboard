/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { PreviewAddonInput } from './previewAddonInput';

export interface PreviewRecipeRequest {
  addons: PreviewAddonInput[];
  menu_item_id: string;
  optional_field_ids: string[];
  /** @nullable */
  size_label?: string | null;
}
