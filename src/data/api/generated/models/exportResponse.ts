/* eslint-disable */
// @ts-nocheck
import type { ExportResponseIngredientCosts } from './exportResponseIngredientCosts';
import type { OrderExport } from './orderExport';
import type { OrderSummary } from './orderSummary';

/**
 * The export's body. Documented here and written by `export_orders` as a
 * stream in exactly this shape (`ExportTail` is everything after `data`).
 */
export interface ExportResponse {
  data: OrderExport[];
  generated_at: string;
  ingredient_costs: ExportResponseIngredientCosts;
  summary: OrderSummary;
  total: number;
}
