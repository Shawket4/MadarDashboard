/**
 * The output switches above the codes, with a live sample beside them.
 *
 * Nothing on the page has been generated when someone first flips Unbranded,
 * so without a sample the switch would appear to do nothing. The sample is the
 * shop's main code — its links page, or on Free the menu without prices —
 * rendered small (150 DPI is plenty for a thumbnail) and re-rendered on every
 * flip. Pressing it opens the real code at the chosen resolution, with
 * Download, Print and Share.
 */
import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { orgLinksQr } from "@/data/api/generated/api";
import { useHasFeature } from "@/hooks/use-plan";
import { cn } from "@/lib/utils";

import { useLiveQr } from "./live";
import { QrOutputControls } from "./output-controls";
import type { QrRenderParams } from "./output";
import { missingLogo, useQrDialog } from "./qr-dialog";

/** The resolution of the thumbnail only; downloads use the chosen DPI. */
const SAMPLE_DPI = 150;

export function QrOutputPanel({ orgId }: { orgId: string }) {
  const { t } = useTranslation();
  const hasBranding = useHasFeature("branding");
  const id = hasBranding ? "org_links" : "org_menu_display";
  const fetch = (p: QrRenderParams) =>
    orgLinksQr(orgId, hasBranding ? p : { ...p, target: "menu_display" }, {});
  const title = hasBranding
    ? t("links.editor.qrTitle", "Links page code")
    : t("menuDisplay.editor.qrTitle", "Menu (no prices) code");

  const sample = useLiveQr({ id, scope: [orgId], fetch, enabled: !!orgId, override: { dpi: SAMPLE_DPI } });
  const full = useQrDialog({ id, scope: [orgId], fetch, title });

  return (
    <Card className="py-0" data-testid="qr-output-panel">
      <CardContent className="grid gap-5 p-4 sm:grid-cols-[minmax(0,1fr)_9.5rem]">
        <div className="min-w-0 space-y-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold">{t("qr.output.title", "How your codes come out")}</h3>
            <p className="text-xs text-muted-foreground">
              {t(
                "qr.output.hint",
                "Every code on this page follows these switches, and so does every download and print. Remembered on this device.",
              )}
            </p>
          </div>
          <QrOutputControls noLogo={missingLogo(sample)} />
        </div>

        {/* First on a phone, so the code changes in sight of the switch. */}
        {sample.data ? (
          <div className="order-first flex flex-col items-center gap-1.5 sm:order-none">
            <button
              type="button"
              onClick={full.show}
              disabled={full.loading}
              className="relative block w-32 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              aria-label={t("qr.output.openSample", "Open this code")}
            >
              <span className={cn("block rounded border bg-white p-1 transition-opacity duration-fast", sample.isFetching && "opacity-50")}>
                <img
                  src={sample.data.qr_data_url}
                  alt={t("qr.imageAlt", "QR code for {{title}}", { title })}
                  data-testid="qr-sample"
                  data-shape={sample.shape}
                  className="mx-auto max-h-44 w-full cursor-zoom-in object-contain"
                />
              </span>
              {sample.isFetching || full.loading ? (
                <span className="absolute inset-0 grid place-items-center">
                  <Spinner icon={RefreshCw} className="size-5" />
                </span>
              ) : null}
            </button>
            <p className="text-center text-[11px] text-muted-foreground">
              {t("qr.output.preview", "Preview: changes as you switch")}
            </p>
          </div>
        ) : null}
      </CardContent>
      {full.dialog}
    </Card>
  );
}
