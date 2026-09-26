/**
 * The shop's links page — what `<shop>.madar-pos.cloud/` opens on.
 *
 * One address for everything a shop runs on Madar: order, the menu, the
 * rewards card, a table, its own links, its socials, where to find it. It is
 * the page an Instagram bio or a counter QR points at, so it is read on a
 * phone, usually inside an app's own browser — which is why it lives OUTSIDE
 * the loyalty bundle's in-app-browser gate (see `src/loyalty/main.tsx`).
 *
 * ## The shape: a link-in-bio page, not a website
 * One centred column at every width, on a page washed in the shop's colour:
 * the mark, the name, the line under it, then the buttons — one stack, every
 * button the same width, the first in the shop's colour — then "Find us" and
 * "Visit us" as the guest pages' own sections. It is the shape people already
 * know from a bio link, and it is the same page on a phone and on a desktop:
 * a wide screen gets more of the shop's colour around the column, not a
 * dashboard of cards. (The banner-and-grid version before this one read as a
 * website with nothing in it.)
 *
 * ## Rooted in the guest pages
 * The header controls are `HeaderIcon`s, the sections are the loyalty pages'
 * `Section`, the socials are their `SocialLinks` pills, the footer is
 * `MadarFooter`, the shop's favicon and theme are the storefront's, the mark
 * sits on a white plate (the card's rule: a shop's colours are derived from
 * its logo, so the logo on its own colour disappears), and every colour goes
 * through the same contrast walk (`readableOn` / `usePageColor`). A shop off
 * the branding tier is handed Madar's palette by the server.
 *
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
import { usePublicTheme } from "@/features/public-shell/use-public-theme";
import { PageNotice, PageSkeleton, Section, usePageColor } from "@/features/loyalty/public/page-shell";
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

/** A colour pulled a quarter of the way to black, as `#rrggbb` (the contrast helpers speak hex). */
function deepen(hex: string, amount = 0.28): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * (1 - amount));
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Where a button goes from THIS page: a path on the shop's own host (so the
 * customer stays on the address they came in on), else the absolute address
 * the server resolved — the dashboard's preview, our generic hosts.
 */
function targetOf(item: PublicLinksItem, onShopHost: boolean): string {
  return onShopHost && item.path ? item.path : item.href;
}

export function LinksPage({ orgId }: { orgId?: string | null }) {
  const { t, i18n } = useTranslation();
  const isAr = (i18n.resolvedLanguage ?? i18n.language ?? "en").startsWith("ar");
  const slug = orgId ? null : hostSlug(typeof window === "undefined" ? "" : window.location.hostname);
  const params = orgId ? { org_id: orgId } : slug ? { slug } : undefined;
  const q = usePublicOrgLinks(params, {
    query: { enabled: !!params, staleTime: 60_000, retry: 1 },
  });
  const page = q.data;
  // Icons and links take the shop's MAIN colour walked to legibility on this
  // page; its `accent_color` is the card's label colour, often a pale tint.
  const accent = usePageColor(page?.brand.background_color || MADAR_TEAL);

  useShopFavicon({ orgId: page?.brand.org_id ?? orgId ?? null, slug });
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

  const brandBg = page.brand.background_color || MADAR_TEAL;
  const brandFg = readableOn(page.brand.foreground_color || "#FFFFFF", brandBg);
  // The big button is a DEEPER shade of the shop's colour: at the shop's own
  // colour it disappeared into the wash behind it. Its label is picked for it
  // by the same contrast rule, so it reads whatever the shop's colour is.
  const buttonBg = deepen(brandBg);
  const buttonFg = readableOn("#FFFFFF", buttonBg);
  const shell: ShellBrand = {
    orgId: page.brand.org_id,
    orgName: page.brand.name,
    logoUrl: page.brand.logo_url ?? null,
    background: brandBg,
    ownBranding: page.brand.custom_branding,
  };
  const onShopHost = !!page.brand.slug && slug === page.brand.slug;
  const tagline = (isAr ? page.tagline_ar?.trim() : "") || page.tagline_en?.trim() || "";

  return (
    <div className="relative isolate flex min-h-[100dvh] flex-col bg-background text-foreground">
      {/* The shop's colour, washing down the top of the page and into the
          ground — or its card image, when it chose that as the cover.
          Decorative: nothing on the page depends on it for contrast. */}
      <Wash color={brandBg} coverUrl={page.cover_image_url ?? null} />

      <TopBar shareTitle={page.brand.name} />

      <main className="relative mx-auto flex w-full max-w-[520px] flex-1 flex-col px-5 pb-8">
        <header className="flex flex-col items-center pt-2 text-center">
          <Mark name={page.brand.name} logoUrl={shell.logoUrl} plate={brandBg} ink={brandFg} />
          <h1 className="mt-5 font-serif text-[30px] leading-[1.1] tracking-[-0.01em] text-balance">
            <bdi>{page.brand.name}</bdi>
          </h1>
          {tagline ? (
            <p className="mt-2 max-w-[36ch] text-[15px] leading-relaxed text-muted-foreground">
              <bdi>{tagline}</bdi>
            </p>
          ) : null}
        </header>

        {page.items.length > 0 ? (
          <nav
            aria-label={t("links.navLabel", { name: page.brand.name, defaultValue: "{{name}} links" })}
            className="mt-8"
          >
            <ul className="flex flex-col gap-3">
              {page.items.map((item, i) => (
                <li key={`${item.kind}-${i}`}>
                  <LinkButton
                    item={item}
                    href={targetOf(item, onShopHost)}
                    primary={i === 0}
                    brandBg={buttonBg}
                    brandFg={buttonFg}
                    accent={accent}
                    loyaltyMode={page.loyalty_mode}
                  />
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="mt-10 flex flex-col gap-8">
          <SocialLinks links={page.socials} accent={accent} />
          {page.branches.length > 0 ? <VisitUs branches={page.branches} accent={accent} /> : null}
        </div>

        <MadarFooter brand={shell} />
      </main>
    </div>
  );
}

/**
 * The shop's colour down the top of the page. A photograph when the shop set
 * its card image as the cover, softened so it reads as a backdrop and not as
 * content; otherwise the colour itself, fading into the page's own ground so
 * the column below sits on paper, where text is legible by construction.
 */
function Wash({ color, coverUrl }: { color: string; coverUrl: string | null }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] overflow-hidden">
      {coverUrl ? (
        <AssetImage legacyUrl={coverUrl} sizes="100vw" className="size-full scale-110 opacity-60 blur-md" />
      ) : null}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${color} 0%, color-mix(in oklab, ${color} 55%, var(--color-background)) 45%, var(--color-background) 100%)`,
          opacity: coverUrl ? 0.75 : 1,
        }}
      />
    </div>
  );
}

/** Language, theme and share — the storefront's own header icons, nothing else. */
function TopBar({ shareTitle }: { shareTitle: string }) {
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
    <div className="relative mx-auto flex w-full max-w-[520px] items-center justify-end gap-2 px-5 pt-4">
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

/** The shop's mark, large, on the card's white plate; the initial on its colour when there is none. */
function Mark({ name, logoUrl, plate, ink }: { name: string; logoUrl: string | null; plate: string; ink: string }) {
  if (logoUrl) {
    return (
      <span className="grid size-28 place-items-center overflow-hidden rounded-[32px] bg-white p-4 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)] ring-1 ring-black/5">
        <AssetImage
          legacyUrl={logoUrl}
          alt={name}
          sizes="112px"
          fit="contain"
          className="max-h-full max-w-full"
          draggable={false}
        />
      </span>
    );
  }
  return (
    <span
      className="grid size-28 place-items-center rounded-[32px] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)] ring-1 ring-black/5"
      style={{ background: plate }}
    >
      <span className="font-serif text-5xl font-semibold" style={{ color: ink }}>
        {name.trim().charAt(0).toUpperCase()}
      </span>
    </span>
  );
}

/**
 * One button. Every button is the same shape and width — a bio page is a
 * list, and a list reads by its left edge — and the first one wears the
 * shop's colour, because it is what most visitors came for.
 */
function LinkButton({
  item,
  href,
  primary,
  brandBg,
  brandFg,
  accent,
  loyaltyMode,
}: {
  item: PublicLinksItem;
  href: string;
  primary: boolean;
  brandBg: string;
  brandFg: string;
  accent: string;
  loyaltyMode?: string | null;
}) {
  const { t, i18n } = useTranslation();
  const isAr = (i18n.resolvedLanguage ?? i18n.language ?? "en").startsWith("ar");
  const custom = item.kind === "custom";
  const title = custom
    ? (isAr ? item.title_ar?.trim() : "") || item.title_en?.trim() || hostOf(href)
    : t(`links.module.${item.kind}.title`);
  const hint = custom ? hostOf(href) : hintOf(item, loyaltyMode, t);
  const Icon = ICON[item.kind] ?? Link2;

  const skin: CSSProperties = primary ? { background: brandBg, color: brandFg } : {};
  const iconSkin: CSSProperties = primary
    ? { background: "rgba(255,255,255,0.28)", color: brandFg }
    : { background: `color-mix(in oklab, ${accent} 12%, transparent)`, color: accent };

  return (
    <a
      href={href}
      {...(custom ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      style={skin}
      className={`group flex min-h-[72px] items-center gap-3.5 rounded-[22px] p-3 pe-4 transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 active:translate-y-0 active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
        primary
          ? "shadow-[0_12px_28px_-14px_rgba(0,0,0,0.45)] hover:shadow-[0_16px_32px_-14px_rgba(0,0,0,0.5)]"
          : "border border-border/60 bg-card shadow-sm hover:shadow-md"
      }`}
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl" style={iconSkin}>
        <Icon className={custom && !primary ? "size-5 text-muted-foreground" : "size-5"} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[16px] font-semibold leading-6">{title}</span>
        {hint ? (
          <span className={`line-clamp-2 text-[13px] leading-5 ${primary ? "opacity-85" : "text-muted-foreground"}`}>
            {hint}
          </span>
        ) : null}
      </span>
      {custom ? (
        <ExternalLink className={`size-[18px] shrink-0 ${primary ? "" : "text-muted-foreground"}`} aria-hidden />
      ) : (
        <ChevronRight
          className={`size-5 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5 ${primary ? "" : "text-muted-foreground"}`}
          aria-hidden
        />
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

/** Where to find the shop, as the loyalty pages' own section: a titled card, a block per branch. */
function VisitUs({ branches, accent }: { branches: PublicLinksBranch[]; accent: string }) {
  const { t } = useTranslation();
  return (
    <Section title={t("links.visit.title", "Visit us")}>
      <ul className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        {branches.map((b, i) => (
          <li key={b.id} className={`flex flex-col gap-3 p-4 ${i > 0 ? "border-t border-border/60" : ""}`}>
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
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border/70 bg-background text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <Navigation className="size-4" style={{ color: accent }} aria-hidden />
                    {t("links.visit.directions", "Directions")}
                  </a>
                ) : null}
                {b.phone ? (
                  <a
                    href={`tel:${b.phone.replace(/[^\d+]/g, "")}`}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border/70 bg-background text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <Phone className="size-4" style={{ color: accent }} aria-hidden />
                    {t("links.visit.call", "Call")}
                  </a>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}
