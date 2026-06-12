/* eslint-disable */
// @ts-nocheck
import type { ExportResponseIngredientCosts } from './exportResponseIngredientCosts';
import type { OrderExport } from './orderExport';
import type { OrderSummary } from './orderSummary';

export interface ExportResponse {
  data: OrderExport[];
  generated_at: string;
  ingredient_costs: ExportResponseIngredientCosts;
  summary: OrderSummary;
  total: number;
}
