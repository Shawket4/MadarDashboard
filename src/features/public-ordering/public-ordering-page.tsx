import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import {
  usePublicBranches,
  usePublicMenu,
  useCreateDeliveryOrder,
  useDeliveryQuote,
  useOtpRequest,
  useOtpVerify,
  createDeliveryOrder,
} from "@/data/api/generated/api";
import type { PublicBranch } from "@/data/api/generated/models/publicBranch";
import type { QuoteResponse } from "@/data/api/generated/models/quoteResponse";
import type { DeliveryOrder } from "@/data/api/generated/models/deliveryOrder";
import type { DeliveryOrderInput } from "@/data/api/generated/models/deliveryOrderInput";
import { Button } from "@/components/ui/button";
import { BadgePercent, ShoppingBag } from "lucide-react";
import { fmtMoney } from "@/lib/format";
import { fadeIn } from "@/lib/motion";

import type { CartLine, Channel, Step } from "./types";
import {
  asChannel,
  calcDiscount,
  cartSubtotal,
  getDeviceToken,
  isValidPhone,
  newUid,
  normalizePhone,
  setDeviceToken,
  toCartLineInput,
} from "./utils";
import { useOrderTheme } from "./use-order-theme";
import { StepShell } from "./components/step-shell";
import { BranchStep } from "./components/branch-step";
import { ChannelStep } from "./components/channel-step";
import { LocationStep } from "./components/location-step";
import { MenuStep } from "./components/menu-step";
import { ItemCustomizer } from "./components/item-customizer";
import { CartSheet } from "./components/cart-sheet";
import { CheckoutStep, emptyForm, type CheckoutForm } from "./components/checkout-step";
import { OtpDialog } from "./components/otp-dialog";
import { ConfirmationStep } from "./components/confirmation-step";
import type { LatLng } from "./components/delivery-map";

interface PublicOrderingPageProps {
  orgId: string;
  branch?: string;
  channel?: string;
}

export function PublicOrderingPage({ orgId, branch, channel }: PublicOrderingPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Scope the order flow to its own light-by-default theme, then restore the
  // dashboard's global theme when the customer leaves the flow.
  useLayoutEffect(() => {
    useOrderTheme.getState().apply();
    return () => useOrderTheme.getState().restoreGlobal();
  }, []);

  // ── URL-bound selection (branch + channel) ───────────────────────────────
  // The route validates ?branch=&channel=; we mirror selection back into the URL
  // (replace) so refresh/share/back restore the same state. Initialized from props.
  const branchId = branch ?? null;
  const selectedChannel: Channel | null = channel ? asChannel(channel) : null;

  const setUrl = useCallback(
    (next: { branch?: string; channel?: string }) => {
      void navigate({
        to: ".",
        replace: true,
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          branch: next.branch,
          channel: next.channel,
        }),
      });
    },
    [navigate],
  );

  // ── Local flow state (beyond what the URL carries) ────────────────────────
  const [locationDone, setLocationDone] = useState(false);
  const [enteredCheckout, setEnteredCheckout] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<DeliveryOrder | null>(null);
  const [estimateAtSubmit, setEstimateAtSubmit] = useState<number | null>(null);

  const [point, setPoint] = useState<LatLng | null>(null);
  const [address, setAddress] = useState("");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);

  const [lines, setLines] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [editing, setEditing] = useState<CartLine | null>(null);

  const [form, setForm] = useState<CheckoutForm>(emptyForm);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // OTP
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const idempotencyKey = useRef<string>(newUid());

  // ── Resolve the selected branch object (needed by channel step) ───────────
  const { data: branches } = usePublicBranches({ org_id: orgId });
  const branchObj = useMemo<PublicBranch | null>(
    () => branches?.find((b) => b.id === branchId) ?? null,
    [branches, branchId],
  );

  // The global addon catalog (POS model) lives at the top level of the menu.
  // MenuStep fetches the same query for "add"; this dedupes via React Query and
  // supplies the catalog to the cart "edit" customizer mounted below.
  const { data: menu } = usePublicMenu(
    branchId ?? "",
    { channel: selectedChannel ?? "in_mall" },
    { query: { enabled: !!branchId && !!selectedChannel } },
  );
  const addons = menu?.addons ?? [];

  // ── Derive the active step ────────────────────────────────────────────────
  const needsLocation = selectedChannel === "outside";
  const step: Step = (() => {
    if (placedOrder) return "done";
    if (!branchId) return "branch";
    if (!selectedChannel) return "channel";
    if (needsLocation && !locationDone) return "location";
    if (enteredCheckout) return "checkout";
    return "menu";
  })();

  // In-mall: a flat fee (distance ignored by the server). Fetch it so the cart and
  // checkout can show the estimate. Outside fee comes from the location-step quote.
  const { data: inMallQuote } = useDeliveryQuote(
    branchId ?? "",
    { lat: 0, lng: 0, channel: "in_mall" },
    {
      query: {
        enabled: !!branchId && selectedChannel === "in_mall",
        staleTime: 60_000,
        retry: false,
      },
    },
  );

  // Effective delivery-fee estimate (piastres); null when unknown / not deliverable.
  const deliveryFee: number | null = (() => {
    if (needsLocation) return quote?.status === "ok" ? (quote.fee ?? 0) : null;
    return inMallQuote?.status === "ok" ? (inMallQuote.fee ?? 0) : null;
  })();

  // ── Mutations ─────────────────────────────────────────────────────────────
  const otpRequest = useOtpRequest();
  const otpVerify = useOtpVerify();
  // Custom mutationFn so the per-attempt Idempotency-Key (a uuid in a ref) is read
  // at call time and merged into the request headers — the server dedupes retries.
  const createOrder = useCreateDeliveryOrder({
    mutation: {
      mutationFn: ({ data }: { data: DeliveryOrderInput }) =>
        createDeliveryOrder(data, {
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey.current,
          },
        }),
    },
  });

  // ── Navigation handlers ───────────────────────────────────────────────────
  const handleSelectBranch = (b: PublicBranch) => setUrl({ branch: b.id, channel: undefined });

  const handleSelectChannel = (c: Channel) => {
    setUrl({ branch: branchId ?? undefined, channel: c });
    setLocationDone(false);
  };

  const resetCheckoutNav = () => {
    setEnteredCheckout(false);
    setSubmitError(null);
  };

  const handleBack = () => {
    if (step === "checkout") {
      resetCheckoutNav();
      return;
    }
    if (step === "menu") {
      // back from menu → channel (or location for outside)
      if (needsLocation) setLocationDone(false);
      else setUrl({ branch: branchId ?? undefined, channel: undefined });
      return;
    }
    if (step === "location") {
      setUrl({ branch: branchId ?? undefined, channel: undefined });
      return;
    }
    if (step === "channel") {
      setUrl({ branch: undefined, channel: undefined });
      return;
    }
  };

  // ── Cart handlers ─────────────────────────────────────────────────────────
  const addOrUpdateLine = (line: CartLine) => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.uid === line.uid);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = line;
        return next;
      }
      return [...prev, line];
    });
    setEditing(null);
  };

  const setLineQty = (uid: string, qty: number) =>
    setLines((prev) => prev.map((l) => (l.uid === uid ? { ...l, quantity: Math.max(1, qty) } : l)));

  const removeLine = (uid: string) =>
    setLines((prev) => prev.filter((l) => l.uid !== uid));

  const countByItem = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of lines) m[l.item.id] = (m[l.item.id] ?? 0) + l.quantity;
    return m;
  }, [lines]);

  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
  const subtotal = cartSubtotal(lines);
  // Estimated channel discount (server reprices authoritatively at intake).
  const discountAmount = calcDiscount(subtotal, menu?.discount);

  // Editing from the cart re-opens the menu customizer through MenuStep is not
  // direct; instead we open the cart's edit which mounts the customizer here.
  // (MenuStep owns its own customizer for "add"; edits route through it too.)
  const startEdit = (line: CartLine) => {
    setEditing(line);
    setCartOpen(false);
  };

  // ── Place order (with device-bound OTP) ───────────────────────────────────
  const buildInput = (deviceToken: string): DeliveryOrderInput => ({
    branch_id: branchId!,
    channel: selectedChannel!,
    customer_name: form.name.trim(),
    customer_phone: normalizePhone(form.phone),
    place_name: form.place_name.trim() || null,
    floor: form.floor.trim() || null,
    unit_number: form.unit_number.trim() || null,
    landmark: form.landmark.trim() || null,
    address_line: needsLocation ? address.trim() || form.address_line.trim() || null : null,
    delivery_notes: form.delivery_notes.trim() || null,
    customer_lat: needsLocation ? (point?.lat ?? null) : null,
    customer_lng: needsLocation ? (point?.lng ?? null) : null,
    payment_method_hint: form.payment,
    device_token: deviceToken,
    items: lines.map(toCartLineInput),
  });

  const submitOrder = useCallback(
    async (deviceToken: string) => {
      setSubmitError(null);
      const estimate = subtotal - discountAmount + (deliveryFee ?? 0);
      setEstimateAtSubmit(estimate);
      try {
        const order = await createOrder.mutateAsync({ data: buildInput(deviceToken) });
        setOtpOpen(false);
        setPlacedOrder(order);
      } catch {
        setSubmitError(t("order.checkout.errSubmit"));
        // Fresh idempotency key for the retry (this attempt failed).
        idempotencyKey.current = newUid();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subtotal, discountAmount, deliveryFee, form, lines, point, address, branchId, selectedChannel, needsLocation],
  );

  const validateForm = (): string | null => {
    if (!form.name.trim()) return t("order.checkout.errName");
    if (!isValidPhone(form.phone)) return t("order.checkout.errPhone");
    if (lines.length === 0) return t("order.checkout.errEmpty");
    if (needsLocation && quote?.status === "out_of_range")
      return t("order.checkout.errRange");
    if (needsLocation && !address.trim() && !form.address_line.trim())
      return t("order.checkout.errAddress");
    return null;
  };

  const handlePlace = async () => {
    const err = validateForm();
    if (err) {
      setSubmitError(err);
      return;
    }
    idempotencyKey.current = newUid();
    const existing = getDeviceToken(form.phone);
    if (existing) {
      await submitOrder(existing);
      return;
    }
    // No trusted device → request an OTP, then open the verify dialog.
    setOtpError(null);
    try {
      await otpRequest.mutateAsync({ data: { phone: normalizePhone(form.phone) } });
      setOtpOpen(true);
    } catch {
      setSubmitError(t("order.otp.errSend"));
    }
  };

  const handleVerify = async (code: string) => {
    if (code.length < 4) {
      setOtpError(t("order.otp.errCode"));
      return;
    }
    setOtpError(null);
    try {
      const res = await otpVerify.mutateAsync({
        data: { phone: normalizePhone(form.phone), code },
      });
      setDeviceToken(form.phone, res.device_token);
      await submitOrder(res.device_token);
    } catch {
      setOtpError(t("order.otp.errInvalid"));
    }
  };

  const handleResend = async () => {
    setOtpError(null);
    try {
      await otpRequest.mutateAsync({ data: { phone: normalizePhone(form.phone) } });
    } catch {
      setOtpError(t("order.otp.errSend"));
    }
  };

  const handleChangeNumber = () => {
    setOtpOpen(false);
  };

  const startNewOrder = () => {
    setPlacedOrder(null);
    setEstimateAtSubmit(null);
    setLines([]);
    setForm(emptyForm());
    setEnteredCheckout(false);
    setLocationDone(false);
    setPoint(null);
    setAddress("");
    setQuote(null);
    setSubmitError(null);
    idempotencyKey.current = newUid();
    setUrl({ branch: undefined, channel: undefined });
  };

  // ── Per-step header copy ──────────────────────────────────────────────────
  const headers = stepHeaders(step, branchObj?.name ?? "", t);

  // ── Sticky footer (view-cart bar on menu) ─────────────────────────────────
  const footer =
    step === "menu" && itemCount > 0 ? (
      <Button className="w-full justify-between" size="lg" onClick={() => setCartOpen(true)}>
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-brand-foreground/20 text-xs font-bold tabular-nums">
            {itemCount}
          </span>
          {t("order.cart.view")}
        </span>
        <span className="font-bold tabular-nums">{fmtMoney(subtotal)}</span>
      </Button>
    ) : undefined;

  const hasBack = step !== "branch" && step !== "done";

  return (
    <>
      <StepShell
        step={step}
        showLocationDot={needsLocation}
        title={headers.title}
        subtitle={headers.subtitle}
        onBack={hasBack ? handleBack : undefined}
        footer={footer}
      >
        <AnimatePresence mode="wait">
          <motion.div key={step} variants={fadeIn} initial="hidden" animate="show" exit="hidden">
            {step === "branch" && <BranchStep orgId={orgId} onSelect={handleSelectBranch} />}

            {step === "channel" && branchObj && (
              <ChannelStep branch={branchObj} onSelect={handleSelectChannel} />
            )}

            {step === "location" && branchId && (
              <LocationStep
                branchId={branchId}
                point={point}
                address={address}
                onPointChange={setPoint}
                onAddressChange={setAddress}
                onQuoteChange={setQuote}
                onContinue={() => setLocationDone(true)}
              />
            )}

            {step === "menu" && menu?.discount && (
              <div className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm font-semibold text-success">
                <BadgePercent className="size-4" />
                {menu.discount.dtype === "percentage"
                  ? t("order.menu.discountPct", {
                      defaultValue: "{{value}}% off your order",
                      value: menu.discount.value,
                    })
                  : t("order.menu.discountFixed", {
                      defaultValue: "{{value}} off your order",
                      value: fmtMoney(menu.discount.value),
                    })}
              </div>
            )}

            {step === "menu" && branchId && selectedChannel && (
              <MenuStep
                branchId={branchId}
                channel={selectedChannel}
                countByItem={countByItem}
                onAdd={addOrUpdateLine}
              />
            )}

            {step === "checkout" && selectedChannel && (
              <CheckoutStep
                channel={selectedChannel}
                form={form}
                onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                lines={lines}
                deliveryFee={deliveryFee}
                discountAmount={discountAmount}
                submitting={createOrder.isPending || otpRequest.isPending}
                error={submitError}
                onSubmit={handlePlace}
              />
            )}

            {step === "done" && placedOrder && (
              <ConfirmationStep
                order={placedOrder}
                estimatedTotal={estimateAtSubmit}
                onNewOrder={startNewOrder}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Empty-cart hint on the menu footer area */}
        {step === "menu" && itemCount === 0 && (
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-[480px] items-center justify-center gap-2 px-4 py-4 text-xs text-muted-foreground">
            <ShoppingBag className="size-3.5" />
            {t("order.cart.emptyHint")}
          </div>
        )}
      </StepShell>

      {/* Cart sheet (menu step) */}
      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        lines={lines}
        deliveryFee={deliveryFee}
        discountAmount={discountAmount}
        onEdit={startEdit}
        onRemove={removeLine}
        onSetQty={setLineQty}
        onCheckout={() => {
          setCartOpen(false);
          // Seed the checkout address from the location-step pin address (outside only).
          if (needsLocation && address.trim() && !form.address_line.trim()) {
            setForm((f) => ({ ...f, address_line: address.trim() }));
          }
          setEnteredCheckout(true);
        }}
        onAddMore={() => setCartOpen(false)}
      />

      {/* Edit customizer (re-opens a configured line from the cart) */}
      <ItemCustomizer
        item={editing?.item ?? null}
        addons={addons}
        editing={editing}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        onConfirm={addOrUpdateLine}
      />

      {/* OTP */}
      <OtpDialog
        open={otpOpen}
        onOpenChange={setOtpOpen}
        phone={form.phone}
        sending={otpRequest.isPending}
        verifying={otpVerify.isPending || createOrder.isPending}
        error={otpError}
        onVerify={handleVerify}
        onResend={handleResend}
        onChangeNumber={handleChangeNumber}
      />
    </>
  );
}

function stepHeaders(
  step: Step,
  branchName: string,
  t: TFunction,
): { title: string; subtitle?: string } {
  switch (step) {
    case "branch":
      return { title: t("order.title"), subtitle: t("order.branch.subtitle") };
    case "channel":
      return {
        title: t("order.channel.title"),
        subtitle: t("order.channel.subtitle", { name: branchName }),
      };
    case "location":
      return { title: t("order.location.title"), subtitle: t("order.location.heading") };
    case "menu":
      return { title: t("order.menu.title"), subtitle: branchName || undefined };
    case "checkout":
      return { title: t("order.checkout.title") };
    case "done":
      return { title: t("order.done.title") };
  }
}
