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

interface Props {
  qr: QrResponse | null;
  title?: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function QrPreviewDialog({ qr, title, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!qr) return null;

  const isSvg = qr.qr_data_url.startsWith("data:image/svg");

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
    const ext = isSvg ? "svg" : "png";
    const a = document.createElement("a");
    a.href = qr.qr_data_url;
    a.download = `qr-${qr.short_code}.${ext}`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="size-4" />
            {title ?? t("qr.preview.title", "QR Code")}
          </DialogTitle>
          <DialogDescription className="truncate text-xs">
            {qr.long_url}
          </DialogDescription>
        </DialogHeader>

        {/* QR image */}
        <div className="flex justify-center rounded-xl border bg-white p-4">
          <img
            src={qr.qr_data_url}
            alt="QR code"
            className="size-56 object-contain"
          />
        </div>

        {/* Short URL */}
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <a
            href={qr.short_url}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium hover:underline"
          >
            <ExternalLink className="size-3 shrink-0" />
            <span className="truncate">{qr.short_url}</span>
          </a>
          <Badge variant="outline" className="shrink-0 font-mono text-xs">
            {qr.short_code}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="size-4 text-success" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied
              ? t("common.copied", "Copied!")
              : t("common.copyLink", "Copy link")}
          </Button>
          <Button className="flex-1" onClick={handleDownload}>
            <Download className="size-4" />
            {t("common.download", "Download")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
