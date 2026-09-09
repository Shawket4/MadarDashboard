import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Languages, Moon, Sun } from "lucide-react";

import { LegalLinks } from "@/components/legal-links";

import { usePublicTheme } from "./use-public-theme";

/**
 * The identity a shop may put on a public page.
 *
 * Structurally what `loyalty/brand.ts` resolves, declared here so the shell does
 * not import a feature — ordering and reservations are separately built bundles
 * and neither may reach into the other.
 */
export interface ShellBrand {
  orgName: string;
  logoUrl: string | null;
  background: string;
  /**
   * Whether the palette above is the SHOP's or Madar's.
   *
   * Not a colour decision — the colours arrive already resolved, and a shop off
   * the tier is handed Madar's palette server-side. It only decides how loudly
   * Madar signs the footer: see `MadarFooter`. Absent means "we were not told",
   * which signs at full volume.
   */
  ownBranding?: boolean;
}

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
 * A wash of the shop's colour behind the fold, so the page reads as theirs
 * before anything is scrolled. Decorative, at an opacity that cannot move any
 * text off its own contrast.
 *
 * Exported because the ordering flow frames itself with `StepShell` rather than
 * `StorefrontShell` — it needs the progress bar and the step chrome — and two
 * implementations of "the shop's colour" would drift apart the first time
 * either was touched.
 */
export function BrandWash({ brand }: { brand?: ShellBrand | null }) {
  if (!brand) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-64"
      style={{
        background: `linear-gradient(to bottom, ${brand.background}, transparent)`,
        opacity: 0.14,
      }}
    />
  );
}

/**
 * The shop's mark and name, as the header wears them.
 *
 * The logo sits on a white plate: it is a shop's own artwork on a page whose
 * ground follows the READER's light/dark preference, and a dark mark on a dark
 * header is a mark nobody can see.
 */
export function BrandMark({
  brand,
  /** Layout of the mark inside its header slot. Fills the bar by default. */
  className = "min-w-0 flex-1",
}: {
  brand: ShellBrand;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {brand.logoUrl ? (
        <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white p-1 shadow-sm">
          <img src={brand.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
        </span>
      ) : (
        <span aria-hidden className="size-9 shrink-0" />
      )}
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{brand.orgName}</span>
    </div>
  );
}

/**
 * Madar's signature, on every public page at every tier.
 *
 * The mark and "powered by" NEVER leave — that is the deal, and a shop can look
 * like itself on top of our name rather than instead of it. What `ownBranding`
 * changes is only the VOLUME: on a page a shop is paying to make its own, the
 * signature steps back to a smaller mark and drops the copyright line, because
 * two brands shouting at the same size is a page that belongs to neither. Off
 * the tier the page IS Madar's, and it signs at full size.
 */
export function MadarFooter({ brand }: { brand?: ShellBrand | null }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const quiet = brand?.ownBranding === true;

  return (
    <footer className="mt-12 flex flex-col items-center gap-2 border-t border-border/60 pt-6 text-center">
      <img
        src={lang.startsWith("ar") ? "/madar_ar.svg" : "/madar.svg"}
        alt={t("app.name")}
        className={
          quiet
            ? "h-4 opacity-60 dark:brightness-0 dark:invert"
            : "h-6 opacity-80 dark:brightness-0 dark:invert"
        }
      />
      <p className={quiet ? "text-[11px] text-muted-foreground/80" : "text-xs text-muted-foreground"}>
        {t("order.footer.poweredBy")}
      </p>
      {quiet ? null : (
        <p className="text-[11px] text-muted-foreground/70">
          {t("order.footer.rights", {
            year: new Date().getFullYear(),
            name: t("app.name"),
            defaultValue: "© {{year}} {{name}}. All rights reserved.",
          })}
        </p>
      )}
      <LegalLinks className="mt-1" />
    </footer>
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
export function StorefrontShell({
  children,
  brand,
}: {
  children: ReactNode;
  /**
   * Whose page this is.
   *
   * Given one, the header wears the shop's mark and name and the page takes a
   * wash of its colour. The palette arrives ALREADY RESOLVED — the branding
   * tier is applied server-side, and a shop off the tier is handed Madar's own
   * colours — so nothing here branches on whether it was paid for. The FOOTER
   * keeps the Madar mark and "powered by" either way; `brand.ownBranding` only
   * sets how loudly it signs.
   */
  brand?: ShellBrand | null;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const toggleLang = () => void i18n.changeLanguage(lang.startsWith("ar") ? "en" : "ar");
  const mode = usePublicTheme((s) => s.mode);
  const toggleTheme = usePublicTheme((s) => s.toggle);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background text-foreground">
      <BrandWash brand={brand} />

      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[480px] items-center gap-2 px-4 py-3">
          {brand ? (
            <BrandMark brand={brand} />
          ) : (
            <>
              <span aria-hidden className="size-9 shrink-0" />
              <span aria-hidden className="flex-1" />
            </>
          )}
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
        <MadarFooter brand={brand} />
      </main>
    </div>
  );
}
