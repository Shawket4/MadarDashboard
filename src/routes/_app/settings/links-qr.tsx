import { createFileRoute } from "@tanstack/react-router";
import { LINKS_QR_SECTIONS, LinksQrPage, type LinksQrSection } from "@/features/links-qr/links-qr-page";

/**
 * Settings › Links & QR codes. `?section=menu|codes` lands on that section
 * (the old QR pages redirect here with `section=codes`).
 */
export const Route = createFileRoute("/_app/settings/links-qr")({
  validateSearch: (s: Record<string, unknown>): { section?: LinksQrSection } => ({
    section: LINKS_QR_SECTIONS.includes(s.section as LinksQrSection) ? (s.section as LinksQrSection) : undefined,
  }),
  component: function LinksQrRoute() {
    const { section } = Route.useSearch();
    return <LinksQrPage section={section} />;
  },
});
