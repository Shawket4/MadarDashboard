import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Minus, Pencil, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import type { CartQuote } from "@/data/api/generated/models/cartQuote";
import type { QuotedDeal } from "@/data/api/generated/models/quotedDeal";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { easeOut } from "@/lib/motion";
import i18n from "@/i18n";

import type { CartLine } from "../types";
import { cartSubtotal, lineTotal } from "../utils";
import { ComboPickList, DealRows, summarizeLine } from "./cart-lines";

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: CartLine[];
  /**
   * Delivery fee estimate (piastres); null when unknown or not yet quoted.
   * Absent entirely for a table's basket, which has no delivery to charge for.
   */
  deliveryFee?: number | null;
  /** estimated channel discount on the subtotal (piastres); 0/undefined = none. */
  discountAmount?: number;
  onEdit: (line: CartLine) => void;
  onRemove: (uid: string) => void;
  onSetQty: (uid: string, qty: number) => void;
  onCheckout: () => void;
  onAddMore: () => void;
  /**
   * What the button says. A delivery basket checks out; a table's goes to the
   * kitchen and is paid for at the counter afterwards, so "Checkout" would be
   * a promise this page cannot keep.
   */
  checkoutLabel?: string;
  /** The shop is not serving, or a send is already in flight. */
  checkoutDisabled?: boolean;
  /**
   * The server's price for exactly these lines, deals applied (null while it
   * is being asked, or when asking failed — the estimate stands in).
   */
  quote?: CartQuote | null;
  /** A line under the deal rows (a table's deals are settled on the bill). */
  dealHint?: string;
  /** Why the last checkout/send failed, shown next to the button. */
  error?: string | null;
}

/** Subtotal, deals and total as the customer should see them. */
const priced = (lines: CartLine[], quote: CartQuote | null | undefined, discount: number, fee: number | null | undefined) => {
  const subtotal = quote ? quote.items_total : cartSubtotal(lines);
  const afterDeals = quote ? quote.total_after_deals : subtotal;
  return { subtotal, deals: quote?.deals ?? [], total: afterDeals - discount + (fee ?? 0) };
};

/** The failure, where the customer is looking: right above the button. */
function CheckoutError({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-[color-mix(in_oklab,var(--color-destructive)_50%,var(--color-foreground))]"
    >
      <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{error}</span>
    </p>
  );
}

/* ── Mobile: bottom-sheet drawer ─────────────────────────────────────────── */

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
  checkoutLabel,
  checkoutDisabled,
  quote,
  dealHint,
  error,
}: CartSheetProps) {
  const { t } = useTranslation();
  const { subtotal, deals, total } = priced(lines, quote, discountAmount, deliveryFee);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[90dvh] max-w-[480px]">
        <div className="flex items-start justify-between gap-2 border-b border-border/60 px-4 pb-3 pt-1 text-start">
          <div>
            <DrawerTitle className="font-serif text-xl">{t("order.cart.title")}</DrawerTitle>
            <DrawerDescription className="mt-0.5">{t("order.cart.estimate")}</DrawerDescription>
          </div>
          <DrawerClose
            aria-label={t("common.close", "Close")}
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-foreground transition-colors hover:bg-muted"
          >
            <X className="size-4" />
          </DrawerClose>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {lines.length === 0 ? (
            <CartEmpty />
          ) : (
            <CartList
              lines={lines}
              onEdit={onEdit}
              onRemove={onRemove}
              onSetQty={onSetQty}
              footerSlot={
                <Button variant="outline" className="w-full" onClick={onAddMore}>
                  <Plus className="size-4" />
                  {t("order.cart.addMore")}
                </Button>
              }
            />
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-border/60 bg-background px-4 py-3">
            <Totals
              subtotal={subtotal}
              deals={deals}
              dealHint={dealHint}
              deliveryFee={deliveryFee}
              total={total}
              discount={discountAmount}
            />
            <CheckoutError error={error} />
            <Button
              variant="brand"
              className="mt-3 w-full"
              size="lg"
              onClick={onCheckout}
              disabled={checkoutDisabled}
            >
              {checkoutLabel ?? t("order.cart.checkout")}
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

/* ── Desktop: persistent cart rail (3-pane menu layout) ──────────────────── */

type CartPanelProps = Omit<CartSheetProps, "open" | "onOpenChange" | "onAddMore">;

export function CartPanel({
  lines,
  deliveryFee,
  discountAmount = 0,
  onEdit,
  onRemove,
  onSetQty,
  onCheckout,
  checkoutLabel,
  checkoutDisabled,
  quote,
  dealHint,
  error,
}: CartPanelProps) {
  const { t } = useTranslation();
  const { subtotal, deals, total } = priced(lines, quote, discountAmount, deliveryFee);

  return (
    <div className="flex max-h-[calc(100dvh-6rem)] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="border-b border-border/60 px-4 py-3">
        <h2 className="font-serif text-lg leading-tight">{t("order.cart.title")}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("order.cart.estimate")}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {lines.length === 0 ? (
          <CartEmpty compact />
        ) : (
          <CartList lines={lines} onEdit={onEdit} onRemove={onRemove} onSetQty={onSetQty} />
        )}
      </div>

      {lines.length > 0 && (
        <div className="border-t border-border/60 px-4 py-3">
          <Totals
            subtotal={subtotal}
            deals={deals}
            dealHint={dealHint}
            deliveryFee={deliveryFee}
            total={total}
            discount={discountAmount}
          />
          <CheckoutError error={error} />
          <Button
            variant="brand"
            className="mt-3 w-full"
            size="lg"
            onClick={onCheckout}
            disabled={checkoutDisabled}
          >
            {checkoutLabel ?? t("order.cart.checkout")}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Shared pieces ───────────────────────────────────────────────────────── */

function CartEmpty({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "py-10" : "py-12")}>
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ShoppingBag className="size-6" />
      </span>
      <p className="font-medium">{t("order.cart.empty")}</p>
      <p className="mt-1 text-sm text-muted-foreground">{t("order.cart.emptyHint")}</p>
    </div>
  );
}

function CartList({
  lines,
  onEdit,
  onRemove,
  onSetQty,
  footerSlot,
}: {
  lines: CartLine[];
  onEdit: (line: CartLine) => void;
  onRemove: (uid: string) => void;
  onSetQty: (uid: string, qty: number) => void;
  footerSlot?: React.ReactNode;
}) {
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  return (
    <ul className="space-y-2.5">
      <AnimatePresence initial={false}>
        {lines.map((line) => {
          const summary = summarizeLine(line, lang);
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
              <CartLineCard line={line} summary={summary} onEdit={onEdit} onRemove={onRemove} onSetQty={onSetQty} />
            </motion.li>
          );
        })}
      </AnimatePresence>
      {footerSlot && <li>{footerSlot}</li>}
    </ul>
  );
}

function CartLineCard({
  line,
  summary,
  onEdit,
  onRemove,
  onSetQty,
}: {
  line: CartLine;
  summary: string;
  onEdit: (line: CartLine) => void;
  onRemove: (uid: string) => void;
  onSetQty: (uid: string, qty: number) => void;
}) {
  const { t } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{getTranslatedName(line.item, lang)}</p>
          {summary && (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{summary}</p>
          )}
          <ComboPickList line={line} lang={lang} />
          {line.notes && (
            <p className="mt-0.5 text-xs italic text-muted-foreground">“{line.notes}”</p>
          )}
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-brand">
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
              line.quantity <= 1 ? onRemove(line.uid) : onSetQty(line.uid, line.quantity - 1)
            }
            aria-label={t("order.menu.decrease")}
          >
            {line.quantity <= 1 ? <Trash2 className="size-3" /> : <Minus className="size-3" />}
          </Button>
          <span className="w-6 text-center text-xs font-bold tabular-nums">{line.quantity}</span>
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
          <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => onEdit(line)}>
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
  );
}

export function Totals({
  subtotal,
  deals = [],
  dealHint,
  deliveryFee,
  total,
  discount,
  emphasizeTotal = true,
}: {
  subtotal: number;
  /** The deals the server applied (each a row under the subtotal). */
  deals?: QuotedDeal[];
  /** A note under the deal rows, when there are any. */
  dealHint?: string;
  /** null = not known yet ("—"); undefined = no delivery at all (no row). */
  deliveryFee?: number | null;
  total: number;
  /** Discount amount in piastres applied to the subtotal; omitted/0 = none. */
  discount?: number | null;
  emphasizeTotal?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <dl className="space-y-1.5 text-sm">
      <Row label={t("order.cart.subtotal")} value={fmtMoney(subtotal)} />
      <DealRows deals={deals} />
      {deals.length > 0 && dealHint ? <p className="text-xs text-muted-foreground">{dealHint}</p> : null}
      {discount != null && discount > 0 && (
        <div className="flex items-center justify-between text-success">
          <dt>{t("order.cart.discount", "Discount")}</dt>
          <dd className="tabular-nums">−{fmtMoney(discount)}</dd>
        </div>
      )}
      {deliveryFee !== undefined && (
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
      )}
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
