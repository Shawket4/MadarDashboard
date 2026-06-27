import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { CheckCircle2, Info, Wallet } from "lucide-react";

import type { DeliveryOrder } from "@/data/api/generated/models/deliveryOrder";
import { Button } from "@/components/ui/button";
import { fmtMoney } from "@/lib/format";
import { spring } from "@/lib/motion";

import { Totals } from "./cart-sheet";

interface ConfirmationStepProps {
  order: DeliveryOrder;
  /** The pre-submit estimated total (piastres) to compare against the authoritative one. */
  estimatedTotal: number | null;
  onNewOrder: () => void;
}

/**
 * Shows ONLY the backend-repriced totals — never an unconfirmed number. If the
 * estimate differed from the authoritative total, a subtle note explains it.
 */
export function ConfirmationStep({ order, estimatedTotal, onNewOrder }: ConfirmationStepProps) {
  const { t } = useTranslation();
  const priceChanged = estimatedTotal != null && estimatedTotal !== order.total;

  return (
    <div className="flex flex-col items-center text-center">
      <motion.span
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={spring}
        className="mb-4 flex size-20 items-center justify-center rounded-full bg-success/15 text-success"
      >
        <CheckCircle2 className="size-10" />
      </motion.span>

      <h2 className="text-2xl font-bold">{t("order.done.heading")}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {t("order.done.message")}
      </p>

      {order.delivery_ref && (
        <div className="mt-5 w-full rounded-2xl border border-border/70 bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("order.done.ref")}
          </p>
          <p className="mt-0.5 text-2xl font-bold tracking-wider tabular-nums" dir="ltr">
            {order.delivery_ref}
          </p>
        </div>
      )}

      <div className="mt-4 w-full rounded-2xl border border-border/70 bg-card/50 p-4 text-start">
        <Totals
          subtotal={order.subtotal}
          deliveryFee={order.delivery_fee}
          total={order.total}
          discount={order.discount_amount}
        />
      </div>

      {priceChanged && estimatedTotal != null && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex w-full items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-start text-sm text-warning-foreground"
        >
          <Info className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">{t("order.done.priceUpdatedTitle")}</p>
            <p className="text-xs opacity-90">
              {t("order.done.wasNow", {
                old: fmtMoney(estimatedTotal),
                new: fmtMoney(order.total),
              })}
            </p>
          </div>
        </motion.div>
      )}

      <div className="mt-4 flex w-full items-center gap-2.5 rounded-xl bg-muted/50 px-3.5 py-2.5 text-start text-sm text-muted-foreground">
        <Wallet className="size-4 shrink-0" />
        <span>{t("order.done.payHint")}</span>
      </div>

      <Button className="mt-6 w-full" size="lg" variant="outline" onClick={onNewOrder}>
        {t("order.done.newOrder")}
      </Button>
    </div>
  );
}
