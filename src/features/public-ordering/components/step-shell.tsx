import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { ArrowLeft, Languages, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { easeOut } from "@/lib/motion";
import i18n from "@/i18n";

import type { Step } from "../types";
import { useOrderTheme } from "../use-order-theme";

const PROGRESS_STEPS: Step[] = ["branch", "channel", "location", "menu", "checkout"];

interface StepShellProps {
  step: Step;
  /** When the location step is skipped (in-mall), keep the dot row honest. */
  showLocationDot: boolean;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: ReactNode;
  /** Optional sticky footer (e.g. "view cart" bar). */
  footer?: ReactNode;
}

/**
 * The shared mobile-first frame for every step: a centered ~480px column with a
 * compact header (back, title, language toggle), an animated progress rail, and
 * an optional sticky footer. The card itself fades/slides in per-step.
 */
export function StepShell({
  step,
  showLocationDot,
  title,
  subtitle,
  onBack,
  children,
  footer,
}: StepShellProps) {
  const { t } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const toggleLang = () => void i18n.changeLanguage(lang.startsWith("ar") ? "en" : "ar");
  const mode = useOrderTheme((s) => s.mode);
  const toggleTheme = useOrderTheme((s) => s.toggle);

  const dots = PROGRESS_STEPS.filter((s) => s !== "location" || showLocationDot);
  const activeIdx = dots.indexOf(step);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background text-foreground">
      {/* Ambient brand glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-gradient-to-b from-brand/10 to-transparent"
      />

      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[480px] items-center gap-2 px-4 py-3">
          {onBack ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onBack}
              aria-label={t("common.back")}
            >
              <ArrowLeft className="size-4 rtl:rotate-180" />
            </Button>
          ) : (
            <span aria-hidden className="size-8 shrink-0" />
          )}
          <p className="flex-1 truncate text-sm font-semibold">{t("order.title")}</p>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            aria-label={t("order.theme")}
          >
            {mode === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleLang}
            aria-label={t("order.language")}
          >
            <Languages className="size-4" />
          </Button>
        </div>

        {activeIdx >= 0 && (
          <div className="mx-auto flex w-full max-w-[480px] gap-1.5 px-4 pb-2.5">
            {dots.map((s, i) => (
              <span
                key={s}
                className="relative h-1 flex-1 overflow-hidden rounded-full bg-muted"
              >
                <motion.span
                  className={cn("absolute inset-0 rounded-full bg-brand")}
                  initial={false}
                  animate={{ scaleX: i <= activeIdx ? 1 : 0 }}
                  style={{ originX: lang.startsWith("ar") ? 1 : 0 }}
                  transition={easeOut}
                />
              </span>
            ))}
          </div>
        )}
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pb-28 pt-5">
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex-1">{children}</div>

        <footer className="mt-10 flex flex-col items-center gap-2 border-t border-border/60 pt-6 text-center">
          <img
            src={lang.startsWith("ar") ? "/sufrix_ar.svg" : "/sufrix.svg"}
            alt={t("app.name")}
            className="h-6 opacity-80 dark:brightness-0 dark:invert"
          />
          <p className="text-xs text-muted-foreground">
            {t("order.footer.poweredBy")}
          </p>
          <p className="text-[11px] text-muted-foreground/70">
            {t("order.footer.rights", {
              year: new Date().getFullYear(),
              name: t("app.name"),
            })}
          </p>
        </footer>
      </main>

      {footer && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-background/90 backdrop-blur-md">
          <div className="mx-auto w-full max-w-[480px] px-4 py-3">{footer}</div>
        </div>
      )}
    </div>
  );
}
