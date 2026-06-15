import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Pencil, Plus, ShoppingBag, Trash2 } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { easeOut } from "@/lib/motion";
import i18n from "@/i18n";

import type { CartLine } from "../types";
import { cartSubtotal, lineTotal } from "../utils";

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: CartLine[];
  /** delivery fee estimate (piastres); null when unknown/not yet quoted. */
  deliveryFee: number | null;
  /** estimated channel discount on the subtotal (piastres); 0/undefined = none. */
  discountAmount?: number;
  onEdit: (line: CartLine) => void;
  onRemove: (uid: string) => void;
  onSetQty: (uid: string, qty: number) => void;
  onCheckout: () => void;
  onAddMore: () => void;
}

/** A short, human summary of a configured line's selections. */
const summarize = (line: CartLine, lang: string): string => {
  const parts: string[] = [];
  if (line.size_label) parts.push(line.size_label);
  for (const a of line.addons) {
    const name = getTranslatedName({ name: a.name, name_translations: a.name_translations }, lang);
    parts.push(a.quantity > 1 ? `${name} ×${a.quantity}` : name);
  }
  for (const o of line.optionals) {
    parts.push(getTranslatedName({ name: o.name, name_translations: o.name_translations }, lang));
  }
  return parts.join(" · ");
};

export function CartSheet({
  open,
  onOpenChange,
  lines,
  deliveryFee,
  discountAmount = 0,
  onEdit,
  onRemove,
  onSetQty,
  onCheckout,
  onAddMore,
}: CartSheetProps) {
  const { t } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";

  const subtotal = cartSubtotal(lines);
  const total = subtotal - discountAmount + (deliveryFee ?? 0);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[90dvh] max-w-[480px]">
        <div className="border-b border-border/60 px-4 pb-3 pt-1 text-start">
          <DrawerTitle className="text-lg">{t("order.cart.title")}</DrawerTitle>
          <DrawerDescription className="mt-0.5">
            {t("order.cart.estimate")}
          </DrawerDescription>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ShoppingBag className="size-6" />
              </span>
              <p className="font-semibold">{t("order.cart.empty")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("order.cart.emptyHint")}
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              <AnimatePresence initial={false}>
                {lines.map((line) => {
                  const summary = summarize(line, lang);
                  return (
                    <motion.li
                      key={line.uid}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={easeOut}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl border border-border/70 bg-card p-3">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{getTranslatedName(line.item, lang)}</p>
                            {summary && (
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{summary}</p>
                            )}
                            {line.notes && (
                              <p className="mt-0.5 truncate text-xs italic text-muted-foreground">
                                “{line.notes}”
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-sm font-bold tabular-nums">
                            {fmtMoney(lineTotal(line))}
                          </span>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-0.5 rounded-full border border-border/70">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="rounded-full"
                              onClick={() =>
                                line.quantity <= 1
                                  ? onRemove(line.uid)
                                  : onSetQty(line.uid, line.quantity - 1)
                              }
                              aria-label={t("order.menu.decrease")}
                            >
                              {line.quantity <= 1 ? (
                                <Trash2 className="size-3" />
                              ) : (
                                <Minus className="size-3" />
                              )}
                            </Button>
                            <span className="w-6 text-center text-xs font-bold tabular-nums">
                              {line.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="rounded-full"
                              onClick={() => onSetQty(line.uid, line.quantity + 1)}
                              aria-label={t("order.menu.increase")}
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-muted-foreground"
                              onClick={() => onEdit(line)}
                            >
                              <Pencil className="size-3" />
                              {t("order.cart.edit")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-destructive hover:text-destructive"
                              onClick={() => onRemove(line.uid)}
                            >
                              <Trash2 className="size-3" />
                              {t("order.cart.remove")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>

              <li>
                <Button variant="outline" className="w-full" onClick={onAddMore}>
                  <Plus className="size-4" />
                  {t("order.cart.addMore")}
                </Button>
              </li>
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-border/60 bg-background px-4 py-3">
            <Totals subtotal={subtotal} deliveryFee={deliveryFee} total={total} discount={discountAmount} />
            <Button className="mt-3 w-full" size="lg" onClick={onCheckout}>
              {t("order.cart.checkout")}
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

export function Totals({
  subtotal,
  deliveryFee,
  total,
  discount,
  emphasizeTotal = true,
}: {
  subtotal: number;
  deliveryFee: number | null;
  total: number;
  /** Discount amount in piastres applied to the subtotal; omitted/0 = none. */
  discount?: number | null;
  emphasizeTotal?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <dl className="space-y-1.5 text-sm">
      <Row label={t("order.cart.subtotal")} value={fmtMoney(subtotal)} />
      {discount != null && discount > 0 && (
        <div className="flex items-center justify-between text-success">
          <dt>{t("order.cart.discount", "Discount")}</dt>
          <dd className="tabular-nums">−{fmtMoney(discount)}</dd>
        </div>
      )}
      <Row
        label={t("order.cart.deliveryFee")}
        value={
          deliveryFee == null
            ? "—"
            : deliveryFee === 0
              ? t("order.cart.free")
              : fmtMoney(deliveryFee)
        }
      />
      <div className={cn("flex items-center justify-between pt-1.5", emphasizeTotal && "border-t border-border/60")}>
        <dt className={cn(emphasizeTotal ? "font-bold" : "text-muted-foreground")}>
          {t("order.cart.total")}
        </dt>
        <dd className={cn("tabular-nums", emphasizeTotal ? "text-base font-bold" : "font-semibold")}>
          {fmtMoney(total)}
        </dd>
      </div>
    </dl>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
