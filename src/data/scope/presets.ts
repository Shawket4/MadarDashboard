import { subDays } from "date-fns";
import { cairoDateISO, cairoNow } from "@/lib/format";

export type ScopePreset = "today" | "yesterday" | "7d" | "30d" | "mtd" | "custom";

export const SCOPE_PRESETS: Exclude<ScopePreset, "custom">[] = ["today", "yesterday", "7d", "30d", "mtd"];

export const DEFAULT_PRESET: ScopePreset = "30d";

/** Cairo-calendar [from, to] for a named preset. */
export const rangeForPreset = (preset: Exclude<ScopePreset, "custom">): { from: string; to: string } => {
  const now = cairoNow();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  switch (preset) {
    case "today":
      return { from: cairoDateISO(y, m, d), to: cairoDateISO(y, m, d, true) };
    case "yesterday": {
      const p = subDays(now, 1);
      return {
        from: cairoDateISO(p.getFullYear(), p.getMonth(), p.getDate()),
        to: cairoDateISO(p.getFullYear(), p.getMonth(), p.getDate(), true),
      };
    }
    case "7d": {
      const p = subDays(now, 6);
      return { from: cairoDateISO(p.getFullYear(), p.getMonth(), p.getDate()), to: cairoDateISO(y, m, d, true) };
    }
    case "30d": {
      const p = subDays(now, 29);
      return { from: cairoDateISO(p.getFullYear(), p.getMonth(), p.getDate()), to: cairoDateISO(y, m, d, true) };
    }
    case "mtd":
      return { from: cairoDateISO(y, m, 1), to: cairoDateISO(y, m, d, true) };
  }
};
