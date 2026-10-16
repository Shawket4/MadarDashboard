import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { ChefHat, Gift, LayoutDashboard, Receipt, ShoppingBag, type LucideIcon } from "lucide-react";

import { DawamMark, MadarMark } from "@/components/brand/marks";
import { useTimeline } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** One full turn of the rings, in seconds: slow enough to read as stillness. */
const TURN_S = 160;

/** Where each part of the family rides: ring radius (% of the stage) and angle (degrees, 0 = east). */
type Body = { key: string; fallback: string; r: number; deg: number; icon?: LucideIcon };

const BODIES: Body[] = [
  { key: "till", fallback: "Till", r: 25, deg: -70, icon: Receipt },
  { key: "kitchen", fallback: "Kitchen", r: 25, deg: 110, icon: ChefHat },
  { key: "dashboard", fallback: "Dashboard", r: 37, deg: -160, icon: LayoutDashboard },
  { key: "ordering", fallback: "Ordering", r: 37, deg: 20, icon: ShoppingBag },
  { key: "rewards", fallback: "Rewards", r: 48, deg: -25, icon: Gift },
  { key: "dawam", fallback: "Dawam", r: 48, deg: 155 },
];

/**
 * The sign-in panel's picture when the 3D showcase can't or shouldn't run
 * (reduced motion, no WebGL, a slow or failed load, a lost GPU context). Madar
 * means orbit: Madar's mark at the centre, the family's parts on hairline rings
 * around it, Dawam among them with its own mark. The rings turn very slowly and
 * the labels counter-turn so they stay upright; under reduced motion everything
 * holds still. Decorative: the words on the panel carry the meaning.
 */
/** "ink": on the dark brand panel. "page": straight on the page, in either theme. */
export type ShowcaseTone = "ink" | "page";

export function Orbit2D({ className, tone = "ink" }: { className?: string; tone?: ShowcaseTone }) {
  const page = tone === "page";
  const { t } = useTranslation();
  const stage = useRef<HTMLDivElement>(null);
  // Ambient: paused off screen, still under reduced motion (useTimeline skips it).
  useTimeline(
    stage,
    (tl) => {
      tl.to("[data-orbit-turn]", { rotation: 360, duration: TURN_S, ease: "none" }, 0);
      tl.to("[data-orbit-label]", { rotation: -360, duration: TURN_S, ease: "none" }, 0);
    },
    [],
    { repeat: -1, pauseOffscreen: true, late: true },
  );
  return (
    <div ref={stage} aria-hidden="true" className={cn("relative mx-auto aspect-square w-[min(100%,28rem,50svh)]", className)}>
      <div data-orbit-turn className="absolute inset-0">
        <svg viewBox="0 0 200 200" className={cn("absolute inset-0 size-full", page ? "text-foreground/15" : "text-sidebar-foreground/10")}>
          <g fill="none" stroke="currentColor" strokeWidth="0.5">
            <circle cx="100" cy="100" r="50" />
            <circle cx="100" cy="100" r="74" />
            <circle cx="100" cy="100" r="96" />
          </g>
          <circle cx="100" cy="4" r="2.2" className="fill-brand" />
        </svg>
        {BODIES.map(({ key, fallback, r, deg, icon: Icon }) => {
          const a = (deg * Math.PI) / 180;
          return (
            <div
              key={key}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${50 + r * Math.cos(a)}%`, top: `${50 + r * Math.sin(a)}%` }}
            >
              <span
                data-orbit-label
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full border py-1.5 ps-2 pe-3 text-xs font-medium",
                  page ? "border-border bg-card text-foreground shadow-xs" : "border-sidebar-border bg-sidebar-accent",
                )}
              >
                {Icon ? <Icon className={cn("size-3.5", page ? "text-muted-foreground" : "text-sidebar-muted")} /> : <DawamMark className="h-3.5 w-auto" />}
                {t(`auth.orbit.${key}`, fallback)}
              </span>
            </div>
          );
        })}
      </div>
      <MadarMark className="absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2" />
    </div>
  );
}
