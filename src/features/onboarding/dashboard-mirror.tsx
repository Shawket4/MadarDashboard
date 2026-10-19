import { useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Coffee,
  CreditCard,
  Lock,
  PlusCircle,
  Sparkles,
  Sprout,
  Store,
  Tags,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnimatedNumber, DURATION, EASE_NAME, recipes, Reveal, sec, useGsap } from "@/lib/motion";
import { stepApplies } from "./config";
import type { OnboardingStep } from "@/data/api/generated/models";
import type { StatAccent } from "@/components/app/stat-card";

/* The right pane: a faithful, compact preview of the real dashboard whose tiles
 * light up from the org's actual setup data as the wizard progresses. Driven
 * entirely by the onboarding status (per-step counts + recipe coverage), so it
 * never lies — what you see is what you've built. "Professional but playful":
 * counts spring up, tiles pop from locked to live, the cost ring fills, and the
 * sales tile draws on the first order. All collapses to static under
 * prefers-reduced-motion. */

interface TileSpec {
  statusKey: string;
  labelKey: string;
  labelFallback: string;
  icon: LucideIcon;
  accent: StatAccent;
}

const TILES: TileSpec[] = [
  { statusKey: "branch", labelKey: "onboarding.mirror.branches", labelFallback: "Branches", icon: Building2, accent: "primary" },
  { statusKey: "payment_methods", labelKey: "onboarding.mirror.payments", labelFallback: "Payment methods", icon: CreditCard, accent: "info" },
  { statusKey: "categories", labelKey: "onboarding.mirror.categories", labelFallback: "Categories", icon: Tags, accent: "brand" },
  { statusKey: "menu_items", labelKey: "onboarding.mirror.items", labelFallback: "Menu items", icon: Coffee, accent: "brand" },
  { statusKey: "ingredients", labelKey: "onboarding.mirror.ingredients", labelFallback: "Ingredients", icon: Sprout, accent: "success" },
  { statusKey: "addons", labelKey: "onboarding.mirror.addons", labelFallback: "Add-ons", icon: PlusCircle, accent: "warning" },
  { statusKey: "team", labelKey: "onboarding.mirror.team", labelFallback: "Team", icon: Users, accent: "info" },
];

const ACCENT_CHIP: Record<StatAccent, string> = {
  neutral: "bg-secondary text-foreground",
  brand: "bg-brand/10 text-brand",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  destructive: "bg-destructive/10 text-destructive",
};

function MirrorTile({ spec }: { spec: { tile: TileSpec; step?: OnboardingStep } }) {
  const { t } = useTranslation();
  const { tile, step } = spec;
  const Icon = tile.icon;
  const live = !!step?.done;
  const count = step?.count ?? 0;

  if (!live) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border/70 bg-muted/30 p-4 text-muted-foreground">
        <Lock className="size-4" aria-hidden="true" />
        <span className="text-xs font-medium">{t(tile.labelKey, tile.labelFallback)}</span>
        <span className="text-2xl font-semibold text-muted-foreground/50">—</span>
      </div>
    );
  }

  return (
    <Reveal recipe={recipes.pop}>
      <Card className="gap-2 p-4 shadow-sm ring-1 ring-brand/10">
        <span className={cn("grid size-8 place-items-center rounded-lg", ACCENT_CHIP[tile.accent])}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="text-xs font-medium text-muted-foreground">{t(tile.labelKey, tile.labelFallback)}</span>
        <span className="text-2xl font-semibold">
          <AnimatedNumber value={count} format={(n) => String(Math.round(n))} duration={DURATION.count} />
        </span>
      </Card>
    </Reveal>
  );
}

/** Recipe cost-coverage ring (0..1) — animates its fill toward the live ratio. */
function CoverageRing({ ratio }: { ratio: number }) {
  const { t } = useTranslation();
  const ring = useRef<SVGCircleElement>(null);
  /** Where the fill was drawn to last, so a change fills on from there. */
  const drawn = useRef<number | null>(null);
  const size = 76;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio));
  const offset = c * (1 - clamped);
  const pct = Math.round(clamped * 100);

  // React renders the true fill; GSAP draws it on from empty (or from the last
  // fill) over the count duration, beside the tiles' count-ups.
  useGsap(
    (gsap, { reduced }) => {
      const el = ring.current;
      const from = drawn.current ?? c;
      drawn.current = offset;
      if (!el || reduced || from === offset) return;
      gsap.fromTo(el, { strokeDashoffset: from }, { strokeDashoffset: offset, duration: sec(DURATION.count), ease: EASE_NAME.out, clearProps: "strokeDashoffset" });
      return () => {
        drawn.current = parseFloat(String(gsap.getProperty(el, "strokeDashoffset")));
      };
    },
    [offset],
  );

  return (
    <Card className="flex-row items-center gap-4 p-4 shadow-sm">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90 rtl:rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted" />
        <circle
          ref={ring}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-brand"
        />
      </svg>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{t("onboarding.mirror.coverage", "Recipe cost coverage")}</p>
        <p className="text-xs text-muted-foreground">{t("onboarding.mirror.coverageHint", "Add recipes to know every item's margin.")}</p>
        <p className="pt-1 text-lg font-semibold tabular">{pct}%</p>
      </div>
    </Card>
  );
}

/** The go-live tile: locked until the first order, then draws a celebratory chart. */
function SalesTile({ done }: { done: boolean }) {
  const { t } = useTranslation();
  const bars = [0.4, 0.65, 0.5, 0.8, 0.55, 0.7, 0.45];

  if (!done) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/30 p-4 text-muted-foreground">
        <Lock className="size-4 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-xs font-medium">{t("onboarding.mirror.sales", "Today's sales")}</p>
          <p className="text-xs text-muted-foreground/70">{t("onboarding.mirror.salesLocked", "Unlocks with your first order")}</p>
        </div>
      </div>
    );
  }

  return (
    <Reveal recipe={recipes.pop}>
      <Card className="gap-3 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{t("onboarding.mirror.sales", "Today's sales")}</span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
            <Sparkles className="size-3.5" aria-hidden="true" /> {t("onboarding.mirror.firstSale", "First sale in!")}
          </span>
        </div>
        <div className="flex h-16 items-end gap-1.5">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-sm bg-brand/70" style={{ height: `${Math.round(h * 100)}%` }} />
          ))}
        </div>
      </Card>
    </Reveal>
  );
}

interface Props {
  byKey: Map<string, OnboardingStep>;
  /** The org's plan: a Free shop has no ingredients tile and no recipe-cost ring. */
  plan?: string | null;
  recipeCoverage: number;
  orgName?: string | null;
  orgLogo?: string | null;
}

export function DashboardMirror({ byKey, plan, recipeCoverage, orgName, orgLogo }: Props) {
  const { t } = useTranslation();
  const profileDone = byKey.get("org_profile")?.done;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Faux dashboard header — reflects the café identity step. */}
      <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-5 py-4">
        {orgLogo ? (
          <img src={orgLogo} alt="" className="size-9 rounded-lg object-cover" />
        ) : (
          <span className={cn("grid size-9 place-items-center rounded-lg", profileDone ? "bg-brand/10 text-brand" : "bg-secondary text-muted-foreground")}>
            <Store className="size-5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{orgName?.trim() || t("onboarding.mirror.yourCafe", "Your café")}</p>
          <p className="text-xs text-muted-foreground">{t("onboarding.mirror.dashboard", "Dashboard")}</p>
        </div>
        <span className="ms-auto text-xs text-muted-foreground">{t("onboarding.mirror.preview", "Live preview")}</span>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TILES.filter((tile) => stepApplies(tile.statusKey, plan)).map((tile) => (
            <MirrorTile key={tile.statusKey} spec={{ tile, step: byKey.get(tile.statusKey) }} />
          ))}
        </div>
        {stepApplies("recipes", plan) ? <CoverageRing ratio={recipeCoverage} /> : null}
        <SalesTile done={!!byKey.get("first_order")?.done} />
      </div>
    </div>
  );
}
