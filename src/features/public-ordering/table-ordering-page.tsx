/**
 * Ordering from the code on the table.
 *
 * A customer sits down, scans, and the shop's menu opens already knowing where
 * they are. No branch to pick — they are sitting in it — no channel, no phone
 * number, no address. Everything the code answered, it does not ask again.
 *
 * ## What the customer sees
 *
 * Their BILL, first. A table's order is one bill that the whole table adds to,
 * so a scan halfway through a meal has to show the meal: when they sat down,
 * counting up, and every round already with the kitchen. Opening an empty
 * basket instead would read as a fresh start and invite someone to re-order
 * the drinks.
 *
 * Then the menu, and the same one the till would ring — the dine-in menu, at
 * branch prices. The delivery channels' menus carry their own prices and their
 * own discount, and quoting one of those would tell the customer a number the
 * bill then contradicts.
 *
 * ## What it does not do
 *
 * It does not take money. A table's bill settles at the till, like any dine-in
 * bill, which is the whole reason a scan opens an open ticket rather than a
 * delivery order. And it never sends a price: the lines name menu items and
 * quantities, and the server prices them.
 */
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { Check, Clock, ShoppingBag, UtensilsCrossed } from "lucide-react";

import {
  usePublicTable,
  usePublicTableMenu,
  usePublicTableOrder,
} from "@/data/api/generated/api";
import type { PublicTableBill } from "@/data/api/generated/models/publicTableBill";
import { Button } from "@/components/ui/button";
import { StorefrontShell } from "@/features/public-shell/storefront-shell";
import { usePublicBrand } from "@/features/public-shell/use-brand";
import { cn } from "@/lib/utils";

import { CartPanel, CartSheet } from "./components/cart-sheet";
import { ItemCustomizer } from "./components/item-customizer";
import { MenuStep } from "./components/menu-step";
import { useCart } from "./use-cart";
import type { CartLine } from "./types";
import { toCartLineInput } from "./utils";
import { fmtMoney } from "@/lib/format";

/** Re-read the bill on this beat, so a round somebody else sent turns up. */
const BILL_POLL_MS = 20_000;

export function TableOrderingPage({ tableId }: { tableId: string }) {
  const { t } = useTranslation();
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [editing, setEditing] = useState<CartLine | null>(null);
  const [menuQuery, setMenuQuery] = useState("");
  const [sentAt, setSentAt] = useState<number | null>(null);

  const table = usePublicTable(tableId, {
    query: { refetchInterval: BILL_POLL_MS, retry: false },
  });
  const menu = usePublicTableMenu(tableId, {
    query: { staleTime: 5 * 60_000, retry: false },
  });
  const brand = usePublicBrand(table.data?.org_id ?? null);
  const send = usePublicTableOrder();

  const bill = table.data?.bill ?? null;
  const addons = menu.data?.addons ?? [];

  // A fresh key per basket, so a resend of the SAME basket after a dropped
  // connection lands once. It is the only protection there is — a phone has no
  // outbox to dedup against.
  const [sendKey, setSendKey] = useState(() => crypto.randomUUID());

  const handleSend = () => {
    if (cart.lines.length === 0 || send.isPending) return;
    send.mutate(
      {
        data: {
          table_id: tableId,
          idempotency_key: sendKey,
          items: cart.lines.map(toCartLineInput),
        },
      },
      {
        onSuccess: () => {
          cart.clear();
          setCartOpen(false);
          setSendKey(crypto.randomUUID());
          setSentAt(Date.now());
          void table.refetch();
        },
      },
    );
  };

  // The "sent" confirmation clears itself; it is a receipt of the tap, not a
  // state the customer has to dismiss.
  useEffect(() => {
    if (sentAt == null) return;
    const id = setTimeout(() => setSentAt(null), 4000);
    return () => clearTimeout(id);
  }, [sentAt]);

  if (table.isPending) {
    return (
      <StorefrontShell product="ordering">
        <TableSkeleton />
      </StorefrontShell>
    );
  }

  // A code for a table that was removed, or whose branch is closed for good.
  if (table.isError || !table.data) {
    return (
      <StorefrontShell product="ordering">
        <Notice
          icon={<UtensilsCrossed className="size-6" />}
          title={t("table.unknown", "We can't find that table")}
          body={t(
            "table.unknownHint",
            "Ask a member of staff — this code may have been replaced.",
          )}
        />
      </StorefrontShell>
    );
  }

  const { label, branch_name: branchName, accepting } = table.data;

  return (
    <StorefrontShell brand={brand} product="ordering">
      <div className="mx-auto flex w-full max-w-[480px] flex-col gap-4 px-4 py-4 xl:max-w-none xl:px-6">
        <TableHeader label={label} branchName={branchName} bill={bill} />

        {!accepting ? (
          <Notice
            icon={<Clock className="size-6" />}
            title={t("table.closed", "The kitchen is closed right now")}
            body={t(
              "table.closedHint",
              "You can still look at the menu. A member of staff can take your order.",
            )}
          />
        ) : null}

        {bill ? <BillSoFar bill={bill} /> : null}

        <MenuStep
          branchId={table.data.branch_id}
          // The dine-in menu is supplied, so MenuStep does not fetch a
          // channel's. The channel below is only used for its label, which
          // this layout does not show.
          channel="in_mall"
          menu={menu.data}
          emptyHint={t("table.menuEmpty", "There is nothing on the menu right now.")}
          countByItem={cart.countByItem}
          onAdd={cart.addOrUpdate}
          query={menuQuery}
          onQueryChange={setMenuQuery}
          cartSlot={
            <CartPanel
              lines={cart.lines}
              onEdit={(line) => setEditing(line)}
              onRemove={cart.remove}
              onSetQty={cart.setQty}
              onCheckout={handleSend}
              checkoutLabel={t("table.send", "Send to kitchen")}
              checkoutDisabled={!accepting || send.isPending}
            />
          }
        />
      </div>

      {/* The basket, and the one button that matters. */}
      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        lines={cart.lines}
        onEdit={(line) => {
          setCartOpen(false);
          setEditing(line);
        }}
        onRemove={cart.remove}
        onSetQty={cart.setQty}
        onCheckout={handleSend}
        onAddMore={() => setCartOpen(false)}
        checkoutLabel={t("table.send", "Send to kitchen")}
        checkoutDisabled={!accepting || send.isPending}
      />

      <ItemCustomizer
        item={editing?.item ?? null}
        addons={addons}
        editing={editing}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        onConfirm={(line) => {
          cart.addOrUpdate(line);
          setEditing(null);
        }}
      />

      {/* The floating basket button — the only way to the send action on a
          phone, so it carries the count and the running total. */}
      <AnimatePresence>
        {cart.itemCount > 0 && !cartOpen ? (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[480px] px-4 pb-4 xl:hidden"
          >
            <Button
              variant="brand"
              size="lg"
              className="w-full justify-between shadow-lg"
              onClick={() => setCartOpen(true)}
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="size-4" />
                {t("table.basket", "Basket")}
                <span className="rounded-full bg-background/20 px-2 py-0.5 text-xs tabular">
                  {cart.itemCount}
                </span>
              </span>
              <span className="tabular">{fmtMoney(cart.subtotal)}</span>
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Sent. */}
      <AnimatePresence>
        {sentAt != null ? (
          <motion.div
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            className="fixed inset-x-0 top-16 z-30 mx-auto w-fit rounded-full bg-success px-4 py-2 text-sm font-medium text-success-foreground shadow-lg"
          >
            <span className="flex items-center gap-2">
              <Check className="size-4" />
              {t("table.sent", "Sent to the kitchen")}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {send.isError ? (
        <div className="fixed inset-x-0 bottom-24 z-30 mx-auto w-fit max-w-[90vw] rounded-full bg-destructive px-4 py-2 text-center text-sm text-destructive-foreground shadow-lg">
          {t("table.sendFailed", "That didn't send. Try again.")}
        </div>
      ) : null}
    </StorefrontShell>
  );
}

/* ── The table, and how long they have been at it ────────────────────────── */

function TableHeader({
  label,
  branchName,
  bill,
}: {
  label: string;
  branchName: string;
  bill: PublicTableBill | null;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold">
          {t("table.title", "Table {{label}}", { label })}
        </h1>
        <p className="text-sm text-muted-foreground">{branchName}</p>
      </div>
      {bill ? <SeatedSince since={bill.opened_at} /> : null}
    </div>
  );
}

/**
 * How long the party has been sitting, counting up.
 *
 * The server sends the MOMENT, not a duration — a duration is stale by the
 * time it arrives, and a customer watching a clock that jumps when the page
 * refetches would not trust it.
 */
function SeatedSince({ since }: { since: string }) {
  const { t } = useTranslation();
  const start = useMemo(() => new Date(since).getTime(), [since]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!Number.isFinite(start)) return null;
  const mins = Math.max(0, Math.floor((now - start) / 60_000));
  const text =
    mins < 60
      ? t("table.seatedMinutes", "{{count}} min", { count: mins })
      : t("table.seatedHours", "{{h}}h {{m}}m", {
          h: Math.floor(mins / 60),
          m: mins % 60,
        });
  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
      <Clock className="size-3.5" />
      <span className="tabular">{text}</span>
    </span>
  );
}

/* ── What is already on the bill ─────────────────────────────────────────── */

function BillSoFar({ bill }: { bill: PublicTableBill }) {
  const { t } = useTranslation();
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">
          {t("table.billSoFar", "Your bill so far")}
        </h2>
        {bill.ready ? (
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            {t("table.ready", "Ready")}
          </span>
        ) : null}
      </header>

      <ol className="flex flex-col gap-3">
        {bill.rounds.map((round) => (
          <li key={round.number}>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("table.round", "Round {{n}}", { n: round.number })}
            </p>
            <ul className="flex flex-col gap-1">
              {round.items.map((line, i) => (
                <li
                  key={`${round.number}-${i}`}
                  className={cn(
                    "flex items-baseline justify-between gap-3 text-sm",
                    line.voided && "text-muted-foreground line-through",
                  )}
                >
                  <span>
                    <span className="tabular">{line.quantity}×</span> {line.name}
                  </span>
                  <span className="tabular text-muted-foreground">
                    {fmtMoney(line.line_total)}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      {/* The SERVER's total — service and tax included where the shop charges
          them. A sum of the lines above would be short by exactly those. */}
      <footer className="mt-3 flex items-baseline justify-between border-t border-border/60 pt-3">
        <span className="text-sm font-semibold">{t("table.total", "Total")}</span>
        <span className="text-lg font-semibold tabular">{fmtMoney(bill.total)}</span>
      </footer>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("table.payAtTill", "Pay at the counter when you're ready.")}
      </p>
    </section>
  );
}

/* ── Shared shapes ───────────────────────────────────────────────────────── */

function Notice({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border/70 bg-card px-6 py-10 text-center">
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-[32ch] text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[480px] animate-pulse flex-col gap-4 px-4 py-6">
      <div className="h-7 w-32 rounded-lg bg-muted" />
      <div className="h-28 rounded-2xl bg-muted" />
      <div className="h-11 rounded-xl bg-muted" />
      <div className="h-40 rounded-2xl bg-muted" />
    </div>
  );
}
