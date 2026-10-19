/* eslint-disable */
// @ts-nocheck
import type { BulkMenu } from './bulkMenu';
import type { BulkMode } from './bulkMode';

export interface BulkMenuRequest {
  /**
     * `replace` only: the sentence the owner typed
     * (`madar_menu::replace_sentence`, either language).
     * @nullable
     */
  confirm?: string | null;
  menu: BulkMenu;
  mode?: BulkMode;
}
