import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Stagger } from "@/lib/motion";
import { LegalLinks } from "@/components/legal-links";
import { cn } from "@/lib/utils";
import { currentYear } from "@shared/dates";
import { MadarWordmark } from "@/components/brand/madar-wordmark";
import { BrandShowcase, useDesktop } from "./brand-showcase";

/**
 * The signed-out frame, shared by sign-in and sign-up so a visitor moving
 * between them sees the same page change one thing.
 *
 * Wide screens: the brand panel (the chrome's ink in both themes) beside the
 * form column. The panel's lockup, footer and width are fixed; its middle is
 * the page's own (`panel`, or the title by default).
 *
 * The showcase (the family on its orbit) sits in the panel (`showcase:
 * "panel"`, sign-in) or in an ink band above the form at every width
 * (`"above"`, sign-up). Below the panel's breakpoint it is always in the band,
 * so a phone sees the same picture as a desktop.
 */
export function AuthShell({
  title,
  subtitle,
  panel,
  panelFooter,
  showcase = "panel",
  align = "center",
  crossLink,
  children,
}: {
  /** The form column's heading; the panel repeats it unless `panel` is given. Omit when the page heads its own steps. */
  title?: string;
  subtitle?: string;
  /** The middle of the brand panel. */
  panel?: ReactNode;
  /** Above the copyright, at the foot of the panel. */
  panelFooter?: ReactNode;
  showcase?: "panel" | "above";
  /** "top" keeps the column anchored, so a taller step grows the page downward and nothing above it moves. */
  align?: "center" | "top";
  /** The way to the other page ("No account? Sign up free"), under the form. */
  crossLink?: ReactNode;
  children: ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const year = currentYear(i18n.resolvedLanguage ?? i18n.language ?? "en");
  const desktop = useDesktop();
  const copyright = t("common.copyright", { year, defaultValue: `© ${year} Madar` });

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="relative isolate hidden w-1/2 shrink-0 overflow-hidden border-e border-sidebar-border bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:flex lg:h-svh xl:w-[55%]">
        <Stagger register="brand" className="relative flex w-full flex-col justify-between gap-8 overflow-y-auto p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <img src="/Icon.svg" alt="" className="size-11 rounded-xl ring-1 ring-sidebar-border" draggable={false} />
            <div className="leading-tight">
              <p className="text-xl font-semibold">{t("app.name", "Madar")}</p>
              <p className="text-sm text-sidebar-muted">{t("app.tagline", "Coffee Shop Management")}</p>
            </div>
          </div>

          {panel ?? (
            <div className="max-w-md">
              <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-balance xl:text-5xl">{title}</h1>
              <p className="mt-4 text-base text-sidebar-muted">{subtitle}</p>
            </div>
          )}

          {showcase === "panel" && <BrandShowcase />}

          <div className="space-y-3 text-xs text-sidebar-muted">
            {panelFooter}
            <p>{copyright}</p>
          </div>
        </Stagger>
      </aside>

      <main className="relative flex min-h-svh min-w-0 flex-1 flex-col px-4 pb-8 sm:px-6">
        <div className="flex h-16 shrink-0 items-center justify-end gap-1">
          <ThemeToggle />
          <LanguageToggle />
        </div>

        {/* The band, the heading, each field of a form, then the rest, one after another.
            A block marked data-own-motion choreographs its own children. */}
        <Stagger
          register="brand"
          selector=":scope > :not([data-own-motion]), :scope > form > *"
          className={cn(
            "mx-auto flex w-full max-w-md flex-1 flex-col",
            align === "center" ? "justify-center" : "pt-2 lg:pt-[5vh]",
          )}
        >
          {(showcase === "above" || !desktop) && (
            <div
              aria-hidden
              className="mb-8 overflow-hidden rounded-3xl border border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground"
            >
              <BrandShowcase size="compact" />
            </div>
          )}

          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-start">
            <MadarWordmark lang={isAr ? "ar" : "en"} title={t("app.name", "Madar")} className={cn("h-9 select-none", title && "mb-6")} />
            {title && <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>

          {children}

          {crossLink && <p className="mt-6 text-center text-sm text-muted-foreground">{crossLink}</p>}
          <p className="mt-8 text-center text-xs text-muted-foreground lg:hidden">{copyright}</p>
          <LegalLinks className="mt-2 lg:mt-8" />
        </Stagger>
      </main>
    </div>
  );
}
