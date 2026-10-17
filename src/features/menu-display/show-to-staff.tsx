/**
 * The end of the menu without prices: the customer's list, full screen and
 * large, to hold up to a waiter.
 *
 * It sends nothing and creates no order — the owner's decision (2026-10-17):
 * this page has no ordering behind it, and the person taking the order rings
 * it up on the till. Isolated in this one component, so the menu page never
 * learns what happens to a list.
 */
import { useTranslation } from "react-i18next";
import { ArrowLeft, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { getTranslatedName } from "@/lib/translation";
import { ComboPickList, summarizeLine } from "@/features/public-ordering/components/cart-lines";
import type { CartLine } from "@/features/public-ordering/types";

export function ShowToStaff({
  open,
  onOpenChange,
  lines,
  shopName,
  branchName,
  onClear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: CartLine[];
  shopName: string;
  branchName: string;
  /** Start again: the list is done with (the waiter has it). */
  onClear: () => void;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const units = lines.reduce((n, l) => n + l.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 top-0 left-0 flex h-[100dvh] max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none"
      >
        <div className="border-b border-border/60 px-5 pb-4 pt-5">
          <div className="mx-auto w-full max-w-2xl">
            <p className="text-sm text-muted-foreground">
              {shopName} · {branchName}
            </p>
            <DialogTitle className="mt-1 font-serif text-2xl leading-tight sm:text-3xl">
              {t("menuDisplay.staff.title", "My order")}
            </DialogTitle>
            <DialogDescription className="mt-1 text-base">
              {t("menuDisplay.staff.hint", "Show this to a member of staff.")}
            </DialogDescription>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <ul className="mx-auto w-full max-w-2xl divide-y divide-border/60" data-testid="staff-list">
            {lines.map((line) => {
              const summary = summarizeLine(line, lang);
              return (
                <li key={line.uid} className="flex gap-4 py-4">
                  <span className="min-w-12 shrink-0 font-mono text-2xl font-semibold tabular-nums" dir="ltr">
                    {line.quantity}×
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-semibold leading-snug">
                      {getTranslatedName(line.item, lang)}
                    </p>
                    {summary ? (
                      <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                        {summary}
                      </p>
                    ) : null}
                    <div className="text-base [&_ul]:text-sm">
                      <ComboPickList line={line} lang={lang} />
                    </div>
                    {line.notes ? (
                      <p className="mt-1 text-base italic text-muted-foreground">
                        “{line.notes}”
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-border/60 bg-background px-5 py-4">
          <div className="mx-auto grid w-full max-w-2xl grid-cols-2 items-center gap-3 sm:flex">
            <p className="col-span-2 text-sm text-muted-foreground sm:me-auto">
              {t("menuDisplay.staff.count", { count: units, defaultValue: "{{count}} items" })}
            </p>
            <Button variant="outline" size="lg" onClick={onClear}>
              <Trash2 className="size-4" />
              {t("menuDisplay.staff.clear", "Start a new list")}
            </Button>
            <Button variant="brand" size="lg" onClick={() => onOpenChange(false)}>
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {t("menuDisplay.staff.back", "Back to the menu")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
