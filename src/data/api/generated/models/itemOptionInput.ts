/* eslint-disable */
// @ts-nocheck
import type { OptionRecipeLineInput } from './optionRecipeLineInput';

/**
 * One priced optional in the item's per-item `Options` set. `id` present ⇒ update
 * that option; absent ⇒ create a new one. `recipe` null ⇒ leave the option with no
 * recipe lines; else the replace-set of its lines.
 */
export interface ItemOptionInput {
  /** @nullable */
  id?: string | null;
  is_active?: boolean;
  name: string;
  price: number;
  /**
     * `null` = keep no recipe; else the option's replace-set of recipe lines.
     * @nullable
     */
  recipe?: OptionRecipeLineInput[] | null;
}
