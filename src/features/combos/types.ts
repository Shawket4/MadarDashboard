/**
 * The combos/deals wire shapes: the Orval models, re-exported under the names
 * the screens use, plus the few literal unions the spec leaves as `string`.
 */
import type { ChannelToggles } from "@/data/api/generated/models";

export type {
  BundlesReport,
  BundlesReportParams,
  BundlesRow as BundlesReportRow,
  ChannelOverride,
  ChannelToggles,
  Combo,
  ComboChoiceWrite,
  ComboEconomics,
  ComboEconomicsRequest,
  ComboMix,
  ComboSettings,
  ComboSettingsWrite,
  ComboSlotWrite,
  ComboSummary,
  ComboWarning,
  ComboWrite,
  DealPoolEntry,
  DealRule,
  DealWrite,
  ListCombosParams,
  OrderDeal,
  PaginatedCombos as ComboPage,
  SaleWindow,
} from "@/data/api/generated/models";

export type ComboChannel = keyof ChannelToggles & ("pos" | "qr" | "online" | "delivery");
export const COMBO_CHANNELS: readonly ComboChannel[] = ["pos", "qr", "online", "delivery"] as const;

export type BundleKind = "combo" | "deal";

/** `PUT /menu-items/{id}/meal` (C14); null unlinks. */
export type MealTarget = { combo_id: string; slot_id: string } | null;

/** §3.2: the combo/deal fields on every `OrderFull.items[]` line. */
export type ComboLineFields = Pick<
  import("@/data/api/generated/models").OrderItem,
  "line_kind" | "combo_line_id" | "combo_slot_id" | "combo_slot_name" | "combo_slot_name_translations" | "combo_unit_price" | "combo_share" | "combo_surcharge" | "deal_minor"
>;

/** The Arabic name out of a `*_translations` map (typed `unknown` values on the wire). */
export const arOf = (tr: unknown): string => {
  const v = tr && typeof tr === "object" ? (tr as Record<string, unknown>).ar : undefined;
  return typeof v === "string" ? v : "";
};
