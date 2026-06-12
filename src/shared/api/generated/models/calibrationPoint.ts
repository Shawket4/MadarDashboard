/* eslint-disable */
// @ts-nocheck

export interface CalibrationPoint {
  /** Classification at suggestion time: "cm" or "revenue" */
  classification_mode: string;
  decided_at: string;
  item_name: string;
  menu_item_id: string;
  predicted_delta_pct: number;
  previous_price: number;
  realized_at: string;
  realized_delta_pct: number;
  realized_price: number;
  size_label: string;
  suggested_price: number;
  suggestion_id: string;
}
