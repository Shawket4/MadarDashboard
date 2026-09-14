import { createContext, useContext, type ReactNode } from "react";
import { motion } from "motion/react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { fadeIn } from "@/lib/motion";

/**
 * Page geometry — the dashboard half of the POS spec (madar/docs/design/SPEC.md §2–3).
 *
 *  gutter ┌ Title — 28/700, centred in a 48 row ──────┐ actions ┐
 *         │ Subtitle — 14 muted, below, never moves    │         │
 *         └────────────────────────────────────────────┘         ┘
 *         below — section tabs, filters, segments
 *
 * No glyph beside the title: the sidebar already names the page. A pushed page
 * puts a back button before the title. The header is capped at the page's
 * content width and both start at the gutter: content is never centred in the
 * leftover space.
 */

export type PageWidth = "full" | "reading" | "form";

/** Max width per mode; `full` is capped only so a 4K monitor keeps line lengths sane. */
export const PAGE_WIDTH_CLASS: Record<PageWidth, string> = {
  full: "max-w-[1600px]",
  reading: "max-w-[880px]",
  form: "max-w-[560px]",
};

const PageWidthContext = createContext<PageWidth>("full");

/**
 * Set by a shell that already owns the page (Settings). Inside it a nested
 * <Page> drops its gutter and width, and a nested <PageHeader> renders as a
 * pane heading (section size, no glyph slot) so the page keeps one title.
 */
const EmbeddedContext = createContext(false);
export function EmbeddedPages({ children }: { children: ReactNode }) {
  return <EmbeddedContext.Provider value>{children}</EmbeddedContext.Provider>;
}

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
  const embedded = useContext(EmbeddedContext);
  if (embedded) {
    return (
      <div data-page-width={width} className={cn("w-full space-y-6", width !== "full" && PAGE_WIDTH_CLASS[width], className)}>
        {children}
      </div>
    );
  }
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

export type PageBack = { to: string; search?: Record<string, unknown> } | { onClick: () => void };

interface PageHeaderProps {
  title: ReactNode;
  /** Legacy name for `subtitle`. */
  description?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** A pushed page puts a back button in the leading slot. */
  back?: PageBack;
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
  below,
  className,
}: PageHeaderProps) {
  const { t } = useTranslation();
  const sectionTabs = useContext(SectionTabsContext);
  const sub = subtitle ?? description;
  const embedded = useContext(EmbeddedContext);

  if (embedded) {
    return (
      <header data-slot="page-header" data-embedded className={cn("space-y-3", className)}>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h2 className="text-lg leading-tight font-semibold tracking-[-0.01em]">{title}</h2>
            {sub ? <div className="mt-1 max-w-prose text-sm text-pretty text-muted-foreground">{sub}</div> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
        {below ? <div className="space-y-3">{below}</div> : null}
      </header>
    );
  }

  const tile = "grid size-11 shrink-0 place-items-center rounded-[10px]";
  let leading: ReactNode = null;
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
  }

  const belowRow = sectionTabs || below;

  return (
    <header data-slot="page-header" className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        {leading ? <div className="flex h-12 shrink-0 items-center">{leading}</div> : null}
        <div className="min-w-0 flex-1 basis-48">
          <div className="flex h-12 items-center">
            <h1 className="truncate text-2xl leading-tight font-bold tracking-[-0.015em] sm:text-[1.75rem]">
              {title}
            </h1>
          </div>
          {sub ? <div className="-mt-1 max-w-prose text-sm text-pretty text-muted-foreground">{sub}</div> : null}
        </div>
        {actions ? (
          <div className={cn("flex min-h-12 w-full flex-wrap items-center gap-2 sm:w-auto", leading && "ps-14 sm:ps-0")}>{actions}</div>
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
