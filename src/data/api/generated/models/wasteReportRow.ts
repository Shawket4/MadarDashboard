/* eslint-disable */
// @ts-nocheck

export interface WasteReportRow {
  ingredient_name: string;
  org_ingredient_id: string;
  reason: string;
  unit: string;
  waste_qty: number;
  /** @nullable */
  waste_value?: number | null;
}
