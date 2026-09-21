/* eslint-disable */
// @ts-nocheck
import type { PreviewCost } from './previewCost';
import type { PreviewDeduction } from './previewDeduction';
import type { PreviewPrice } from './previewPrice';
import type { PreviewResponseDefaults } from './previewResponseDefaults';
import type { ResolveWarning } from './resolveWarning';

export interface PreviewResponse {
  cost: PreviewCost;
  deductions: PreviewDeduction[];
  /** Swap groups: group id → the option preselected by the recipe. */
  defaults: PreviewResponseDefaults;
  price: PreviewPrice;
  quantity: number;
  /**
     * The size the preview resolved (the request's, else the default size).
     * @nullable
     */
  size_label?: string | null;
  warnings: ResolveWarning[];
}
