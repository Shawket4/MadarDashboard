import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ReadinessCheck } from "@/data/api/generated/models";
import { ActivationCodesSection } from "@/features/devices/activation-codes";

import { AppQrCode, StoreBadges } from "./apps";

/**
 * The tablet check's fix, in two steps on one screen: put Madar Cashier on the
 * tablet (scan the QR with its camera, or the App Store), then bind it to the
 * branch with a code made right here (the devices page's own section).
 */
export function ConnectTabletButton({ check }: { check: ReadinessCheck }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  // The first branch still without a tablet; the code binds a tablet to it.
  const branch = check.problems.find((p) => p.entity_type === "branch");
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        {t("setup.checks.tablet.action")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("setup.tablet.title", "Connect a tablet")}</DialogTitle>
            <DialogDescription>
              {branch
                ? t("setup.tablet.subtitle", { branch: branch.name, defaultValue: "Two steps and {{branch}} can sell." })
                : t("setup.tablet.subtitleAny", "Two steps and the tablet can sell.")}
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-6">
            <li className="flex gap-4">
              <Step n={1} />
              <div className="min-w-0 flex-1 space-y-3">
                <p className="font-medium">{t("setup.tablet.install", "Install Madar Cashier on the tablet")}</p>
                <div className="flex flex-wrap items-center gap-4">
                  <AppQrCode app="cashier" className="size-32 shrink-0 p-1.5 ring-1 ring-border" />
                  <div className="min-w-0 flex-1 basis-40 space-y-3">
                    <p className="text-sm text-muted-foreground text-pretty">
                      {t("setup.tablet.scan", "Open the tablet's camera and point it at the code. It opens the download page.")}
                    </p>
                    <StoreBadges app="cashier" />
                  </div>
                </div>
              </div>
            </li>
            <li className="flex gap-4">
              <Step n={2} />
              <div className="min-w-0 flex-1 space-y-3">
                <p className="font-medium">{t("setup.tablet.code", "Open it and enter a code")}</p>
                <p className="text-sm text-muted-foreground text-pretty">
                  {t("setup.tablet.codeHint", "Make a code here and type it on the tablet. It joins this branch at once.")}
                </p>
                {branch ? <ActivationCodesSection branchId={branch.entity_id} /> : null}
              </div>
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground tabular">
      {n}
    </span>
  );
}
