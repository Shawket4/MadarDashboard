import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Languages, Moon, ReceiptText, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import i18n from "@/i18n";

import type { Step } from "../types";
import { usePublicTheme } from "@/features/public-shell/use-public-theme";
import {
  BrandMark,
  BrandWash,
  MadarFooter,
  type ShellBrand,
} from "@/features/public-shell/storefront-shell";

const PROGRESS_STEPS: Step[] = ["branch", "channel", "phone", "location", "menu", "checkout"];

interface StepShellProps {
  step: Step;
  /** When the location step is skipped (in-mall), keep the dot row honest. */
  showLocationDot: boolean;
  /** Serif title shown centered in the bar on flow steps. */
  title: string;
  /** Muted hint shown under the header on flow steps. */
  subtitle?: string;
  onBack?: () => void;
  /** Menu step: the branch dropdown selector rendered in the header. */
  branchSelector?: ReactNode;
  /** Menu step: search input rendered in the header on desktop. */
  headerSearch?: ReactNode;
  children: ReactNode;
  /** Wide layout for the desktop menu (roomy multi-pane). */
  wide?: boolean;
  /** Optional floating footer (e.g. the menu "view cart" pill). */
  footer?: ReactNode;
  /** When set (after phone step), shows the order history icon in the header. */
  onOpenHistory?: () => void;
  /** Number of past orders — used to badge the history icon. */
  historyCount?: number;
  /**
   * Whose shop this is.
   *
   * The ordering flow needs its own frame — a progress row, a branch chip, a
   * floating cart — so it cannot simply be a `StorefrontShell`. It wears the
   * shop's identity through the same three pieces that shell does, rather than
   * a second implementation of them.
   */
  brand?: ShellBrand | null;
}

/** A circular, white, bordered header icon button — matches the mockup chrome. */
function HeaderIcon({
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
      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {children}
    </button>
  );
}

/**
 * The shared frame for every step. Three header modes mirror the approved
 * mockups: `flow` (back · serif centered title · theme/lang · progress) for the
 * branch/channel/location/checkout steps, `menu` (branch chip · theme/lang ·
 * greeting · floating cart pill), and `bare` for the confirmation screen.
 */
export function StepShell({
  step,
  showLocationDot,
  title,
  subtitle,
  onBack,
  branchSelector,
  headerSearch,
  wide = false,
  footer,
  children,
  onOpenHistory,
  historyCount = 0,
  brand,
}: StepShellProps) {
  const { t } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const toggleLang = () => void i18n.changeLanguage(lang.startsWith("ar") ? "en" : "ar");
  const mode = usePublicTheme((s) => s.mode);
  const toggleTheme = usePublicTheme((s) => s.toggle);

  // Time-of-day greeting shown under the menu heading.
  const hour = new Date().getHours();
  const greet =
    hour < 12
      ? { key: "order.menu.greetMorning", fallback: "Good morning" }
      : hour < 18
        ? { key: "order.menu.greetAfternoon", fallback: "Good afternoon" }
        : { key: "order.menu.greetEvening", fallback: "Good evening" };

  const variant = step === "menu" ? "menu" : step === "done" ? "bare" : "flow";

  const dots = PROGRESS_STEPS.filter((s) => s !== "location" || showLocationDot);
  const activeIdx = dots.indexOf(step);
  const showProgress = variant === "flow" && activeIdx >= 0;

  // The menu step breathes out to a multi-pane width on desktop; every other
  // step stays a focused mobile-width column, centered on large screens too.
  const widthClass = wide ? "max-w-[1920px]" : "max-w-[480px]";
  // The wide menu fills the viewport with comfortable side padding; other steps
  // keep the snug mobile gutter.
  const padClass = wide ? "px-4 lg:px-8" : "px-4";

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background text-foreground">
      <BrandWash brand={brand} />

      {variant !== "bare" && (
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
          <div className={cn("mx-auto flex w-full items-center gap-2 py-3", widthClass, padClass)}>
            {variant === "menu" ? (
              // The branch chip already says which of the shop's rooms you are
              // in; only when it is hidden (a locked QR branch) does the mark
              // take its place, so the header never names the shop twice.
              branchSelector ??
              (brand ? (
                // Shrink-to-fit here: the wide menu's centred search owns the
                // middle of the bar, and a mark that grew into it would take
                // the search off the desktop layout.
                <BrandMark brand={brand} className="min-w-0 max-w-[14rem]" />
              ) : (
                <span aria-hidden className="size-9 shrink-0" />
              ))
            ) : onBack ? (
              <HeaderIcon onClick={onBack} label={t("common.back")}>
                <ArrowLeft className="size-4 rtl:rotate-180" />
              </HeaderIcon>
            ) : (
              <span aria-hidden className="size-9 shrink-0" />
            )}

            {variant === "flow" ? (
              // Title moves into the content as a bold display heading, so the
              // bar has room for the shop's mark between the back button and
              // the toggles.
              brand ? (
                <BrandMark brand={brand} />
              ) : (
                <span aria-hidden className="flex-1" />
              )
            ) : variant === "menu" ? (
              <div className="flex flex-1 justify-center px-2">
                {headerSearch && <div className="hidden w-full max-w-md xl:block">{headerSearch}</div>}
              </div>
            ) : (
              <span className="flex-1" />
            )}

            {onOpenHistory && (
              <div className="relative">
                <HeaderIcon onClick={onOpenHistory} label={t("order.history.open", "My orders")}>
                  <ReceiptText className="size-4" />
                </HeaderIcon>
                {historyCount > 0 && (
                  <span className="pointer-events-none absolute -end-1 -top-1 flex size-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-brand-foreground tabular-nums">
                    {historyCount > 9 ? "9+" : historyCount}
                  </span>
                )}
              </div>
            )}
            <HeaderIcon onClick={toggleTheme} label={t("order.theme")}>
              {mode === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </HeaderIcon>
            <HeaderIcon onClick={toggleLang} label={t("order.language")}>
              <Languages className="size-4" />
            </HeaderIcon>
          </div>

          {showProgress && (
            <div className={cn("mx-auto flex w-full gap-1.5 pb-3", widthClass, padClass)}>
              {dots.map((s, i) => (
                <span
                  key={s}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i <= activeIdx ? "bg-brand" : "bg-muted",
                  )}
                />
              ))}
            </div>
          )}
        </header>
      )}

      <main
        className={cn(
          "relative z-10 mx-auto flex w-full flex-1 flex-col pt-5",
          widthClass,
          padClass,
          footer ? "pb-28" : "pb-10",
          wide && "xl:pb-10",
        )}
      >
        {variant === "menu" && (
          <div className="mb-4 lg:hidden">
            <h1 className="font-serif text-2xl font-semibold leading-tight tracking-tight">
              {t("order.menu.greeting", "What are you craving?")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t(greet.key, greet.fallback)}</p>
          </div>
        )}
        {variant === "flow" && (
          <div className="mb-5">
            <h1 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-balance sm:text-[1.75rem]">
              {title}
            </h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        )}

        <div className="flex-1">{children}</div>

        {variant !== "bare" && <MadarFooter brand={brand} />}
      </main>

      {footer && (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-20 flex justify-center pb-4",
            padClass,
            wide && "xl:hidden",
          )}
        >
          <div className={cn("w-full", widthClass)}>{footer}</div>
        </div>
      )}
    </div>
  );
}
