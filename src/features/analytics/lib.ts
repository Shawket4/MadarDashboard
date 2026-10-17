export type MethodMap = Record<string, number>;

/** Bilingual display name for a report row (translations are `{ ar?: string }`). */
export const tName = (name: string, translations: unknown, lang: string): string => {
  if (lang === "ar") {
    const ar = (translations as { ar?: string } | null | undefined)?.ar;
    if (ar) return ar;
  }
  return name;
};

export type Granularity = "peak_hours" | "peak_days" | "daily" | "monthly";
export const GRANULARITIES: Granularity[] = ["peak_hours", "peak_days", "daily", "monthly"];

/** A report period; either end may be open (the scope bar's preset). */
export type Range = { from?: string; to?: string };
