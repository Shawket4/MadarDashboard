/**
 * The shop's links page — what `<shop>.madar-pos.cloud/` opens on.
 *
 * One address for everything a shop runs on Madar: order, the menu, the
 * rewards card, a table, its own links, its socials, where to find it. It is
 * the page an Instagram bio or a counter QR points at, so it is read on a
 * phone, usually inside an app's own browser — which is why it lives OUTSIDE
 * the loyalty bundle's in-app-browser gate (see `src/loyalty/main.tsx`).
 *
 * Nothing here is new chrome. The frame is `StorefrontShell` (the theme and
 * language toggles, the shop's favicon, Madar's footer), the socials are the
 * loyalty pages' `SocialLinks`, and the shop's colour goes through the same
 * contrast walk as every other guest page (`usePageColor`): a shop off the
 * branding tier is handed Madar's palette by the server, so the fallback is
 * Madar's teal without a branch here.
 *
 * Every button's target and every "is this on?" is the server's answer
 * (`GET /public/orgs/links`), which reads the modules' own settings. This page
 * only lays them out.
 */
import { useEffect, type CSSProperties, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Link2,
  MapPin,
  Navigation,
  Phone,
  Share2,
  ShoppingBag,
  Wallet,
} from "lucide-react";

import { usePublicOrgLinks } from "@/data/api/generated/api";
import type { PublicLinksItem } from "@/data/api/generated/models/publicLinksItem";
import type { PublicLinksBranch } from "@/data/api/generated/models/publicLinksBranch";
import { StorefrontShell, type ShellBrand } from "@/features/public-shell/storefront-shell";
import { hostSlug } from "@/features/public-shell/use-brand";
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

/**
 * Where a button goes from THIS page.
 *
 * Read on the shop's own host, a module is a path there (`/order/`), so it
 * stays on the address the customer came in on; anywhere else — a preview in
 * the dashboard, our generic host — it is the absolute address the server
 * resolved.
 */
function targetOf(item: PublicLinksItem, onShopHost: boolean): string {
  return onShopHost && item.path ? item.path : item.href;
}

export function LinksPage({ orgId }: { orgId?: string | null }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const isAr = lang.startsWith("ar");
  const slug = orgId ? null : hostSlug(typeof window === "undefined" ? "" : window.location.hostname);
  const params = orgId ? { org_id: orgId } : slug ? { slug } : undefined;
  const q = usePublicOrgLinks(params, {
    query: { enabled: !!params, staleTime: 60_000, retry: 1 },
  });
  const page = q.data;

  const accent = usePageColor(page?.brand.accent_color ?? "#0D6273");

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

  const brand: ShellBrand = {
    orgId: page.brand.org_id,
    orgName: page.brand.name,
    logoUrl: page.brand.logo_url ?? null,
    background: page.brand.background_color,
    ownBranding: page.brand.custom_branding,
  };
  const onShopHost = !!page.brand.slug && slug === page.brand.slug;
  const tagline = (isAr ? page.tagline_ar?.trim() : "") || page.tagline_en?.trim() || "";
  const [primary, ...rest] = page.items;
  const onBrand = readableOn(page.brand.foreground_color, page.brand.background_color);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: page.brand.name, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      // Dismissed, or the clipboard refused — nothing to report.
    }
  };

  return (
    <StorefrontShell brand={brand} headerMark={false}>
      <div className="flex flex-col gap-7 pb-2">
        {/* The shop: its cover (or its colour), its mark, its name. */}
        <header className="flex flex-col">
          <div
            className="relative -mx-4 -mt-5 h-36 overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-3xl"
            style={{ background: page.brand.background_color }}
          >
            {page.cover_image_url ? (
              <img
                src={page.cover_image_url}
                alt=""
                className="size-full object-cover"
                draggable={false}
              />
            ) : null}
            <button
              type="button"
              onClick={() => void share()}
              aria-label={t("links.share", "Share this page")}
              className="absolute end-3 top-3 grid size-11 place-items-center rounded-full backdrop-blur-sm transition-colors motion-reduce:transition-none"
              style={{ background: "rgba(0,0,0,0.22)", color: "#fff" }}
            >
              <Share2 className="size-5" aria-hidden />
            </button>
          </div>
          <div className="relative z-10 -mt-12 flex flex-col gap-2 px-1">
            <span
              className="grid size-24 place-items-center overflow-hidden rounded-[28px] border-4 border-background shadow-sm"
              style={{ background: page.brand.background_color }}
            >
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={page.brand.name}
                  className="size-[72%] object-contain"
                  draggable={false}
                />
              ) : (
                <span className="text-3xl font-semibold" style={{ color: onBrand }}>
                  {page.brand.name.trim().charAt(0).toUpperCase()}
                </span>
              )}
            </span>
            <h1 dir="auto" className="mt-1 font-serif text-[28px] leading-[1.15] text-balance">{page.brand.name}</h1>
            {tagline ? (
              <p className="max-w-[40ch] text-[15px] leading-relaxed text-muted-foreground">{tagline}</p>
            ) : null}
          </div>
        </header>

        {page.items.length > 0 ? (
          <nav aria-label={t("links.navLabel", { name: page.brand.name, defaultValue: "{{name}} links" })}>
            <ul className="flex flex-col gap-2.5">
              {primary ? (
                <li>
                  <LinkButton
                    item={primary}
                    href={targetOf(primary, onShopHost)}
                    primary
                    background={page.brand.background_color}
                    foreground={onBrand}
                    accent={accent}
                    loyaltyMode={page.loyalty_mode}
                  />
                </li>
              ) : null}
              {rest.map((item, i) => (
                <li key={`${item.kind}-${i}`}>
                  <LinkButton
                    item={item}
                    href={targetOf(item, onShopHost)}
                    accent={accent}
                    loyaltyMode={page.loyalty_mode}
                  />
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <SocialLinks links={page.socials} accent={accent} />

        {page.branches.length > 0 ? (
          <Section
            title={t("links.visit.title", "Visit us")}
            hint={
              page.branches.length > 1
                ? t("links.visit.count", { count: page.branches.length, defaultValue: "{{count}} branches" })
                : undefined
            }
          >
            <div className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
              {page.branches.map((b, i) => (
                <BranchRow key={b.id} branch={b} accent={accent} divider={i > 0} />
              ))}
            </div>
          </Section>
        ) : null}
      </div>
    </StorefrontShell>
  );
}

function LinkButton({
  item,
  href,
  primary = false,
  background,
  foreground,
  accent,
  loyaltyMode,
}: {
  item: PublicLinksItem;
  href: string;
  primary?: boolean;
  background?: string;
  foreground?: string;
  accent: string;
  loyaltyMode?: string | null;
}) {
  const { t, i18n } = useTranslation();
  const isAr = (i18n.resolvedLanguage ?? i18n.language ?? "en").startsWith("ar");
  const Icon = ICON[item.kind] ?? Link2;
  const custom = item.kind === "custom";
  const title = custom
    ? (isAr ? item.title_ar?.trim() : "") || item.title_en?.trim() || href
    : t(`links.module.${item.kind}.title`);
  const hint = custom ? hostOf(href) : hintOf(item, loyaltyMode, t);
  const external = custom || !href.startsWith("/");

  if (primary) {
    return (
      <a
        href={href}
        {...(custom ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="flex min-h-[72px] items-center gap-3.5 rounded-[18px] px-[18px] py-3.5 shadow-sm transition-transform active:scale-[0.99] motion-reduce:transition-none"
        style={{ background, color: foreground }}
      >
        <Icon className="size-6 shrink-0" aria-hidden />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-lg font-bold leading-6">{title}</span>
          {hint ? <span className="text-[13px] leading-[18px] opacity-80">{hint}</span> : null}
        </span>
        {custom ? (
          <ExternalLink className="size-5 shrink-0" aria-hidden />
        ) : (
          <ChevronRight className="size-5 shrink-0 rtl:rotate-180" aria-hidden />
        )}
      </a>
    );
  }

  return (
    <a
      href={href}
      {...(custom ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex min-h-[68px] items-center gap-3.5 rounded-2xl border border-border/70 bg-card px-3.5 py-3 shadow-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
    >
      <span
        className="grid size-[42px] shrink-0 place-items-center rounded-xl"
        style={custom ? undefined : { background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}
      >
        <Icon className={custom ? "size-5 text-muted-foreground" : "size-5"} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base font-semibold leading-[22px]">{title}</span>
        {hint ? <span className="truncate text-[13px] leading-[18px] text-muted-foreground">{hint}</span> : null}
      </span>
      {external && custom ? (
        <ExternalLink className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      ) : (
        <ChevronRight className="size-5 shrink-0 text-muted-foreground rtl:rotate-180" aria-hidden />
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

function BranchRow({
  branch,
  accent,
  divider,
}: {
  branch: PublicLinksBranch;
  accent: string;
  divider: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-col gap-3 p-4 ${divider ? "border-t border-border/60" : ""}`}>
      <div className="flex items-start gap-2.5">
        <MapPin className="mt-0.5 size-5 shrink-0" style={{ color: accent }} aria-hidden />
        <div className="min-w-0 flex-1">
          <p dir="auto" className="text-[15px] font-semibold leading-snug">{branch.name}</p>
          {branch.address ? (
            <p dir="auto" className="text-[13px] leading-snug text-muted-foreground">{branch.address}</p>
          ) : null}
        </div>
      </div>
      {branch.directions_url || branch.phone ? (
        <div className="flex gap-2">
          {branch.directions_url ? (
            <a
              href={branch.directions_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-muted text-sm font-semibold transition-colors hover:bg-muted/70"
            >
              <Navigation className="size-[18px]" aria-hidden />
              {t("links.visit.directions", "Directions")}
            </a>
          ) : null}
          {branch.phone ? (
            <a
              href={`tel:${branch.phone.replace(/[^\d+]/g, "")}`}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-muted text-sm font-semibold transition-colors hover:bg-muted/70"
            >
              <Phone className="size-[18px]" aria-hidden />
              {t("links.visit.call", "Call")}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
