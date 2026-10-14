import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { MadarWordmark } from "@/components/brand/madar-wordmark";
import { LegalLinks } from "@/components/legal-links";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";

import { CompactValue, ValuePanel } from "./value-panel";

/**
 * Sign-up's frame. Wide: the value panel beside the form (the panel first, so
 * it mirrors in Arabic). Phone: the form first, the compact panel under it.
 * The form column is top-anchored, never centred, so a taller step grows the
 * page downward and nothing above it moves.
 */
export function SignupShell({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  return (
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <ValuePanel />
      <main className="flex min-h-svh flex-col px-4 pb-8 sm:px-6">
        <header className="flex h-16 items-center justify-between gap-3">
          <MadarWordmark lang={isAr ? "ar" : "en"} title={t("app.name", "Madar")} className="h-8 w-auto select-none lg:invisible" />
          <div className="flex items-center gap-1">
            <p className="me-2 hidden text-sm text-muted-foreground sm:block">
              {t("signup.haveAccount", "Already have an account?")}{" "}
              <Link to="/login" className="inline-flex min-h-11 items-center font-medium text-foreground underline underline-offset-4">
                {t("auth.signIn", "Sign in")}
              </Link>
            </p>
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[28rem] flex-1 flex-col pt-4 lg:max-w-[30rem] lg:pt-[7vh]">
          {children}
          <CompactValue />
          <p className="mt-6 text-center text-sm text-muted-foreground sm:hidden">
            {t("signup.haveAccount", "Already have an account?")}{" "}
            <Link to="/login" className="inline-flex min-h-11 items-center font-medium text-foreground underline underline-offset-4">
              {t("auth.signIn", "Sign in")}
            </Link>
          </p>
          <LegalLinks className="mt-auto pt-8" />
        </div>
      </main>
    </div>
  );
}
