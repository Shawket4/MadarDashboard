/**
 * The counter's one question before an act that is hard to take back: stamping
 * more than one item, or completing a card. The figure is the largest thing in
 * it, so the teller checks the number, not a sentence, and the two answers are
 * full-width, thumb-sized buttons with the safe one first in reading order.
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ConfirmAsk {
  figure: ReactNode;
  title: ReactNode;
  body: ReactNode;
  yes: string;
}

export function CounterConfirm({ ask, onAnswer }: { ask: ConfirmAsk | null; onAnswer: (yes: boolean) => void }) {
  const { t } = useTranslation();
  return (
    <AlertDialog open={ask !== null} onOpenChange={(o) => !o && onAnswer(false)}>
      <AlertDialogContent className="max-w-[calc(100%-2rem)] gap-0 rounded-3xl p-6 text-center sm:max-w-md">
        <div aria-hidden className="mx-auto font-mono text-7xl font-semibold leading-none tabular-nums">
          {ask?.figure}
        </div>
        <AlertDialogTitle className="mt-4 text-xl text-balance">{ask?.title}</AlertDialogTitle>
        <AlertDialogDescription className="mt-2 text-base text-pretty">{ask?.body}</AlertDialogDescription>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-14 rounded-2xl text-base" onClick={() => onAnswer(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button className="h-14 rounded-2xl text-base" onClick={() => onAnswer(true)}>
            {ask?.yes}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
