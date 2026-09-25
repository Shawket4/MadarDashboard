/* eslint-disable */
// @ts-nocheck
import type { MixSlot } from './mixSlot';

/**
 * What customers picked in each slot of one combo.
 */
export interface ComboMix {
  combo_id: string;
  from: string;
  slots: MixSlot[];
  to: string;
}
