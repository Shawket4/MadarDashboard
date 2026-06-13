export type MethodMap = Record<string, number>;

export const sumMethodMaps = (maps: Array<MethodMap | undefined>): MethodMap => {
  const out: MethodMap = {};
  for (const m of maps) for (const [k, v] of Object.entries(m ?? {})) out[k] = (out[k] ?? 0) + (Number(v) || 0);
  return out;
};

/** Bilingual display name for a report row (translations are `{ ar?: string }`). */
export const tName = (name: string, translations: unknown, lang: string): string => {
  if (lang === "ar") {
    const ar = (translations as { ar?: string } | null | undefined)?.ar;
    if (ar) return ar;
  }
  return name;
};

export type Granularity = "hourly" | "daily" | "monthly";
export const GRANULARITIES: Granularity[] = ["hourly", "daily", "monthly"];
