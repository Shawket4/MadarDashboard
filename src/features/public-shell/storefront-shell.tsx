import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Languages, Moon, Sun } from "lucide-react";

import { LegalLinks } from "@/components/legal-links";

import { hostSlug } from "./use-brand";
import { useShopFavicon } from "./use-favicon";
import { usePublicTheme } from "./use-public-theme";

/**
 * The identity a shop may put on a public page.
 *
 * Structurally what `loyalty/brand.ts` resolves, declared here so the shell does
 * not import a feature — ordering and reservations are separately built bundles
 * and neither may reach into the other.
 */
export interface ShellBrand {
  /** Which shop, when the page resolved one. Names the favicon's source. */
  orgId?: string | null;
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
 * The shop's mark, as the header wears it.
 *
 * THE LOGO ALONE, with no plate and no name beside it — the same treatment the
 * dashboard's own sidebar gives a branded org. A logo already says whose shop
 * this is; setting the name next to it says it twice, and the white disc it
 * used to sit on announced itself as a component rather than as the shop.
 *
 * Free-standing means a dark mark on a dark header would vanish, which is what
 * the plate was guarding against. It is safe here because a storefront opens in
 * LIGHT and only goes dark if this visitor chose it — see `initPublicTheme`.
 * The wordmark fallback keeps its dark-mode inversion; a shop's logo does not
 * get one, because inverting a full-colour mark flattens it to a silhouette.
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
    <div className={`flex items-center ${className}`}>
      {brand.logoUrl ? (
        // `alt` carries the name the header no longer prints, so the shop is
        // still announced to a screen reader and still legible if the image
        // fails.
        <img
          src={brand.logoUrl}
          alt={brand.orgName}
          className="h-8 w-auto max-w-[60%] object-contain object-start"
          draggable={false}
        />
      ) : (
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{brand.orgName}</span>
      )}
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
/**
 * Which of Madar's products this page is.
 *
 * The signature names it. A restaurateur who sees "Reservations powered by
 * Madar" on a booking page has learnt something they might act on; "powered by
 * Madar" alone tells them nothing about what we would sell them. Recognition
 * rides on the MARK above the line, which is identical everywhere, so naming
 * the product costs nothing and buys the only thing a signature on someone
 * else's page is for.
 *
 * The default is the generic line, because a page that has not said which
 * product it is should not claim to be one — this used to be hardcoded to
 * online ordering, so a customer's loyalty card told them their stamp card was
 * powered by online ordering.
 */
export type MadarProduct = "loyalty" | "ordering" | "reservations";

export function MadarFooter({
  brand,
  product,
}: {
  brand?: ShellBrand | null;
  product?: MadarProduct;
}) {
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
        {t(
          product ? `publicShell.poweredBy.${product}` : "publicShell.poweredBy.generic",
          "Powered by Madar",
        )}
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
  product,
}: {
  children: ReactNode;
  /** Which product this page is, for the footer's signature. */
  product?: MadarProduct;
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

  // The tab, the bookmark and the home screen belong to the shop too. By org
  // id where the page resolved one, else by the hostname it was served under —
  // and on our own generic hosts, by neither, so Madar's mark stays.
  useShopFavicon({
    orgId: brand?.orgId,
    slug: hostSlug(typeof window === "undefined" ? "" : window.location.hostname),
  });

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
        <MadarFooter brand={brand} product={product} />
      </main>
    </div>
  );
}
