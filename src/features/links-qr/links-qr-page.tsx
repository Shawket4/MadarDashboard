/**
 * Settings › Links & QR codes: the shop's addresses and every code that opens
 * them, on one page. It replaced two (2026-11-06): Settings › Links page and
 * Settings › QR codes. Their old addresses redirect here (`/settings/links`,
 * `/settings/qr` and the older `/qr`), the QR ones straight to the codes.
 *
 * Three sections, in the order a shop sets them up:
 *  1. **Links page** — the page the shop's own address opens on, and its
 *     editor (paid; shown locked on Free).
 *  2. **Menu (no prices)** — every plan.
 *  3. **QR codes** — every code, under one set of output switches (Unbranded,
 *     and under it the logo in the middle), with a live sample. The same
 *     switches sit inside every code's preview, and the "QR code" buttons in
 *     sections 1 and 2 open those same live codes.
 *
 * Every plan opens the page; each section locks what its plan lacks.
 */
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Link2, QrCode } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { SectionHeader } from "@/components/app/section-header";
import { PaneHeader } from "@/features/settings/pane-header";
import { LinksPageSection } from "@/features/links/admin/links-pane";
import { MenuDisplaySection } from "@/features/links/admin/menu-display-section";
import { QrCodesSection } from "@/features/qr/codes-section";
import { useOrgId } from "@/hooks/use-org-id";

export const LINKS_QR_SECTIONS = ["links", "menu", "codes"] as const;
export type LinksQrSection = (typeof LINKS_QR_SECTIONS)[number];

export const sectionId = (s: LinksQrSection) => `links-qr-${s}`;

/**
 * Land on the section a link asked for. The links editor above the codes
 * arrives after its read, which pushes everything under it down — so the
 * scroll waits for that read before it moves.
 */
function useScrollToSection(section: LinksQrSection | undefined, ready: boolean) {
  useEffect(() => {
    if (!section || section === "links" || !ready) return;
    const id = requestAnimationFrame(() =>
      document.getElementById(sectionId(section))?.scrollIntoView({ block: "start" }),
    );
    return () => cancelAnimationFrame(id);
  }, [section, ready]);
}

export function LinksQrPage({ section }: { section?: LinksQrSection }) {
  const { t } = useTranslation();
  const orgId = useOrgId();
  // The links section reports when it has its height (the editor after its read).
  const [linksReady, setLinksReady] = useState(false);
  const onLinksReady = useCallback(() => setLinksReady(true), []);
  useScrollToSection(section, linksReady);

  if (!orgId) {
    return <EmptyState icon={QrCode} title={t("branches.pickOrg", "Select an organization")} />;
  }

  const jumps: [LinksQrSection, string, typeof Link2][] = [
    ["links", t("linksQr.jump.links", "Links page"), Link2],
    ["menu", t("linksQr.jump.menu", "Menu (no prices)"), BookOpen],
    ["codes", t("linksQr.jump.codes", "QR codes"), QrCode],
  ];

  return (
    <div className="space-y-8" data-testid="links-qr-page">
      <div className="space-y-3">
        <PaneHeader
          title={t("linksQr.title", "Links & QR codes")}
          description={t(
            "linksQr.desc",
            "Your shop's addresses, and the codes that open them: for your bio, your tables, your counter and your posters.",
          )}
        />
        <nav aria-label={t("linksQr.jump.label", "On this page")} className="flex flex-wrap gap-2">
          {jumps.map(([s, label, Icon]) => (
            <a
              key={s}
              href={`#${sectionId(s)}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(sectionId(s))?.scrollIntoView({ block: "start", behavior: "smooth" });
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </a>
          ))}
        </nav>
      </div>

      <section id={sectionId("links")} className="scroll-mt-4">
        <LinksPageSection onReady={onLinksReady} />
      </section>

      <section id={sectionId("menu")} className="scroll-mt-4">
        <MenuDisplaySection orgId={orgId} />
      </section>

      <section id={sectionId("codes")} className="scroll-mt-4 space-y-4">
        <SectionHeader
          title={t("linksQr.codes.title", "QR codes")}
          description={t(
            "linksQr.codes.desc",
            "A code for every address: download it, print it or share it, branded or unbranded.",
          )}
        />
        <QrCodesSection orgId={orgId} />
      </section>
    </div>
  );
}
