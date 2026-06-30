import { useTranslation } from "react-i18next";
import { PartyPopper } from "lucide-react";

import { cn } from "@/lib/utils";

/* The "you did it" moment when the café opens. The card is statically visible
 * (so it shows everywhere); the confetti is a CSS-animation bonus, hidden under
 * prefers-reduced-motion. */

const PIECES = Array.from({ length: 28 });
const COLORS = ["bg-brand", "bg-primary", "bg-success", "bg-warning"];

export function Celebration() {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 backdrop-blur-sm">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden">
        {PIECES.map((_, i) => (
          <span
            key={i}
            className={cn("onb-confetti-piece absolute -top-3 size-2 rounded-[2px]", COLORS[i % COLORS.length])}
            style={{ insetInlineStart: `${(i * 3.57) % 100}%`, animationDelay: `${(i % 7) * 140}ms` }}
          />
        ))}
      </div>
      <div className="relative flex flex-col items-center gap-4 px-6 text-center">
        <span className="grid size-20 place-items-center rounded-3xl bg-brand/10 text-brand">
          <PartyPopper className="size-10" aria-hidden="true" />
        </span>
        <h2 className="font-serif text-3xl tracking-tight text-balance">
          {t("onboarding.celebrate.title", "Your café is open! 🎉")}
        </h2>
        <p className="text-muted-foreground">{t("onboarding.celebrate.body", "Taking you to your dashboard…")}</p>
      </div>
    </div>
  );
}
