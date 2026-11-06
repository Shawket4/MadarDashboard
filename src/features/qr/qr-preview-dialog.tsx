import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy, Download, ExternalLink, Printer, QrCode, RefreshCw, Share2 } from "lucide-react";
import { toast } from "@/components/ui/toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import type { QrResponse } from "@/data/api/generated/models";
import { downloadUrl } from "@/lib/download";
import { cn } from "@/lib/utils";

import { canShare, qrFileName, shareCode } from "./live";
import type { QrShape } from "./output";
import { printCodes } from "./print";

interface Props {
  qr: QrResponse | null;
  title?: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** The output switches, shown under the code so they sit beside what they change. */
  controls?: ReactNode;
  /** A new render is on its way (a switch was flipped); the current one stays up. */
  busy?: boolean;
  /** What the image is, so Print sizes it true. Default: the A6 card. */
  shape?: QrShape;
}

/**
 * The enlarged QR, its short link, and the things you do with it: copy the
 * link, download the image, print it, share it.
 *
 * Built to survive a narrow screen, which the previous version did not. Two
 * rules do the work, and both are about URLs rather than about the image:
 *
 *  - **URLs wrap at any character.** `truncate` sets `white-space: nowrap`,
 *    which makes an element's min-content width the WHOLE string; flex and grid
 *    items then refuse to shrink below it (`min-width: auto`) and force the
 *    dialog wider than the viewport. Letting the text break means its
 *    min-content width is one character, and no ancestor can be blown out.
 *  - **Nothing carries a fixed pixel size.** The QR is a fraction of the dialog
 *    with a square aspect — square because a QR stretched on one axis stops
 *    scanning.
 *
 * Download, Print and Share all hand over the server's image untouched, so an
 * unbranded code leaves as the code alone.
 */
export function QrPreviewDialog({ qr, title, open, onOpenChange, controls, busy = false, shape = "card" }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!qr) return null;

  const unbranded = shape === "plain";
  const label = title ?? t("qr.preview.title", "QR Code");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qr.short_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("common.copyFailed", "Copy failed"));
    }
  };

  const handleShare = async () => {
    if (!(await shareCode(qr, label, unbranded))) {
      toast.error(t("qr.shareFailed", "Could not share the code"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Never wider than the viewport less a margin. The component default is
          wider than a phone, which put the dialog edge to edge. */}
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto overflow-x-hidden sm:max-w-md">
        <DialogHeader className="min-w-0">
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{label}</span>
          </DialogTitle>
          {/* The destination, wrapping rather than truncating: this is the one
              thing on the screen someone may need to read in full, because a
              wrong base URL is invisible until a printed card is scanned. */}
          <DialogDescription className="text-xs [overflow-wrap:anywhere]">
            {qr.long_url}
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex justify-center rounded-xl border bg-card p-4">
          {/* White quiet-zone wrapper so the raster is legible on any theme. */}
          <span
            className={cn(
              "block w-full rounded bg-white p-1 transition-opacity duration-fast",
              unbranded ? "max-w-48" : "max-w-56",
              busy && "opacity-50",
            )}
          >
            <img
              src={qr.qr_data_url}
              alt={t("qr.imageAlt", "QR code for {{title}}", { title: label })}
              data-testid="qr-preview-image"
              className="aspect-square w-full object-contain"
            />
          </span>
          {busy ? (
            <span className="absolute inset-0 grid place-items-center" role="status" aria-label={t("qr.updating", "Updating the code…")}>
              <Spinner icon={RefreshCw} className="size-5" />
            </span>
          ) : null}
        </div>

        {controls ? <div className="rounded-lg border bg-muted/40 p-3">{controls}</div> : null}

        <div className="flex min-w-0 flex-col gap-2 rounded-lg bg-muted px-3 py-2">
          <a
            href={qr.short_url}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-start gap-1.5 text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <ExternalLink className="mt-1 size-3 shrink-0" />
            <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
              {qr.short_url}
            </span>
          </a>
          <Badge variant="outline" className="w-fit font-mono text-xs">
            {qr.short_code}
          </Badge>
        </div>

        {/* Two a row on a phone, all in one row from `sm`: never so narrow a
            label is cut short. */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:[&>*]:flex-1">
          <Button variant="outline" onClick={handleCopy}>
            {copied ? (
              <Check className="size-4 text-success" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied
              ? t("common.copied", "Copied!")
              : t("common.copyLink", "Copy link")}
          </Button>
          <Button variant="outline" onClick={() => void printCodes([{ src: qr.qr_data_url }], shape)} data-testid="qr-print">
            <Printer className="size-4" />
            {t("qr.print", "Print")}
          </Button>
          {canShare() ? (
            <Button variant="outline" onClick={() => void handleShare()}>
              <Share2 className="size-4" />
              {t("qr.share", "Share")}
            </Button>
          ) : null}
          <Button onClick={() => downloadUrl(qr.qr_data_url, qrFileName(qr, unbranded))} data-testid="qr-download">
            <Download className="size-4" />
            {t("common.download", "Download")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
