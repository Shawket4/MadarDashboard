import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Stagger } from "@/lib/motion";
import { LegalLinks } from "@/components/legal-links";
import { currentYear } from "@shared/dates";
import { MadarWordmark } from "@/components/brand/madar-wordmark";
import { BrandShowcase } from "./brand-showcase";

/**
 * The signed-out frame: the brand panel (the chrome's ink in both themes, the
 * family on its orbit) beside a form panel. Sign-in and sign-up share it, so a
 * visitor moving between them sees the same page change one thing.
 */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  /** The form panel's heading; the brand panel repeats it. */
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const year = currentYear(i18n.resolvedLanguage ?? i18n.language ?? "en");

  return (
    <div className="flex min-h-svh bg-background">
      {/* Brand panel: the chrome's ink in both themes; the family on its orbit. */}
      <aside className="relative isolate hidden w-1/2 overflow-hidden border-e border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex xl:w-[55%]">
        <Stagger register="brand" className="relative flex w-full flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <img src="/Icon.svg" alt="" className="size-11 rounded-xl ring-1 ring-sidebar-border" draggable={false} />
            <div className="leading-tight">
              <p className="text-xl font-semibold">{t("app.name", "Madar")}</p>
              <p className="text-sm text-sidebar-muted">{t("app.tagline", "Coffee Shop Management")}</p>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-balance xl:text-5xl">{title}</h1>
            <p className="mt-4 text-base text-sidebar-muted">{subtitle}</p>
          </div>

          <div>
            <BrandShowcase />
          </div>

          <p className="text-xs text-sidebar-muted">
            {t("common.copyright", { year, defaultValue: `© ${year} Madar` })}
          </p>
        </Stagger>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="absolute end-4 top-4 flex items-center gap-1">
          <ThemeToggle />
          <LanguageToggle />
        </div>

        {/* The heading, then each field of the form, then the rest, one after another. */}
        <Stagger register="brand" selector=":scope > :not(form), :scope > form > *" className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-start">
            <MadarWordmark
              lang={isAr ? "ar" : "en"}
              title={t("app.name", "Madar")}
              className="mb-6 h-9 select-none"
            />
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}

          <p className="mt-8 text-center text-xs text-muted-foreground lg:hidden">
            {t("common.copyright", { year, defaultValue: `© ${year} Madar` })}
          </p>
          <LegalLinks className="mt-2 lg:mt-8" />
        </Stagger>
      </main>
    </div>
  );
}
