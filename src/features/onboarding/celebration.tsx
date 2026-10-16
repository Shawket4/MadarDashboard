import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { PartyPopper } from "lucide-react";

import { DURATION, EASE_NAME, recipes, Reveal, sec, useTimeline } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* The "you did it" moment when the café opens. The card is statically visible
 * (so it shows everywhere) and lands with a pop; the confetti is a GSAP bonus
 * that rests above the screen until it falls, and is hidden under
 * prefers-reduced-motion. */

const PIECES = Array.from({ length: 28 });
const COLORS = ["bg-brand", "bg-primary", "bg-success", "bg-warning"];

export function Celebration() {
  const { t } = useTranslation();
  const confetti = useRef<HTMLDivElement>(null);
  // Each piece falls the height of the screen, turning and drifting a little;
  // they leave in waves. Transform only; skipped under reduced motion.
  useTimeline(
    confetti,
    (tl, gsap) => {
      tl.to("span", {
        y: () => window.innerHeight * 1.1,
        x: gsap.utils.random(-40, 40, 1, true),
        rotation: gsap.utils.random(360, 760, 1, true),
        duration: sec(DURATION.count) * 2,
        ease: EASE_NAME.inOut,
        stagger: (i: number) => (i % 7) * 0.14,
      });
    },
    [],
    { late: true },
  );
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/85 backdrop-blur-sm">
      <div ref={confetti} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden">
        {PIECES.map((_, i) => (
          <span
            key={i}
            className={cn("absolute -top-3 size-2 rounded-[2px]", COLORS[i % COLORS.length])}
            style={{ insetInlineStart: `${(i * 3.57) % 100}%` }}
          />
        ))}
      </div>
      <Reveal recipe={recipes.pop} className="relative flex flex-col items-center gap-4 px-6 text-center">
        <span className="grid size-20 place-items-center rounded-3xl bg-brand/10 text-brand">
          <PartyPopper className="size-10" aria-hidden="true" />
        </span>
        <h2 className="font-serif text-3xl tracking-tight text-balance">
          {t("onboarding.celebrate.title", "Your café is open! 🎉")}
        </h2>
        <p className="text-muted-foreground">{t("onboarding.celebrate.body", "Taking you to your dashboard…")}</p>
      </Reveal>
    </div>
  );
}
