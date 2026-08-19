import { useTranslation } from "react-i18next";
import { Sparkles, Users } from "lucide-react";

import { TABLE_TONES, TABLE_TONE_STYLE, type TableTone } from "./util";

/** The glyph that names each tone — colour is never the only signal. */
const TONE_ICON: Record<TableTone, typeof Users | null> = {
  available: null,
  seated: Users,
  dirty: Sparkles,
};

/** Three-state legend: available, seated, and still needing a bus. */
export function StatusLegend() {
  const { t } = useTranslation();
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {TABLE_TONES.map((tone) => {
        const Icon = TONE_ICON[tone];
        return (
        <li key={tone} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-3 rounded-full border-2"
            style={{
              borderColor: TABLE_TONE_STYLE[tone].ring,
              background: `color-mix(in oklab, ${TABLE_TONE_STYLE[tone].fill} 18%, transparent)`,
            }}
          />
          {Icon ? (
            <Icon aria-hidden className="size-3" style={{ color: TABLE_TONE_STYLE[tone].ring }} />
          ) : null}
          {t(`floor.tone_${tone}`, TABLE_TONE_STYLE[tone].label)}
        </li>
        );
      })}
    </ul>
  );
}
