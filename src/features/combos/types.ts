/**
 * The combos/deals wire shapes: the Orval models, re-exported under the names
 * the screens use, plus the few literal unions the spec leaves as `string`.
 */
import type { ChannelOverride, ChannelToggles } from "@/data/api/generated/models";

export type {
  BranchChannelOverride,
  BundlesReport,
  BundlesReportParams,
  BundlesRow as BundlesReportRow,
  ChannelOverride,
  ChannelToggles,
  Combo,
  ComboChoice,
  ComboChoiceWrite,
  ComboEconomics,
  ComboEconomicsRequest,
  ComboMix,
  ComboSettings,
  ComboSettingsWrite,
  ComboSlot,
  ComboSlotWrite,
  ComboSummary,
  ComboWarning,
  ComboWrite,
  DealBranchOverride,
  DealPoolEntry,
  DealRule,
  DealWrite,
  ListCombosParams,
  MealLinkWrite,
  OrderDeal,
  PaginatedCombos as ComboPage,
  SaleWindow,
  SizeSurcharge,
} from "@/data/api/generated/models";

export type ComboChannel = keyof ChannelToggles & ("pos" | "qr" | "online" | "delivery");
export const COMBO_CHANNELS: readonly ComboChannel[] = ["pos", "qr", "online", "delivery"] as const;

/** Every channel resolved (the server fills the four; the spec marks them optional). */
export type ChannelSell = Record<ComboChannel, boolean>;
export type ChannelOverrideFull = Required<ChannelOverride>;

export type Translations = Record<string, string>;
export type ComboWarningCode = "MARGIN_BELOW_MIN" | "NO_SAVING" | "COST_UNKNOWN" | "SLOT_EMPTY_NOW" | "CHOICE_INACTIVE";
export type DealKind = "n_for_price" | "buy_get";
export type BundleKind = "combo" | "deal";

/** `PUT /menu-items/{id}/meal` (C14); null unlinks. */
export type MealTarget = { combo_id: string; slot_id: string } | null;

/** §3.2: the combo/deal fields on every `OrderFull.items[]` line. */
export type ComboLineFields = Pick<
  import("@/data/api/generated/models").OrderItem,
  "line_kind" | "combo_line_id" | "combo_slot_id" | "combo_slot_name" | "combo_unit_price" | "combo_share" | "combo_surcharge" | "deal_minor"
>;

/** The Arabic name out of a `*_translations` map (typed `unknown` values on the wire). */
export const arOf = (tr: unknown): string => {
  const v = tr && typeof tr === "object" ? (tr as Record<string, unknown>).ar : undefined;
  return typeof v === "string" ? v : "";
};
