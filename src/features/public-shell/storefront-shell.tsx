import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Languages, Moon, Sun } from "lucide-react";

import { usePublicTheme } from "./use-public-theme";
import { LegalLinks } from "@/components/legal-links";

/** A circular, bordered header icon button — matches the ordering flow's chrome. */
export function HeaderIcon({
  onClick,
  label,
  children,
}: {
  onClick?: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition-colors hover:bg-muted motion-reduce:transition-none"
    >
      {children}
    </button>
  );
}

/**
 * Storefront brand chrome shared by every PUBLIC guest surface — ordering,
 * order tracking, and table bookings: a sticky header carrying the theme and
 * language toggles, and a footer with the Madar mark, wrapping a focused
 * mobile-width column. The page applies the storefront theme itself (see
 * `usePublicTheme`).
 *
 * This lives in `public-shell` rather than in either feature because ordering
 * and reservations are separately built, separately deployed bundles; neither
 * may import the other.
 */
export function StorefrontShell({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const toggleLang = () => void i18n.changeLanguage(lang.startsWith("ar") ? "en" : "ar");
  const mode = usePublicTheme((s) => s.mode);
  const toggleTheme = usePublicTheme((s) => s.toggle);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[480px] items-center gap-2 px-4 py-3">
          <span aria-hidden className="size-9 shrink-0" />
          <span aria-hidden className="flex-1" />
          <HeaderIcon onClick={toggleTheme} label={t("order.theme")}>
            {mode === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </HeaderIcon>
          <HeaderIcon onClick={toggleLang} label={t("order.language")}>
            <Languages className="size-4" />
          </HeaderIcon>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pb-10 pt-5">
        <div className="flex-1">{children}</div>

        <footer className="mt-12 flex flex-col items-center gap-2 border-t border-border/60 pt-6 text-center">
          <img
            src={lang.startsWith("ar") ? "/madar_ar.svg" : "/madar.svg"}
            alt={t("app.name")}
            className="h-6 opacity-80 dark:brightness-0 dark:invert"
          />
          <p className="text-xs text-muted-foreground">{t("order.footer.poweredBy")}</p>
          <p className="text-[11px] text-muted-foreground/70">
            {t("order.footer.rights", {
              year: new Date().getFullYear(),
              name: t("app.name"),
              defaultValue: "© {{year}} {{name}}. All rights reserved.",
            })}
          </p>
          <LegalLinks className="mt-1" />
        </footer>
      </main>
    </div>
  );
}
