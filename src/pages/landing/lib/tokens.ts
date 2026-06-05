// Sufrix brand tokens — language-agnostic values only.
// All translatable copy lives in src/locales/{en,ar}.json.
// Color tokens are mirrored in tailwind.config.ts.

export const colors = {
  navy: "#0A2540",
  cream: "#FAF7F2",
  terracotta: "#C25B3F",
} as const;

export const meta = {
  brand: "Sufrix",
  domain: "sufrix.duckdns.org",
  year: 2026,
  totalPages: 15,
} as const;
