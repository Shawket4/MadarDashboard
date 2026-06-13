import { Banknote, CreditCard, Gift, Landmark, Link as LinkIcon, PieChart, QrCode, Receipt, Smartphone, Star, Store, Truck, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { queryClient } from "@/data/api/query";
import type { OrgPaymentMethod } from "@/data/api/generated/models";

export const invalidatePaymentMethods = () =>
  queryClient.invalidateQueries({
    predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/payment-methods"),
  });

/** Selectable icons for a payment method. */
export const PM_ICONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "money", label: "Cash / Money", icon: Banknote },
  { id: "credit_card", label: "Credit Card", icon: CreditCard },
  { id: "wallet", label: "Digital Wallet", icon: Wallet },
  { id: "pie_chart", label: "Mixed / Split", icon: PieChart },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "qr_code", label: "QR Code", icon: QrCode },
  { id: "bank", label: "Bank Transfer", icon: Landmark },
  { id: "gift_card", label: "Gift Card", icon: Gift },
  { id: "smartphone", label: "Mobile Pay", icon: Smartphone },
  { id: "receipt", label: "Voucher", icon: Receipt },
  { id: "store", label: "Store Credit", icon: Store },
  { id: "star", label: "Loyalty Points", icon: Star },
  { id: "link", label: "Payment Link", icon: LinkIcon },
];

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
