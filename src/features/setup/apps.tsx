import { useTranslation } from "react-i18next";
import { ArrowUpRight } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { APPS, downloadsHref, type AppKey } from "@shared/apps";
import { APP_QR } from "@shared/apps-qr";
import cashierIcon from "@shared/apps/icons/cashier.svg?url";
import kitchenIcon from "@shared/apps/icons/kitchen.svg?url";
import dashboardIcon from "@shared/apps/icons/dashboard.svg?url";
import dawamIcon from "@shared/apps/icons/dawam.svg?url";
import appStoreEn from "@shared/apps/stores/app-store-en.svg?url";
import appStoreAr from "@shared/apps/stores/app-store-ar.svg?url";
import playEn from "@shared/apps/stores/google-play-en.png?url";
import playAr from "@shared/apps/stores/google-play-ar.png?url";

/*
 * The Madar apps, in the dashboard: the same list, icons, store badges and
 * downloads pages as the marketing site (`shared/apps.ts`). Every tile opens the
 * app's card: what it is, a QR code of its downloads page (the tablet's camera
 * opens it, so nobody types a URL on a till), its store badge where it has one,
 * and every other build. Used on the Setup page and in the footer.
 */

export const APP_ICON: Record<AppKey, string> = {
  cashier: cashierIcon,
  kitchen: kitchenIcon,
  dashboard: dashboardIcon,
  dawam: dawamIcon,
};

/** The order the family is shown in: the till first, it is what a shop needs to sell. */
export const FAMILY: readonly AppKey[] = ["cashier", "kitchen", "dawam", "dashboard"];

const langOf = (l: string | undefined): "en" | "ar" => (l?.startsWith("ar") ? "ar" : "en");

function useAppCopy(app: AppKey) {
  const { t } = useTranslation();
  const names: Record<AppKey, string> = {
    cashier: t("apps.cashier.name", "Madar Cashier"),
    kitchen: t("apps.kitchen.name", "Madar Kitchen"),
    dashboard: t("apps.dashboard.name", "Madar Dashboard"),
    dawam: t("apps.dawam.name", "Dawam"),
  };
  const lines: Record<AppKey, string> = {
    cashier: t("apps.cashier.line", "The till, on iPad and iPhone."),
    kitchen: t("apps.kitchen.line", "A live screen for each station."),
    dashboard: t("apps.dashboard.line", "This dashboard, on your phone and desktop."),
    dawam: t("apps.dawam.line", "Staff clock in; the hours become payslips."),
  };
  const scan: Record<AppKey, string> = {
    cashier: t("apps.cashier.scan", "Point the tablet's camera here to install it."),
    kitchen: t("apps.kitchen.scan", "Point the kitchen tablet's camera here."),
    dashboard: t("apps.dashboard.scan", "Scan with your phone to take the dashboard with you."),
    dawam: t("apps.dawam.scan", "Your team scan this to get Dawam on their phones."),
  };
  return { name: names[app], line: lines[app], scan: scan[app] };
}

/** An app's downloads page as a QR code: black on white whatever the theme, so it always scans. */
export function AppQrCode({ app, className }: { app: AppKey; className?: string }) {
  const { t, i18n } = useTranslation();
  const qr = APP_QR[app][langOf(i18n.resolvedLanguage)];
  return (
    <svg
      viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={t("apps.qrLabel", { name: useAppCopy(app).name, defaultValue: "QR code: download {{name}}" })}
      className={cn("rounded-lg bg-white", className)}
    >
      <path d={qr.d} className="fill-black" />
    </svg>
  );
}

/** The stores' official badges (unaltered, ≥40 px tall), only where the app is listed. */
export function StoreBadges({ app, className }: { app: AppKey; className?: string }) {
  const { t, i18n } = useTranslation();
  const ar = langOf(i18n.resolvedLanguage) === "ar";
  const { name } = useAppCopy(app);
  const { appStore, googlePlay } = APPS[app];
  if (!appStore && !googlePlay) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {appStore ? (
        <a href={appStore} target="_blank" rel="noopener" className="rounded-[9px] outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <img src={ar ? appStoreAr : appStoreEn} alt={t("apps.appStoreAlt", { name, defaultValue: "Download {{name}} on the App Store" })} width={120} height={40} className="h-10 w-auto" />
        </a>
      ) : null}
      {googlePlay ? (
        <a href={googlePlay} target="_blank" rel="noopener" className="rounded-[9px] outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <img src={ar ? playAr : playEn} alt={t("apps.googlePlayAlt", { name, defaultValue: "Get {{name}} on Google Play" })} width={151} height={58} className="h-[58px] w-auto" />
        </a>
      ) : null}
    </div>
  );
}

/** One app, whole: name and line, the QR to scan, its store badge, every other build. */
export function AppCard({ app, className }: { app: AppKey; className?: string }) {
  const { t, i18n } = useTranslation();
  const { name, line, scan } = useAppCopy(app);
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-3">
        <img src={APP_ICON[app]} alt="" width={48} height={48} className="size-12 shrink-0 rounded-[22%]" />
        <div className="min-w-0">
          <p className="font-semibold leading-tight">{name}</p>
          <p className="text-sm text-muted-foreground text-pretty">{line}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <AppQrCode app={app} className="size-28 shrink-0 p-1.5 ring-1 ring-border" />
        <p className="text-sm text-muted-foreground text-pretty">{scan}</p>
      </div>
      <StoreBadges app={app} />
      <a
        href={downloadsHref(langOf(i18n.resolvedLanguage), app)}
        target="_blank"
        rel="noopener"
        className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t("apps.allDownloads", "Android, Mac and Windows downloads")}
        <ArrowUpRight aria-hidden className="size-3.5 rtl:-scale-x-100" />
        <span className="sr-only">{t("common.opensInNewTab", "(opens in a new tab)")}</span>
      </a>
    </div>
  );
}

type TileSize = "sm" | "lg";

/**
 * An app's icon as a button that opens its card. `sm` is the footer's 28 px
 * tile; `lg` the Setup page's card with the name and line beside the icon.
 */
export function AppTile({ app, size = "sm", lead, className }: { app: AppKey; size?: TileSize; lead?: string; className?: string }) {
  const { t } = useTranslation();
  const { name, line } = useAppCopy(app);
  return (
    <Popover>
      <PopoverTrigger asChild>
        {size === "sm" ? (
          <button
            type="button"
            data-press="product"
            title={name}
            aria-label={t("apps.open", { name, defaultValue: "Get {{name}}" })}
            className={cn(
              "grid size-9 place-items-center rounded-lg outline-none transition-transform duration-fast ease-out hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
          >
            <img src={APP_ICON[app]} alt="" width={28} height={28} className="size-7 rounded-[22%] shadow-sm" />
          </button>
        ) : (
          <button
            type="button"
            data-press="product"
            aria-label={t("apps.open", { name, defaultValue: "Get {{name}}" })}
            className={cn(
              "group flex w-full min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-3 text-start text-card-foreground outline-none transition-[transform,border-color] duration-fast ease-out hover:-translate-y-0.5 hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
          >
            <img src={APP_ICON[app]} alt="" width={44} height={44} className="size-11 shrink-0 rounded-[22%] shadow-sm" />
            <span className="min-w-0 flex-1">
              {lead ? <span className="block text-xs font-medium text-primary">{lead}</span> : null}
              <span className="block truncate text-sm font-semibold">{name}</span>
              <span className="block truncate text-xs text-muted-foreground">{line}</span>
            </span>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80" collisionPadding={16}>
        <AppCard app={app} />
      </PopoverContent>
    </Popover>
  );
}

/** Every app as a 28 px tile, for the footer. */
export function AppTiles({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="me-1 text-xs text-muted-foreground">{t("apps.footerLabel", "Madar on every screen")}</span>
      {FAMILY.map((app) => (
        <AppTile key={app} app={app} />
      ))}
    </div>
  );
}
