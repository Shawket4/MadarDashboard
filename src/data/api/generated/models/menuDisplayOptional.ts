/* eslint-disable */
// @ts-nocheck
import type { MenuDisplayOptionalNameTranslations } from './menuDisplayOptionalNameTranslations';

/**
 * An item's optional toggle ("Extra hot"), by name.
 */
export interface MenuDisplayOptional {
  id: string;
  name: string;
  name_translations: MenuDisplayOptionalNameTranslations;
  /**
     * Set when it only applies to one size.
     * @nullable
     */
  size_label?: string | null;
}
