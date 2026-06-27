import { Banknote, CreditCard, Gift, Landmark, Link as LinkIcon, PieChart, QrCode, Receipt, Smartphone, Star, Store, Truck, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { queryClient } from "@/data/api/query";
import type { OrgPaymentMethod } from "@/data/api/generated/models";

export const invalidatePaymentMethods = () =>
  queryClient.invalidateQueries({
    predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/payment-methods"),
  });

/** Selectable icons for a payment method.
 *  label keys are resolved at render time via t(icon.labelKey, icon.labelFallback). */
export const PM_ICONS: { id: string; labelKey: string; labelFallback: string; icon: LucideIcon }[] = [
  { id: "money",       labelKey: "settings.pm.iconLabel.money",       labelFallback: "Cash / Money",    icon: Banknote  },
  { id: "credit_card", labelKey: "settings.pm.iconLabel.credit_card", labelFallback: "Credit Card",     icon: CreditCard },
  { id: "wallet",      labelKey: "settings.pm.iconLabel.wallet",      labelFallback: "Digital Wallet",  icon: Wallet    },
  { id: "pie_chart",   labelKey: "settings.pm.iconLabel.pie_chart",   labelFallback: "Mixed / Split",   icon: PieChart  },
  { id: "delivery",    labelKey: "settings.pm.iconLabel.delivery",    labelFallback: "Delivery",        icon: Truck     },
  { id: "qr_code",     labelKey: "settings.pm.iconLabel.qr_code",     labelFallback: "QR Code",         icon: QrCode    },
  { id: "bank",        labelKey: "settings.pm.iconLabel.bank",        labelFallback: "Bank Transfer",   icon: Landmark  },
  { id: "gift_card",   labelKey: "settings.pm.iconLabel.gift_card",   labelFallback: "Gift Card",       icon: Gift      },
  { id: "smartphone",  labelKey: "settings.pm.iconLabel.smartphone",  labelFallback: "Mobile Pay",      icon: Smartphone },
  { id: "receipt",     labelKey: "settings.pm.iconLabel.receipt",     labelFallback: "Voucher",         icon: Receipt   },
  { id: "store",       labelKey: "settings.pm.iconLabel.store",       labelFallback: "Store Credit",    icon: Store     },
  { id: "star",        labelKey: "settings.pm.iconLabel.star",        labelFallback: "Loyalty Points",  icon: Star      },
  { id: "link",        labelKey: "settings.pm.iconLabel.link",        labelFallback: "Payment Link",    icon: LinkIcon  },
];

/**
 * Selectable accent colors for a payment method, stored on the backend as hex.
 * These are user-chosen identity colors (data, not theme), so the swatch UI
 * renders each one literally via `style={{ backgroundColor: hex }}` — a color
 * picker must show its real hue, and an identity color stays constant across
 * light/dark rather than being remapped to a semantic token.
 */
export const PM_COLORS = [
  "#0F172A", "#334155", "#10B981", "#059669", "#3B82F6", "#2563EB", "#8B5CF6",
  "#7C3AED", "#F59E0B", "#D97706", "#EF4444", "#DC2626", "#EC4899", "#DB2777",
];

/** System (built-in) method names whose ID cannot be changed. */
export const SYSTEM_METHODS = ["cash", "card", "digital_wallet", "mixed", "talabat_online", "talabat_cash"];
export const isSystemMethod = (m: OrgPaymentMethod) => SYSTEM_METHODS.includes(m.name);

export const iconFor = (id: string): LucideIcon => PM_ICONS.find((i) => i.id === id)?.icon ?? Banknote;

/** Localized label, falling back to the other language then the raw name. */
export const labelOf = (m: OrgPaymentMethod, lang: string): string => {
  const tr = (m.label_translations ?? {}) as Record<string, string>;
  return tr[lang] || tr.en || tr.ar || m.name;
};
