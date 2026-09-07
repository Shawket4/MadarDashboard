import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Copy, Download, ExternalLink, QrCode } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { QrResponse } from "@/data/api/generated/models";
import { downloadUrl } from "@/lib/download";

interface Props {
  qr: QrResponse | null;
  title?: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

/**
 * The enlarged QR, its short link, and the two things you do with it.
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
 */
export function QrPreviewDialog({ qr, title, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!qr) return null;

  const isSvg = qr.qr_data_url.startsWith("data:image/svg");
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

  const handleDownload = () => {
    downloadUrl(qr.qr_data_url, `qr-${qr.short_code}.${isSvg ? "svg" : "png"}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Never wider than the viewport less a margin. The component default is
          wider than a phone, which put the dialog edge to edge. */}
      <DialogContent className="max-w-[calc(100vw-2rem)] overflow-hidden sm:max-w-sm">
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

        <div className="flex justify-center rounded-xl border bg-card p-4">
          {/* White quiet-zone wrapper so the raster is legible on any theme. */}
          <span className="block w-full max-w-56 rounded bg-white p-1">
            <img
              src={qr.qr_data_url}
              alt={t("qr.imageAlt", "QR code for {{title}}", { title: label })}
              className="aspect-square w-full object-contain"
            />
          </span>
        </div>

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

        {/* Stacked on a phone: two buttons side by side leave neither legible. */}
        <div className="flex flex-col gap-2 sm:flex-row [&>*]:flex-1">
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
          <Button onClick={handleDownload}>
            <Download className="size-4" />
            {t("common.download", "Download")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
