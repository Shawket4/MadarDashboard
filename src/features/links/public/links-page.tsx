/**
 * The shop's links page — what `<shop>.madar-pos.cloud/` opens on.
 *
 * One address for everything a shop runs on Madar: order, the menu, the
 * rewards card, a table, its own links, its socials, where to find it. It is
 * the page an Instagram bio or a counter QR points at, so it is read on a
 * phone, usually inside an app's own browser — which is why it lives OUTSIDE
 * the loyalty bundle's in-app-browser gate (see `src/loyalty/main.tsx`).
 *
 * ## Layout (the owner-approved design, "Shop Links Page", as revised)
 * With a cover photo (the shop's card image, chosen in the editor) the page
 * opens on it, the controls on a scrim and the mark on a plate half over its
 * edge. With none there is NO band — a block of flat colour standing in for a
 * picture read as a placeholder — and the page opens on the controls, the
 * mark and the name. Then every button alike (no first-among-equals), rows on
 * a phone and a two-column grid of cards on a desktop; the loyalty pages'
 * "Find us" pills; and "Visit us", beside the buttons on a desktop.
 *
 * Breakpoints are CONTAINER queries (`@container`/`@3xl:`), not viewport
 * ones: the dashboard's editor renders this very component in a phone-sized
 * preview on a wide screen, and must see the phone layout there.
 *
 * ## Rooted in the guest pages
 * `MadarFooter` (Madar's signature at the tier's volume), the shop's favicon
 * (`useShopFavicon`), the storefront theme (`usePublicTheme`), the shared
 * `SocialLinks`, `AssetImage` for the mark (on a plate — the card's rule), and
 * the page-accent contrast walk (`usePageColor`). A shop off the branding tier
 * is handed Madar's palette by the server, so the fallback needs no branch.
 * Every button's target and every "is this on?" is the server's answer
 * (`GET /public/orgs/links`); this page only lays them out.
 */
import { useEffect, useState, type CSSProperties, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  ExternalLink,
  Languages,
  Link2,
  MapPin,
  Moon,
  Navigation,
  Phone,
  Share2,
  ShoppingBag,
  Sun,
  Wallet,
} from "lucide-react";

import { AssetImage } from "@/components/app/asset-image";
import { usePublicOrgLinks } from "@/data/api/generated/api";
import type { PublicLinksItem } from "@/data/api/generated/models/publicLinksItem";
import type { PublicLinksBranch } from "@/data/api/generated/models/publicLinksBranch";
import { HeaderIcon, MadarFooter, type ShellBrand } from "@/features/public-shell/storefront-shell";
import { hostSlug } from "@/features/public-shell/use-brand";
import { useShopFavicon } from "@/features/public-shell/use-favicon";
import { useBrandSkin } from "@/features/public-shell/use-brand-skin";
import { usePublicTheme } from "@/features/public-shell/use-public-theme";
import { PageNotice, PageSkeleton, usePageColor } from "@/features/loyalty/public/page-shell";
import { SocialLinks } from "@/features/loyalty/public/social-links";
import { readableOn } from "@/features/loyalty/shared/brand";

type Glyph = ComponentType<{ className?: string; style?: CSSProperties; "aria-hidden"?: boolean }>;

const ICON: Record<string, Glyph> = {
  order: ShoppingBag,
  menu: BookOpen,
  rewards: Wallet,
  book: CalendarDays,
  custom: Link2,
};

/** Madar's own teal — only ever reached when the server sent no colour at all. */
const MADAR_TEAL = "#0D6273";

/**
 * Where a button goes from THIS page: a path on the shop's own host (so the
 * customer stays on the address they came in on), else the absolute address
 * the server resolved — the dashboard's preview, our generic hosts.
 */
function targetOf(item: PublicLinksItem, onShopHost: boolean): string {
  return onShopHost && item.path ? item.path : item.href;
}

export function LinksPage({ orgId }: { orgId?: string | null }) {
  const { t } = useTranslation();
  const slug = orgId ? null : hostSlug(typeof window === "undefined" ? "" : window.location.hostname);
  const params = orgId ? { org_id: orgId } : slug ? { slug } : undefined;
  const q = usePublicOrgLinks(params, {
    query: { enabled: !!params, staleTime: 60_000, retry: 1 },
  });
  const page = q.data;
  // The icons and tints take the shop's MAIN colour, walked to legibility on
  // this page. Its `accent_color` is the card's label colour — chosen to read
  // ON the brand ground, so it is often a pale tint of it (Drops: pale pink),
  // which walked to AA on paper comes out a dead grey-brown.
  const accent = usePageColor(page?.brand.background_color || MADAR_TEAL);

  useShopFavicon({ orgId: page?.brand.org_id ?? orgId ?? null, slug });
  useBrandSkin(page?.brand.background_color);
  // The tab is the shop's — but not inside the dashboard's preview, which
  // passes the org and must leave the dashboard's own title alone.
  useEffect(() => {
    if (page && !orgId) document.title = page.brand.name;
  }, [page, orgId]);

  if (q.isPending && params) return <PageSkeleton />;
  if (!page) {
    return (
      <PageNotice
        title={t("links.error.title", "This page isn't available")}
        body={t("links.error.body", "Check the address, or try again in a moment.")}
        onRetry={params ? () => void q.refetch() : undefined}
      />
    );
  }

  const bandBg = page.brand.background_color || MADAR_TEAL;
  const bandFg = readableOn(page.brand.foreground_color || "#FFFFFF", bandBg);
  const shell: ShellBrand = {
    orgId: page.brand.org_id,
    orgName: page.brand.name,
    logoUrl: page.brand.logo_url ?? null,
    background: bandBg,
    ownBranding: page.brand.custom_branding,
  };
  const onShopHost = !!page.brand.slug && slug === page.brand.slug;
  const coverUrl = page.cover_image_url ?? null;
  const items = page.items;

  return (
    <div className="@container relative flex min-h-[100dvh] flex-col bg-background text-foreground">
      {/* The band is the shop's PHOTO (its card image, as the cover). With
          none, there is no band at all — a block of flat colour standing in
          for a picture read as a placeholder — and the page opens on the
          controls, the mark and the name. */}
      {coverUrl ? (
        <Cover coverUrl={coverUrl} shareTitle={page.brand.name} />
      ) : (
        <div className="mx-auto flex w-full max-w-[480px] justify-end px-5 pt-4 @3xl:max-w-[1040px] @3xl:px-8 @3xl:pt-6">
          <Controls shareTitle={page.brand.name} />
        </div>
      )}

      <main className="relative z-10 mx-auto flex w-full max-w-[480px] flex-1 flex-col px-5 @3xl:max-w-[1040px] @3xl:px-8">
        <Identity
          name={page.brand.name}
          tagline={page.tagline_en ?? null}
          taglineAr={page.tagline_ar ?? null}
          logoUrl={shell.logoUrl}
          plate={bandBg}
          initialColor={bandFg}
          overlap={!!coverUrl}
        />

        <div className="mt-7 grid gap-7 @3xl:mt-10 @3xl:grid-cols-[minmax(0,1fr)_360px] @3xl:items-start @3xl:gap-8">
          <div className="flex flex-col gap-7">
            {page.items.length > 0 ? (
              <nav aria-label={t("links.navLabel", { name: page.brand.name, defaultValue: "{{name}} links" })}>
                {/* Every button alike — one list, no first-among-equals. */}
                <ul className="grid gap-3 @3xl:grid-cols-2">
                  {items.map((item, i) => {
                    // A last card with no partner spans the row as a row — a
                    // lone half-width card reads as missing one.
                    const wide = items.length % 2 === 1 && i === items.length - 1;
                    return (
                      <li key={`${item.kind}-${i}`} className={wide ? "@3xl:col-span-2" : undefined}>
                        <LinkRow
                          item={item}
                          href={targetOf(item, onShopHost)}
                          accent={accent}
                          loyaltyMode={page.loyalty_mode}
                          wide={wide}
                        />
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ) : null}

            <SocialLinks links={page.socials} accent={accent} />
          </div>

          {page.branches.length > 0 ? <VisitUs branches={page.branches} accent={accent} /> : null}
        </div>

        <div className="mt-auto pt-4">
          <MadarFooter brand={shell} />
        </div>
      </main>
    </div>
  );
}

/**
 * The shop's photo across the top — its card image, chosen as the cover in
 * the editor — with the page's controls on it over a scrim.
 */
function Cover({ coverUrl, shareTitle }: { coverUrl: string; shareTitle: string }) {
  return (
    <div className="relative h-44 w-full overflow-hidden bg-muted @3xl:h-60">
      <AssetImage legacyUrl={coverUrl} sizes="100vw" className="absolute inset-0 size-full" draggable={false} />
      {/* A scrim at the top keeps the controls legible on any photograph. */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" />
      <div className="relative mx-auto flex w-full max-w-[480px] justify-end px-4 pt-3.5 @3xl:max-w-[1040px] @3xl:px-8 @3xl:pt-5">
        <Controls shareTitle={shareTitle} />
      </div>
    </div>
  );
}

/**
 * Language, theme and share — the storefront's own header icons, on the
 * cover or on the page, the same three wherever they sit.
 */
function Controls({ shareTitle }: { shareTitle: string }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const mode = usePublicTheme((s) => s.mode);
  const toggleTheme = usePublicTheme((s) => s.toggle);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Dismissed, or the clipboard refused — nothing to report.
    }
  };

  return (
    <div className="flex gap-2">
      <HeaderIcon onClick={() => void share()} label={t("links.share", "Share this page")}>
        {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
      </HeaderIcon>
      <HeaderIcon onClick={toggleTheme} label={t("order.theme")}>
        {mode === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </HeaderIcon>
      <HeaderIcon
        onClick={() => void i18n.changeLanguage(lang.startsWith("ar") ? "en" : "ar")}
        label={t("order.language")}
      >
        <Languages className="size-4" />
      </HeaderIcon>
      <span className="sr-only" aria-live="polite">
        {copied ? t("links.copied", "Link copied") : ""}
      </span>
    </div>
  );
}

/** The mark on its plate, half over the band's edge, then the name and the line under it. */
function Identity({
  name,
  tagline,
  taglineAr,
  logoUrl,
  plate,
  initialColor,
  overlap,
}: {
  name: string;
  tagline: string | null;
  taglineAr: string | null;
  logoUrl: string | null;
  plate: string;
  initialColor: string;
  /** Under a cover the mark rides half over its edge; without one it simply opens the page. */
  overlap: boolean;
}) {
  const { i18n } = useTranslation();
  const isAr = (i18n.resolvedLanguage ?? i18n.language ?? "en").startsWith("ar");
  const line = (isAr ? taglineAr?.trim() : "") || tagline?.trim() || "";
  return (
    <header
      className={`flex flex-col gap-3.5 @3xl:flex-row @3xl:gap-6 ${
        overlap ? "-mt-12 @3xl:-mt-16 @3xl:items-start" : "mt-2 @3xl:mt-4 @3xl:items-center"
      }`}
    >
      {/* White plate, the card's rule (card-face.tsx): a shop's colours are
          derived FROM its logo, so the logo on its own colour disappears. */}
      {logoUrl ? (
        <span className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-[28px] border-4 border-background bg-white p-3 shadow-md @3xl:size-32 @3xl:rounded-[34px] @3xl:p-4">
          <AssetImage
            legacyUrl={logoUrl}
            alt={name}
            sizes="128px"
            fit="contain"
            className="max-h-full max-w-full"
            draggable={false}
          />
        </span>
      ) : (
        <span
          className="grid size-24 shrink-0 place-items-center rounded-[28px] border-4 border-background shadow-md @3xl:size-32 @3xl:rounded-[34px]"
          style={{ background: plate }}
        >
          <span className="font-serif text-4xl font-semibold" style={{ color: initialColor }}>
            {name.trim().charAt(0).toUpperCase()}
          </span>
        </span>
      )}
      {/* On a desktop the name starts BELOW the band (64 = the logo's
          overlap), so only the mark crosses the edge. */}
      <div className={`flex min-w-0 flex-col gap-1.5 ${overlap ? "@3xl:pt-[76px]" : ""}`}>
        {/* `bdi`, not dir="auto": a Latin shop name in an Arabic page keeps its
            own letter order but follows the PAGE's alignment. */}
        <h1 className="font-serif text-[30px] leading-[1.1] tracking-[-0.01em] text-balance @3xl:text-[40px]">
          <bdi>{name}</bdi>
        </h1>
        {line ? (
          <p className="max-w-[44ch] text-[15px] leading-relaxed text-muted-foreground @3xl:text-base">
            <bdi>{line}</bdi>
          </p>
        ) : null}
      </div>
    </header>
  );
}

function useItemText(item: PublicLinksItem, href: string, loyaltyMode?: string | null) {
  const { t, i18n } = useTranslation();
  const isAr = (i18n.resolvedLanguage ?? i18n.language ?? "en").startsWith("ar");
  const custom = item.kind === "custom";
  const title = custom
    ? (isAr ? item.title_ar?.trim() : "") || item.title_en?.trim() || hostOf(href)
    : t(`links.module.${item.kind}.title`);
  const hint = custom ? hostOf(href) : hintOf(item, loyaltyMode, t);
  return { title, hint, custom };
}

/** A button: a row on a phone, a card in a two-column grid on a desktop. */
function LinkRow({
  item,
  href,
  accent,
  loyaltyMode,
  wide = false,
}: {
  item: PublicLinksItem;
  href: string;
  accent: string;
  loyaltyMode?: string | null;
  /** Spans the desktop grid: stays a row rather than becoming a card. */
  wide?: boolean;
}) {
  const { title, hint, custom } = useItemText(item, href, loyaltyMode);
  const Icon = ICON[item.kind] ?? Link2;
  const card = !wide;
  return (
    <a
      href={href}
      {...(custom ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`group flex h-full min-h-[72px] items-center gap-3.5 rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${card ? "@3xl:min-h-[132px] @3xl:flex-col @3xl:items-start @3xl:justify-between @3xl:p-5" : "@3xl:min-h-[80px] @3xl:px-5"}`}
    >
      <span
        className="grid size-11 shrink-0 place-items-center rounded-xl"
        style={
          custom
            ? undefined
            : { background: `color-mix(in oklab, ${accent} 15%, transparent)`, color: accent }
        }
      >
        <Icon className={custom ? "size-5 text-muted-foreground" : "size-5"} aria-hidden />
      </span>
      <span className={`flex min-w-0 flex-1 flex-col ${card ? "@3xl:flex-none" : ""}`}>
        <span className="truncate text-base font-semibold leading-6 @3xl:text-[17px]">{title}</span>
        {hint ? (
          <span className="line-clamp-2 text-[13px] leading-5 text-muted-foreground @3xl:text-sm">{hint}</span>
        ) : null}
      </span>
      {custom ? (
        <ExternalLink className={`size-5 shrink-0 text-muted-foreground ${card ? "@3xl:hidden" : ""}`} aria-hidden />
      ) : (
        <ChevronRight className={`size-5 shrink-0 text-muted-foreground rtl:rotate-180 ${card ? "@3xl:hidden" : ""}`} aria-hidden />
      )}
    </a>
  );
}

/** One line under a module's title — what it is here, from the server's facts. */
function hintOf(
  item: PublicLinksItem,
  loyaltyMode: string | null | undefined,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  switch (item.kind) {
    case "order": {
      const ch = item.channels
        .map((c) => t(`links.channel.${c}`, { defaultValue: "" }))
        .filter(Boolean);
      return ch.length ? ch.join(" · ") : t("links.module.order.hint");
    }
    case "book":
      return item.branch_names.length === 1
        ? t("links.module.book.one", { branch: item.branch_names[0] })
        : t("links.module.book.hint");
    case "rewards":
      return loyaltyMode === "points"
        ? t("links.module.rewards.points")
        : t("links.module.rewards.visits");
    case "menu":
      return t("links.module.menu.hint");
    default:
      return "";
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Where to find the shop: one card, one block per branch. */
function VisitUs({ branches, accent }: { branches: PublicLinksBranch[]; accent: string }) {
  const { t } = useTranslation();
  return (
    <section
      aria-labelledby="visit-us"
      className="overflow-hidden rounded-[20px] border border-border/70 bg-card shadow-sm"
    >
      <div className="flex items-baseline justify-between gap-3 px-5 pb-1 pt-4">
        <h2 id="visit-us" className="text-[17px] font-semibold">
          {t("links.visit.title", "Visit us")}
        </h2>
        {branches.length > 1 ? (
          <span className="text-[13px] text-muted-foreground">
            {t("links.visit.count", { count: branches.length, defaultValue: "{{count}} branches" })}
          </span>
        ) : null}
      </div>
      <ul>
        {branches.map((b, i) => (
          <li key={b.id} className={`flex flex-col gap-3 px-5 py-4 ${i > 0 ? "border-t border-border/60" : ""}`}>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0" style={{ color: accent }} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-snug">
                  <bdi>{b.name}</bdi>
                </p>
                {b.address ? (
                  <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                    <bdi>{b.address}</bdi>
                  </p>
                ) : null}
              </div>
            </div>
            {b.directions_url || b.phone ? (
              <div className="flex gap-2">
                {b.directions_url ? (
                  <a
                    href={b.directions_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-muted text-sm font-semibold transition-colors hover:bg-muted/70"
                  >
                    <Navigation className="size-[18px]" aria-hidden />
                    {t("links.visit.directions", "Directions")}
                  </a>
                ) : null}
                {b.phone ? (
                  <a
                    href={`tel:${b.phone.replace(/[^\d+]/g, "")}`}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-muted text-sm font-semibold transition-colors hover:bg-muted/70"
                  >
                    <Phone className="size-[18px]" aria-hidden />
                    {t("links.visit.call", "Call")}
                  </a>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
