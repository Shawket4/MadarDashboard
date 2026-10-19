import { useTranslation } from "react-i18next";
import { Check, Store } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { Link } from "@/components/app/link";
import { Page, PageHeader } from "@/components/app/page";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetOrg, useListCategories } from "@/data/api/generated/api";
import type { Readiness, ReadinessCheck } from "@/data/api/generated/models";
import { keepScopeWith } from "@/data/scope/list-search";
import { FoodicsImportButton } from "@/features/menu-import/foodics-import-button";
import { useOrgId } from "@/hooks/use-org-id";
import { fmtDate } from "@/lib/format";
import { Reveal, Stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { AppTile, FAMILY } from "./apps";
import { advice, blocking, leftToDo, stageOf, type Stage } from "./checks";
import { CheckRow, useCheckCopy } from "./check-row";
import { ConnectTabletButton } from "./connect-tablet-dialog";
import { useReadiness } from "./queries";

/**
 * Setup: can this shop sell yet, and what exactly stops it. Everything on it is
 * the server's readiness answer; each row links to the real page that fixes
 * it. It is where signup lands, and after the first sale it stays as the
 * shop's health page (the home card points here while anything blocks).
 */
export function SetupPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const q = useReadiness(orgId);
  const org = useGetOrg(orgId ?? "", { query: { enabled: !!orgId } });
  const stage = stageOf(q.data);

  return (
    <Page width="reading">
      <PageHeader
        title={stage === "live" ? t("setup.healthTitle", "Shop health") : t("setup.title", "Set up your shop")}
        subtitle={
          stage === "live"
            ? t("setup.healthSubtitle", "What still reads wrong on the till, and what's worth doing next.")
            : t("setup.subtitle", "Everything a cashier needs to ring up the first sale, checked against your shop as it is now.")
        }
      />
      {q.isError ? (
        <ErrorState onRetry={() => void q.refetch()} retrying={q.isFetching} />
      ) : !q.data ? (
        <div className="space-y-4" aria-busy>
          <Skeleton className="h-52 rounded-2xl" />
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-[4.5rem] rounded-xl" />
          ))}
        </div>
      ) : stage === "none" ? (
        <EmptyState
          icon={Store}
          title={t("setup.noPos.title", "Nothing to set up for the till")}
          description={t("setup.noPos.body", "This organisation doesn't sell with Madar POS. Dawam has its own set-up under Staff.")}
          action={
            <Button asChild variant="outline">
              <Link to="/staff/setup" search={keepScopeWith({}) as never}>
                {t("setup.noPos.cta", "Open Staff set-up")}
              </Link>
            </Button>
          }
        />
      ) : (
        <SetupBody r={q.data} stage={stage} shopName={org.data?.name ?? ""} refresh={() => void q.refetch()} />
      )}
    </Page>
  );
}

function SetupBody({ r, stage, shopName, refresh }: { r: Readiness; stage: Stage; shopName: string; refresh: () => void }) {
  const { t } = useTranslation();
  const must = blocking(r);
  const worth = advice(r);
  return (
    <div className="space-y-8">
      <Hero r={r} stage={stage} shopName={shopName} />
      <section aria-labelledby="setup-sell" className="space-y-3">
        <h2 id="setup-sell" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t("setup.sellHeading", "To start selling")}
        </h2>
        <Stagger asChild>
          <ul className="space-y-2">
            {must.map((c) => (
              <CheckRow key={c.key} check={c} action={rowAction(c, r, refresh)} />
            ))}
          </ul>
        </Stagger>
      </section>
      {worth.length > 0 ? (
        <section aria-labelledby="setup-worth" className="space-y-3">
          <h2 id="setup-worth" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t("setup.worthHeading", "Worth doing")}
          </h2>
          <ul className="space-y-2">
            {worth.filter((c) => !c.ok).map((c) => (
              <CheckRow key={c.key} check={c} />
            ))}
          </ul>
          <AlreadyFine checks={worth.filter((c) => c.ok)} />
        </section>
      ) : null}
    </div>
  );
}

/** Advice that is already fine, as one quiet line: worth knowing, not worth a row each. */
function AlreadyFine({ checks }: { checks: ReadinessCheck[] }) {
  const { t, i18n } = useTranslation();
  const copy = useCheckCopy();
  if (checks.length === 0) return null;
  const names = new Intl.ListFormat(i18n.resolvedLanguage ?? "en", { type: "conjunction" }).format(checks.map((c) => copy.title(c.key)));
  return (
    <p className="flex items-start gap-2 px-1 text-sm text-muted-foreground text-pretty">
      <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-[color-mix(in_oklab,var(--color-success)_55%,var(--color-foreground))]" />
      {t("setup.alreadyFine", { names, defaultValue: "Already fine: {{names}}." })}
    </p>
  );
}

/** The two checks whose fix starts here rather than on another page. */
function rowAction(c: ReadinessCheck, r: Readiness, refresh: () => void) {
  if (c.ok) return undefined;
  if (c.key === "tablet") return <ConnectTabletButton check={c} />;
  if (c.key === "menu") return <MenuStarts r={r} refresh={refresh} />;
  return undefined;
}

/** An empty menu: bring it from Foodics, or build it on the menu page. */
function MenuStarts({ r, refresh }: { r: Readiness; refresh: () => void }) {
  const { t } = useTranslation();
  const orgId = useOrgId() ?? "";
  const categories = useListCategories({ org_id: orgId }, { query: { enabled: !!orgId } });
  // An item outside any category still counts as a menu to replace.
  const loose = r.checks.find((c) => c.key === "items_no_category")?.count ?? 0;
  const live = { categories: categories.data?.length ?? 0, items: loose };
  return (
    <>
      {categories.data ? <FoodicsImportButton orgId={orgId} live={live} refresh={refresh} /> : null}
      <Button asChild size="sm" variant="outline">
        <Link to="/menu/items" search={keepScopeWith({}) as never}>
          {t("setup.checks.menu.action")}
        </Link>
      </Button>
    </>
  );
}

/**
 * The page's opening: a welcome while there is setting up to do, "ready to
 * sell" once nothing blocks, "live" after the first sale. Each shows the app
 * family, the till first: the apps are how a shop actually sells.
 */
function Hero({ r, stage, shopName }: { r: Readiness; stage: Stage; shopName: string }) {
  const { t } = useTranslation();
  const left = leftToDo(r);
  const must = blocking(r);
  const shop = shopName || t("setup.hero.yourShop", "Your shop");
  const eyebrow =
    stage === "setup" ? t("setup.hero.welcome", "Welcome to Madar") : stage === "ready" ? t("setup.hero.readyEyebrow", "Ready to sell") : t("setup.hero.liveEyebrow", "Live");
  const title =
    stage === "setup"
      ? t("setup.hero.setupTitle", { shop, defaultValue: "{{shop}}, let's get you selling." })
      : stage === "ready"
        ? t("setup.hero.readyTitle", { shop, defaultValue: "{{shop}} is ready to sell." })
        : t("setup.hero.liveTitle", { shop, defaultValue: "{{shop}} is live." });
  const body =
    stage === "setup"
      ? t("setup.hero.setupBody", { count: left, defaultValue: "{{count}} things stand between you and your first sale. Each one ticks itself off as soon as it's done." })
      : stage === "ready"
        ? t("setup.hero.readyBody", "Ring up a first order on the tablet and you're live. The rest of the family is here when you need it.")
        : t("setup.hero.liveBody", {
            date: fmtDate(r.first_order_at),
            defaultValue: "First sale on {{date}}. Everything below is advice.",
          });

  return (
    <Reveal register="brand" replayKey={stage}>
      <section
        aria-labelledby="setup-hero"
        className="relative overflow-hidden rounded-2xl bg-sidebar p-6 text-sidebar-foreground ring-1 ring-sidebar-border sm:p-8"
      >
        {/* The orbit motif of the sign-in panel, quietly behind the words. */}
        <svg aria-hidden viewBox="0 0 400 400" className="pointer-events-none absolute -end-24 -top-24 size-80 text-sidebar-foreground/[0.07]">
          <circle cx="200" cy="200" r="120" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="200" cy="200" r="170" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="320" cy="200" r="7" fill="currentColor" />
          <circle cx="80" cy="290" r="5" fill="currentColor" />
        </svg>
        <div className="relative space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wide text-[var(--madar-teal-light)] uppercase">{eyebrow}</p>
            <h2 id="setup-hero" className="font-serif text-2xl font-bold leading-tight text-balance sm:text-3xl">
              {title}
            </h2>
            <p className="max-w-prose text-sm leading-relaxed text-sidebar-muted text-pretty">{body}</p>
          </div>
          {stage !== "live" ? <Pips checks={must} /> : null}
          <Stagger register="brand" className="grid gap-2 sm:grid-cols-2">
            {FAMILY.map((app) => (
              <AppTile
                key={app}
                app={app}
                size="lg"
                lead={app === "cashier" && stage === "setup" ? t("apps.startHere", "Start here: put it on your tablet") : undefined}
              />
            ))}
          </Stagger>
        </div>
      </section>
    </Reveal>
  );
}

/** How far along, as one segment per blocking check (never a percentage). */
function Pips({ checks }: { checks: ReadinessCheck[] }) {
  const { t } = useTranslation();
  const copy = useCheckCopy();
  const done = checks.filter((c) => c.ok).length;
  return (
    <div>
      <p className="sr-only">{t("setup.progress", { done, total: checks.length, defaultValue: "{{done}} of {{total}} done" })}</p>
      <ol aria-hidden className="flex gap-1.5">
        {checks.map((c) => (
          <li
            key={c.key}
            title={copy.title(c.key)}
            className={cn("h-1.5 flex-1 rounded-full transition-colors duration-base", c.ok ? "bg-[var(--madar-teal-light)]" : "bg-sidebar-foreground/15")}
          />
        ))}
      </ol>
    </div>
  );
}
