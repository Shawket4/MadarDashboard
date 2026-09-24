/* eslint-disable */
// @ts-nocheck

export interface PlanSection {
  category_ids?: string[];
  id: string;
  is_default: boolean;
  name: string;
  /** Kitchen printers this section prints on. */
  printer_ids?: string[];
  /** Kitchen screens (device slots of kind `kitchen`) this section shows on. */
  screen_ids?: string[];
  x: number;
  y: number;
}
