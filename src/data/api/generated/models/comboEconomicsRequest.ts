/* eslint-disable */
// @ts-nocheck
import type { ComboWrite } from './comboWrite';

/**
 * `POST /combos/economics`: a draft, priced for a branch (or the org).
 */
export type ComboEconomicsRequest = ComboWrite & ({
  /** @nullable */
  branch_id?: string | null;
});
