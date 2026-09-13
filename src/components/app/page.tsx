import { createContext, createElement, useContext, type ReactNode } from "react";
import { motion } from "motion/react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { NAV, isParent } from "@/config/nav";
import { cn } from "@/lib/utils";
import { fadeIn } from "@/lib/motion";

/**
 * Page geometry — the dashboard half of the POS spec (madar/docs/design/SPEC.md §2–3).
 *
 *  gutter ┌ slot 44 ┐12┌ Title — 28/700, centred in a 48 row ──────┐ actions ┐
 *         │ ‹ | ☐   │  │ Subtitle — 14 muted, below, never moves    │         │
 *         └─────────┘  └────────────────────────────────────────────┘         ┘
 *                      below — section tabs, filters, segments
 *
 * The leading slot is ALWAYS reserved (the page's nav glyph, or a back button),
 * so the title's x is identical on every page in both directions. The header is
 * capped at the page's content width and both start at the gutter: content is
 * never centred in the leftover space.
 */

export type PageWidth = "full" | "reading" | "form";

/** Max width per mode; `full` is capped only so a 4K monitor keeps line lengths sane. */
export const PAGE_WIDTH_CLASS: Record<PageWidth, string> = {
  full: "max-w-[1600px]",
  reading: "max-w-[880px]",
  form: "max-w-[560px]",
};

const PageWidthContext = createContext<PageWidth>("full");

/** Standard page container: gutter, width mode, start-aligned, gentle fade-in. */
export function Page({
  children,
  className,
  width = "full",
}: {
  children: ReactNode;
  className?: string;
  width?: PageWidth;
}) {
  return (
    <PageWidthContext.Provider value={width}>
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeIn}
        data-page-width={width}
        className={cn("w-full space-y-6 px-4 pt-3 pb-8 sm:px-6 lg:px-8 lg:pt-4", PAGE_WIDTH_CLASS[width], className)}
      >
        {children}
      </motion.div>
    </PageWidthContext.Provider>
  );
}

// ── Section tabs (route-level sub-nav) flow into the header's `below` row ────

export interface SectionTab {
  to: string;
  label: string;
}

const SectionTabsContext = createContext<SectionTab[] | null>(null);

/** Wrap a section layout's <Outlet/>; every PageHeader inside renders the tabs in `below`. */
export function SectionTabsProvider({ tabs, children }: { tabs: SectionTab[]; children: ReactNode }) {
  return <SectionTabsContext.Provider value={tabs}>{children}</SectionTabsContext.Provider>;
}

const keepScope = (prev: Record<string, unknown>) => ({
  branchId: prev.branchId,
  preset: prev.preset,
  from: prev.from,
  to: prev.to,
});

export function SectionTabBar({ tabs }: { tabs: SectionTab[] }) {
  const { pathname } = useLocation();
  return (
    <nav className="-mb-px flex w-full overflow-x-auto border-b no-scrollbar">
      {tabs.map((tab) => {
        const active = pathname === tab.to || pathname.startsWith(`${tab.to}/`);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            search={keepScope}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex h-10 shrink-0 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 first:ps-0 motion-reduce:transition-none",
              "focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

// ── Header ──────────────────────────────────────────────────────────────────

const NAV_LEAVES = NAV.flatMap((g) => g.entries.flatMap((e) => (isParent(e) ? e.children : [e])));

/** The nav glyph for a path — the most specific nav target that owns it. */
export function navGlyphFor(pathname: string): LucideIcon | undefined {
  let best: { to: string; icon: LucideIcon } | undefined;
  for (const leaf of NAV_LEAVES) {
    const hit = leaf.to === "/" ? pathname === "/" : pathname === leaf.to || pathname.startsWith(`${leaf.to}/`);
    if (hit && (!best || leaf.to.length > best.to.length)) best = leaf;
  }
  return best?.icon;
}

export type PageBack = { to: string; search?: Record<string, unknown> } | { onClick: () => void };

interface PageHeaderProps {
  title: ReactNode;
  /** Legacy name for `subtitle`. */
  description?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** A pushed page puts a back button in the leading slot. */
  back?: PageBack;
  /** Override the leading glyph (defaults to the page's nav icon). */
  icon?: LucideIcon;
  /** Row under the title block: section tabs, filters, segments, search. */
  below?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  subtitle,
  actions,
  back,
  icon,
  below,
  className,
}: PageHeaderProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const sectionTabs = useContext(SectionTabsContext);
  const glyph = icon ?? navGlyphFor(pathname);
  const sub = subtitle ?? description;

  const tile = "grid size-11 shrink-0 place-items-center rounded-[10px]";
  let leading: ReactNode;
  if (back) {
    const cls = cn(
      tile,
      "border bg-card text-foreground transition-colors duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
    );
    const glyph = <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />;
    leading =
      "to" in back ? (
        <Link to={back.to} search={back.search ?? keepScope} className={cls} aria-label={t("common.back", "Back")}>
          {glyph}
        </Link>
      ) : (
        <button type="button" onClick={back.onClick} className={cls} aria-label={t("common.back", "Back")}>
          {glyph}
        </button>
      );
  } else {
    leading = (
      <span aria-hidden className={cn(tile, "border bg-card text-muted-foreground")} data-slot="page-glyph">
        {glyph ? createElement(glyph, { className: "size-5" }) : null}
      </span>
    );
  }

  const belowRow = sectionTabs || below;

  return (
    <header data-slot="page-header" className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <div className="flex h-12 shrink-0 items-center">{leading}</div>
        <div className="min-w-0 flex-1 basis-48">
          <div className="flex h-12 items-center">
            <h1 className="truncate text-2xl leading-tight font-bold tracking-[-0.015em] sm:text-[1.75rem]">
              {title}
            </h1>
          </div>
          {sub ? <div className="-mt-1 max-w-prose text-sm text-pretty text-muted-foreground">{sub}</div> : null}
        </div>
        {actions ? (
          <div className="flex min-h-12 w-full flex-wrap items-center gap-2 ps-14 sm:w-auto sm:ps-0">{actions}</div>
        ) : null}
      </div>
      {belowRow ? (
        <div className="space-y-3">
          {sectionTabs ? <SectionTabBar tabs={sectionTabs} /> : null}
          {below}
        </div>
      ) : null}
    </header>
  );
}

/** Content that should align with the title's text edge rather than the gutter (rare). */
export const TITLE_INSET = "ps-14";
