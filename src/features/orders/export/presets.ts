import type { LucideIcon } from "lucide-react";
import { Bike, ClipboardCheck, Leaf, Receipt, SlidersHorizontal } from "lucide-react";
import type { ExportOrdersParams } from "@/data/api/generated/models";
import type { Grain, PresetId } from "./types";

export interface PresetSpec {
  id: PresetId;
  i18nKey: string;
  description: string;
  icon: LucideIcon;
  grains: Grain[];
  filterOverrides: Partial<ExportOrdersParams>;
}

export const PRESETS: PresetSpec[] = [
  {
    id: "accountant_daily",
    i18nKey: "ordersExport.presets.accountantDaily.label",
    description: "ordersExport.presets.accountantDaily.desc",
    grains: ["order"],
    filterOverrides: { status: "completed" },
    icon: Receipt,
  },
  {
    id: "talabat_reconcile",
    i18nKey: "ordersExport.presets.talabatReconcile.label",
    description: "ordersExport.presets.talabatReconcile.desc",
    grains: ["order"],
    filterOverrides: { payment_method: "talabat_online,talabat_cash" },
    icon: Bike,
  },
  {
    id: "shift_handoff",
    i18nKey: "ordersExport.presets.shiftHandoff.label",
    description: "ordersExport.presets.shiftHandoff.desc",
    grains: ["order", "payment"],
    filterOverrides: {},
    icon: ClipboardCheck,
  },
  {
    id: "ingredient_consumption",
    i18nKey: "ordersExport.presets.ingredientConsumption.label",
    description: "ordersExport.presets.ingredientConsumption.desc",
    grains: ["deduction"],
    filterOverrides: { status: "completed" },
    icon: Leaf,
  },
  {
    id: "custom",
    i18nKey: "ordersExport.presets.custom.label",
    description: "ordersExport.presets.custom.desc",
    grains: ["order"],
    filterOverrides: {},
    icon: SlidersHorizontal,
  },
];
