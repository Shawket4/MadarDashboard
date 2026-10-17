export const APP_TZ = "Africa/Cairo";
export const DEFAULT_CURRENCY = "EGP";
export const DEFAULT_LOCALE_EN = "en-GB";
export const DEFAULT_LOCALE_AR = "ar-EG";

export const LS_KEYS = {
  token: "madar.token",
  auth: "madar.auth",
  app: "madar.app",
  theme: "madar.theme",
} as const;

export const PAYMENT_METHODS = [
  "cash",
  "card",
  "digital_wallet",
  "mixed",
  "talabat_online",
  "talabat_cash",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Theme-aware payment swatches. Values reference --payment-* tokens defined in
// src/styles/globals.css (both :root and .dark), so they recolor in dark mode.
// Consumed directly as `fill` / `background`, so CSS var strings are sufficient.
export const PAYMENT_COLORS: Record<PaymentMethod, string> = {
  cash: "var(--payment-cash)",
  card: "var(--payment-card)",
  digital_wallet: "var(--payment-digital-wallet)",
  mixed: "var(--payment-mixed)",
  talabat_online: "var(--payment-talabat-online)",
  talabat_cash: "var(--payment-talabat-cash)",
};

export const ORDER_STATUSES = ["completed", "voided"] as const;

