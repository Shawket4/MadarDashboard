/* eslint-disable */
// @ts-nocheck
import type { MixPick } from './mixPick';

export interface MixSlot {
  name: string;
  picks: MixPick[];
  /**
     * `null` for parts whose slot was deleted since.
     * @nullable
     */
  slot_id?: string | null;
}
