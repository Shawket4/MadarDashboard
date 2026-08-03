import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Check, Copy, Download, Loader2, TriangleAlert } from "lucide-react";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/app/confirm-dialog";
import { getErrorMessage } from "@/data/api/errors";
import { useCredentialHandoff, type IssuedCredential } from "./use-credential-handoff";

interface Props {
  /** Mount only when a credential has been issued — see `useCredentialHandoff`. */
  issued: IssuedCredential;
  onClose: () => void;
}

/**
 * Shown after a credential is created or rotated.
 *
 * The password is NEVER rendered here — it exists only inside the encrypted
 * archive that was just downloaded. All this dialog reveals is the passphrase
 * that opens it, which the operator is told to deliver by a different channel.
 */
export function HandoffDialog({ issued, onClose }: Props) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [copied, setCopied] = useState(false);
  const handoff = useCredentialHandoff(issued);
  const rotated = issued.mode === "rotated";

  const copyPassphrase = async () => {
    try {
      await navigator.clipboard.writeText(handoff.passphrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("integrations.handoff.copyFailed", "Could not copy — select the text and copy manually."));
    }
  };

  // Closing destroys the only copy of the password, so make it deliberate when
  // the operator has not actually got the file yet.
  const requestClose = async () => {
    if (handoff.downloadCount === 0) {
      const ok = await confirm({
        title: t("integrations.handoff.closeTitle", "Close without the file?"),
        description: t(
          "integrations.handoff.closeHint",
          "You haven't downloaded the credentials file. The password cannot be recovered afterwards — you would have to rotate this credential to issue a new one.",
        ),
        confirmLabel: t("integrations.handoff.closeAnyway", "Close anyway"),
        destructive: true,
      });
      if (!ok) return;
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) void requestClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {rotated
              ? t("integrations.handoff.rotatedTitle", "New password for {{name}}", { name: issued.credential.name })
              : t("integrations.handoff.createdTitle", "Credentials for {{name}}", { name: issued.credential.name })}
          </DialogTitle>
          <DialogDescription>
            {rotated
              ? t("integrations.handoff.rotatedHint", "The previous password stopped working immediately. Send the partner this replacement.")
              : t("integrations.handoff.createdHint", "An encrypted file has been downloaded. It contains the credentials and the full integration guide.")}
          </DialogDescription>
        </DialogHeader>

        {handoff.status === "failed" ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div className="space-y-1 text-xs leading-relaxed">
                <p className="font-semibold">
                  {t("integrations.handoff.failedTitle", "The credential was created, but the file could not be built.")}
                </p>
                <p>
                  {t(
                    "integrations.handoff.failedHint",
                    "Try again. If it keeps failing, close this and use Rotate to issue a fresh password.",
                  )}
                </p>
                <p className="text-muted-foreground">{getErrorMessage(handoff.error)}</p>
              </div>
            </div>
            <Button onClick={() => void handoff.retry()} className="w-full">
              {t("integrations.handoff.retry", "Try again")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("integrations.handoff.passphrase", "Password for the file")}
              </p>
              <div className="flex items-start gap-2">
                <code
                  className="min-w-0 flex-1 rounded-md border bg-muted/50 px-3 py-2.5 font-mono text-sm tracking-widest break-all"
                  dir="ltr"
                >
                  {handoff.status === "building"
                    ? t("integrations.handoff.building", "Preparing…")
                    : handoff.passphrase}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => void copyPassphrase()}
                  disabled={handoff.status !== "ready"}
                  aria-label={t("common.copy", "Copy")}
                >
                  {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>

            <ol className="list-inside list-decimal space-y-2 rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed">
              <li>{t("integrations.handoff.step1", "Send the downloaded file to your partner (email is fine — it is encrypted).")}</li>
              <li>{t("integrations.handoff.step2", "Read this password to them over the phone. Never send both through the same channel.")}</li>
              <li>
                {t(
                  "integrations.handoff.step3",
                  "Tell them to open it with 7-Zip, WinRAR or Keka. Windows and macOS built-in extractors cannot open encrypted archives.",
                )}
              </li>
            </ol>

            <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
              <p className="text-xs leading-relaxed">
                {t(
                  "integrations.handoff.warning",
                  "Once you close this, the password is gone for good — it is not stored anywhere and cannot be shown again. If you lose it, rotate the credential.",
                )}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handoff.downloadAgain}
            disabled={handoff.status !== "ready"}
          >
            {handoff.status === "building"
              ? <Loader2 className="size-4 animate-spin" />
              : <Download className="size-4" />}
            {t("integrations.handoff.downloadAgain", "Download again")}
          </Button>
          <Button type="button" onClick={() => void requestClose()}>
            {t("common.done", "Done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
