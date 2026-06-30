import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import {
  usePublicBranches,
  usePublicMenu,
  useDeliveryQuote,
  useCreateDeliveryOrder,
  useOtpRequest,
  useOtpVerify,
  useGuestOrderHistory,
  useGuestPastLocations,
  createDeliveryOrder,
} from "@/data/api/generated/api";
import type { PublicBranch } from "@/data/api/generated/models/publicBranch";
import type { QuoteResponse } from "@/data/api/generated/models/quoteResponse";
import type { DeliveryOrderInput } from "@/data/api/generated/models/deliveryOrderInput";
import { ArrowRight, Loader2, Search, ShoppingBag } from "lucide-react";
import type { GuestSavedLocation } from "@/data/api/generated/models/guestSavedLocation";
import { Input } from "@/components/ui/input";
import { fmtMoney } from "@/lib/format";
import { fadeIn } from "@/lib/motion";

import { isFlatChannel, type CartLine, type Channel, type Step } from "./types";
import {
  asChannel,
  calcDiscount,
  cartSubtotal,
  clearCart,
  getDeviceToken,
  isValidPhone,
  loadCart,
  newUid,
  normalizePhone,
  saveCart,
  setDeviceToken,
  toCartLineInput,
} from "./utils";
import { FIELD_LIMITS } from "./limits";
import { useOrderTheme } from "./use-order-theme";
import { StepShell } from "./components/step-shell";
import { BranchStep } from "./components/branch-step";
import { BranchSelector } from "./components/branch-selector";
import { ChannelStep } from "./components/channel-step";
import { ChannelClosed } from "./components/channel-closed";
import { PhoneStep } from "./components/phone-step";
import { LocationStep } from "./components/location-step";
import { MenuStep } from "./components/menu-step";
import { ItemCustomizer } from "./components/item-customizer";
import { CartSheet, CartPanel } from "./components/cart-sheet";
import { CheckoutStep, emptyForm, type CheckoutForm } from "./components/checkout-step";
import { CheckoutChannelSheet } from "./components/checkout-channel-sheet";
import { OtpDialog } from "./components/otp-dialog";
import { OrderHistoryDrawer } from "./components/order-history-drawer";
import type { LatLng } from "./components/delivery-map";

interface PublicOrderingPageProps {
  orgId: string;
  branch?: string;
  /** True when the branch is fixed by the URL path (scanned QR) — the branch
   *  selector is hidden and switching is disabled. */
  branchLocked?: boolean;
  channel?: string;
  /** Browse-only menu preview (read-only): show the menu even when closed. */
  preview?: boolean;
  prefillPlaceName?: string;
  prefillFloor?: string;
  prefillUnitNumber?: string;
}

export function PublicOrderingPage({
  orgId,
  branch,
  branchLocked,
  channel,
  preview,
  prefillPlaceName,
  prefillFloor,
  prefillUnitNumber,
}: PublicOrderingPageProps) {
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
    (next: { branch?: string; channel?: string; preview?: boolean }) => {
      void navigate({
        to: ".",
        replace: true,
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          branch: next.branch,
          channel: next.channel,
          // Keep the URL clean: only carry `preview` when actually browsing.
          preview: next.preview ? true : undefined,
        }),
      });
    },
    [navigate],
  );

  // ── Local flow state (beyond what the URL carries) ────────────────────────
  // Credentials resolved by the phone step — does NOT wait for profile queries.
  const [resolvedPhone, setResolvedPhone] = useState<{ phone: string; deviceToken: string } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Profile data loads in the background after phone is resolved (non-blocking).
  const { data: orders = [] } = useGuestOrderHistory(
    {
      phone: resolvedPhone ? normalizePhone(resolvedPhone.phone) : "",
      org_id: orgId,
      device_token: resolvedPhone?.deviceToken || null,
    },
    { query: { enabled: !!resolvedPhone, staleTime: 60_000, retry: false } },
  );
  const { data: locations = [] } = useGuestPastLocations(
    {
      phone: resolvedPhone ? normalizePhone(resolvedPhone.phone) : "",
      org_id: orgId,
      device_token: resolvedPhone?.deviceToken || null,
    },
    { query: { enabled: !!resolvedPhone, staleTime: 60_000, retry: false } },
  );

  // Derive customer name from the most recent order (for checkout pre-fill).
  const customerName: string | null = (orders[0] as { customer_name?: string } | undefined)?.customer_name ?? null;

  const [locationDone, setLocationDone] = useState(false);
  const [enteredCheckout, setEnteredCheckout] = useState(false);

  const [point, setPoint] = useState<LatLng | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);

  const [lines, setLines] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [editing, setEditing] = useState<CartLine | null>(null);
  const [menuQuery, setMenuQuery] = useState("");
  // Browse-mode checkout: when the customer has a cart but hasn't picked a
  // channel yet, this sheet either offers the channel chooser or — if nothing
  // is open — the warm "we're closed, cart saved" state.
  const [checkoutSheetOpen, setCheckoutSheetOpen] = useState(false);

  // ── Cart persistence (per org+branch) ─────────────────────────────────────
  // Restore once when the branch is first known, so a customer who built a cart
  // while the branch was closed keeps it on their next visit. Branch *switching*
  // (handleSwitchBranch) deliberately starts fresh, so we only auto-restore once.
  const cartRestored = useRef(false);
  useEffect(() => {
    if (cartRestored.current || !branchId) return;
    cartRestored.current = true;
    const saved = loadCart(orgId, branchId);
    if (saved.length) setLines(saved);
  }, [orgId, branchId]);

  useEffect(() => {
    if (!branchId) return;
    saveCart(orgId, branchId, lines);
  }, [orgId, branchId, lines]);

  const [form, setForm] = useState<CheckoutForm>(() => ({
    ...emptyForm(),
    place_name: prefillPlaceName ?? "",
    floor: prefillFloor ?? "",
    unit_number: prefillUnitNumber ?? "",
  }));
  const [submitError, setSubmitError] = useState<string | null>(null);

  // OTP
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const idempotencyKey = useRef<string>(newUid());

  // ── Resolve the selected branch object (needed by channel step) ───────────
  const { data: branches, isLoading: branchesLoading } = usePublicBranches({ org_id: orgId });
  const branchObj = useMemo<PublicBranch | null>(
    () => branches?.find((b) => b.id === branchId) ?? null,
    [branches, branchId],
  );

  // Recover from a stale/invalid ?branch= id: once branches have loaded, if the
  // id isn't one of them, drop it and fall back to the branch picker. Without
  // this the channel/phone steps (which need branchObj) render a blank, back-less
  // screen — a dead end.
  useEffect(() => {
    if (!branchesLoading && branchId && branches && !branches.some((b) => b.id === branchId)) {
      setUrl({ branch: undefined, channel: undefined });
    }
  }, [branchesLoading, branchId, branches, setUrl]);

  // True while we have a branch id from the URL but the branch list is still
  // loading — used to show a loader instead of a blank step.
  const branchPending = !!branchId && branchesLoading && !branchObj;

  const deliverableBranches = useMemo(
    () =>
      (branches ?? []).filter(
        (b) => b.in_mall_enabled || b.outside_enabled || b.umbrella_enabled || b.pickup_enabled,
      ),
    [branches],
  );

  // ── Browse-only mode ──────────────────────────────────────────────────────
  // A deliberate read-only menu preview (e.g. when every channel is closed). It
  // short-circuits the flow straight to the menu — no phone, no location, no open
  // channel — and the menu is fetched with `preview` so the backend returns it
  // even while closed. Display prices come from the first enabled channel
  // (preferring in-mall); a closed channel is still "enabled", so this is valid.
  const browseOnly = preview === true && !!branchObj;
  const browseChannel: Channel | null = branchObj
    ? branchObj.in_mall_enabled
      ? "in_mall"
      : branchObj.outside_enabled
        ? "outside"
        : branchObj.umbrella_enabled
          ? "umbrella"
          : branchObj.pickup_enabled
            ? "pickup"
            : null
    : null;
  // The channel whose menu/prices we actually request.
  const menuChannel: Channel = selectedChannel ?? browseChannel ?? "in_mall";
  const enterBrowse = () => setUrl({ branch: branchId ?? undefined, channel: undefined, preview: true });

  // A selected channel that isn't open right now (direct link to a closed channel,
  // or one that closed mid-session). Drives the apologetic ChannelClosed state.
  // Suppressed in browse mode — there we intentionally ignore open-now.
  const channelClosed =
    !browseOnly && !!branchObj && !!selectedChannel && !channelOpenNow(branchObj, selectedChannel);

  // No auto-selection: when no branch is in the URL (e.g. org-level QR) the
  // customer reaches the branch picker and chooses explicitly.

  // The global addon catalog (POS model) lives at the top level of the menu.
  // MenuStep fetches the same query for "add"; this dedupes via React Query and
  // supplies the catalog to the cart "edit" customizer mounted below.
  const { data: menu } = usePublicMenu(
    branchId ?? "",
    { channel: menuChannel, preview: browseOnly || undefined },
    { query: { enabled: !!branchId && ((!!selectedChannel && !channelClosed) || browseOnly) } },
  );
  const addons = menu?.addons ?? [];

  // ── Derive the active step ────────────────────────────────────────────────
  // Both channels now capture a location: outside = delivery address pin (zones);
  // in-mall = device-GPS confirm you're at the branch (anti-spam).
  // Flat channels (umbrella / pickup) capture no location. Outside = delivery pin
  // (zones); in-mall = device-GPS "confirm you're at the branch" (anti-spam).
  const needsLocation = selectedChannel != null && !isFlatChannel(selectedChannel);
  const isOutside = selectedChannel === "outside";
  const locationRequired =
    needsLocation && (isOutside || (branchObj?.in_mall_require_location ?? true));
  const step: Step = (() => {
    if (!branchId) return "branch";
    // Browse-only jumps straight to the menu — no channel/phone/location gates.
    if (browseOnly) return "menu";
    if (!selectedChannel) return "channel";
    if (!resolvedPhone) return "phone";
    if (needsLocation && !locationDone) return "location";
    if (enteredCheckout) return "checkout";
    return "menu";
  })();

  // Flat channels (umbrella / pickup) capture no location, so the location step
  // never runs its quote. Fetch the flat per-branch fee directly (coords ignored
  // server-side for these channels) so checkout can show it instead of a blank "—".
  const flatChannelSelected = selectedChannel != null && isFlatChannel(selectedChannel);
  const { data: flatQuote } = useDeliveryQuote(
    branchId ?? "",
    { lat: 0, lng: 0, channel: selectedChannel ?? "in_mall" },
    {
      query: {
        enabled: !!branchId && flatChannelSelected && !channelClosed,
        staleTime: 30_000,
        retry: false,
      },
    },
  );

  // The fee comes from the location-step quote for map channels (outside: zone
  // fee; in-mall: flat fee + haversine distance) or the flat quote above.
  const activeQuote = flatChannelSelected ? flatQuote : quote;
  const deliveryFee: number | null = activeQuote?.status === "ok" ? (activeQuote.fee ?? 0) : null;

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

  // Switch branch inline (from the header / channel selector). A different branch
  // means a different menu, so the cart starts fresh; the channel is kept when the
  // new branch supports it, otherwise the customer re-picks it.
  const handleSwitchBranch = (b: PublicBranch) => {
    if (b.id === branchId) return;
    const supports =
      selectedChannel === "in_mall"
        ? b.in_mall_enabled
        : selectedChannel === "outside"
          ? b.outside_enabled
          : selectedChannel === "umbrella"
            ? b.umbrella_enabled
            : selectedChannel === "pickup"
              ? b.pickup_enabled
              : true;
    // A different branch means a different menu AND different delivery zones — so
    // the cart starts fresh and the location/quote must be re-confirmed at the new
    // branch (otherwise a stale quote/pin from the old branch leaks into checkout).
    setLines([]);
    setEditing(null);
    setCartOpen(false);
    setEnteredCheckout(false);
    setLocationDone(false);
    setPoint(null);
    setQuote(null);
    // Drop branch/location-specific address fields; keep the customer's identity.
    setForm((f) => ({ ...f, place_name: "", floor: "", unit_number: "", landmark: "", address_line: "" }));
    // Browsing carries over to the new branch (browse its menu too); otherwise
    // keep the channel only when the new branch still supports it.
    setUrl({
      branch: b.id,
      channel: supports ? (selectedChannel ?? undefined) : undefined,
      preview: browseOnly || undefined,
    });
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
      // Browse-only: back exits the preview to the channel step (clears preview).
      if (browseOnly) {
        setUrl({ branch: branchId ?? undefined, channel: undefined, preview: undefined });
        return;
      }
      if (needsLocation) setLocationDone(false);
      else setUrl({ branch: branchId ?? undefined, channel: undefined });
      return;
    }
    if (step === "location") {
      // Back from location → back to channel selection (credentials stay valid)
      setUrl({ branch: branchId ?? undefined, channel: undefined });
      return;
    }
    if (step === "phone") {
      // Clear credentials and return to channel selection
      setResolvedPhone(null);
      setUrl({ branch: branchId ?? undefined, channel: undefined });
      return;
    }
    if (step === "channel") {
      // Drop any lingering "checkout" intent carried over from browse mode.
      setEnteredCheckout(false);
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
    setLines((prev) =>
      prev.map((l) =>
        l.uid === uid ? { ...l, quantity: Math.min(FIELD_LIMITS.lineQty, Math.max(1, qty)) } : l,
      ),
    );

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

  // Checkout requested from the cart. In the normal flow a channel is already
  // chosen, so go straight to the checkout step. In browse mode (no channel yet)
  // open the chooser sheet, which itself handles the "everything's closed" state.
  const requestCheckout = () => {
    if (browseOnly) setCheckoutSheetOpen(true);
    else setEnteredCheckout(true);
  };

  // A channel was picked from the browse-mode checkout sheet: leave the preview,
  // set the channel, and carry the cart + checkout intent through the gated flow.
  const handleChooseChannelFromBrowse = (c: Channel) => {
    setCheckoutSheetOpen(false);
    setEnteredCheckout(true);
    setLocationDone(false);
    setUrl({ branch: branchId ?? undefined, channel: c, preview: undefined });
  };

  // ── Phone step resolved ───────────────────────────────────────────────────
  const handlePhoneContinue = useCallback((phone: string, deviceToken: string) => {
    setResolvedPhone({ phone, deviceToken });
    // Pre-fill phone in checkout form immediately; name will be filled when
    // the background profile query resolves (via the effect below).
    setForm((f) => ({ ...f, phone }));
  }, []);

  // When the background order history loads, pre-fill customer name if not yet set.
  useEffect(() => {
    if (!customerName) return;
    setForm((f) => (f.name ? f : { ...f, name: customerName }));
  }, [customerName]);

  // ── Apply a saved address to checkout form (all fields, not just lat/lng) ──
  const handleApplySavedAddress = useCallback((loc: GuestSavedLocation) => {
    setForm((f) => ({
      ...f,
      address_line: loc.address_line ?? f.address_line,
      place_name: loc.place_name ?? f.place_name,
      floor: loc.floor ?? f.floor,
      unit_number: loc.unit_number ?? f.unit_number,
      landmark: loc.landmark ?? f.landmark,
    }));
  }, []);

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
    address_line: isOutside ? form.address_line.trim() || null : null,
    delivery_notes: form.delivery_notes.trim() || null,
    // Both channels send the captured coordinates (in-mall: device GPS for the
    // anti-spam distance; outside: the delivery pin).
    customer_lat: point?.lat ?? null,
    customer_lng: point?.lng ?? null,
    payment_method_hint: form.payment,
    device_token: deviceToken,
    items: lines.map(toCartLineInput),
  });

  const submitOrder = useCallback(
    async (deviceToken: string) => {
      setSubmitError(null);
      const estimate = subtotal - discountAmount + (deliveryFee ?? 0);
      try {
        const order = await createOrder.mutateAsync({ data: buildInput(deviceToken) });
        setOtpOpen(false);
        // Order placed — forget the persisted cart so a return visit starts clean.
        if (branchId) clearCart(orgId, branchId);
        setLines([]);
        // Route to the live tracking page (dynamic link with the order UUID). The
        // estimate is carried so the tracking page can flag a backend reprice.
        void navigate({ to: "/track/$id", params: { id: order.id }, search: { est: estimate } });
      } catch (e) {
        const status = (e as { response?: { status?: number } })?.response?.status;
        setSubmitError(
          status === 409
            ? t("order.checkout.errChannelClosed", {
                defaultValue: "Sorry — this branch just stopped accepting orders on this channel.",
              })
            : t("order.checkout.errSubmit"),
        );
        setOtpOpen(false);
        // Fresh idempotency key for the retry (this attempt failed).
        idempotencyKey.current = newUid();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [subtotal, discountAmount, deliveryFee, form, lines, point, branchId, selectedChannel, needsLocation],
  );

  const validateForm = (): string | null => {
    if (!form.name.trim()) return t("order.checkout.errName");
    // Length guards mirror the backend caps (the inputs also enforce maxLength —
    // this is the authoritative client gate against paste/programmatic edits).
    if (form.name.trim().length > FIELD_LIMITS.name)
      return t("order.checkout.errTooLong", { defaultValue: "That entry is too long." });
    if (
      form.address_line.trim().length > FIELD_LIMITS.address ||
      form.delivery_notes.trim().length > FIELD_LIMITS.notes ||
      form.place_name.trim().length > FIELD_LIMITS.shortText ||
      form.floor.trim().length > FIELD_LIMITS.shortText ||
      form.unit_number.trim().length > FIELD_LIMITS.shortText ||
      form.landmark.trim().length > FIELD_LIMITS.shortText
    )
      return t("order.checkout.errTooLong", { defaultValue: "That entry is too long." });
    if (!isValidPhone(form.phone)) return t("order.checkout.errPhone");
    if (lines.length === 0) return t("order.checkout.errEmpty");
    if (lines.length > FIELD_LIMITS.cartLines)
      return t("order.checkout.errTooManyItems", {
        defaultValue: "Your cart has too many items. Please remove some.",
      });
    // A confirmed location is required for outside (delivery pin) and for in-mall
    // unless the branch relaxed the GPS check. Then channel-specific fields.
    if (locationRequired && !point)
      return t("order.checkout.errLocation", {
        defaultValue: "Please confirm your location.",
      });
    if (isOutside) {
      if (quote?.status === "out_of_range") return t("order.checkout.errRange");
      if (!form.address_line.trim()) return t("order.checkout.errAddress");
    } else if (selectedChannel === "umbrella") {
      // Umbrella # is stored in place_name; section (optional) in landmark.
      if (!form.place_name.trim())
        return t("order.checkout.errUmbrella", {
          defaultValue: "Please enter your umbrella or sunbed number.",
        });
    } else if (selectedChannel === "pickup") {
      // Self-collect: name + phone (checked above) are enough.
    } else {
      if (!form.place_name.trim())
        return t("order.checkout.errShop", {
          defaultValue: "Please enter the shop or company name.",
        });
      if (!form.floor.trim())
        return t("order.checkout.errFloor", { defaultValue: "Please enter the floor." });
      if (!form.unit_number.trim())
        return t("order.checkout.errUnit", {
          defaultValue: "Please enter the unit or office number.",
        });
    }
    return null;
  };

  const handlePlace = async () => {
    // Guard against a double-tap firing a second OTP request / order before the
    // button's disabled state catches up.
    if (createOrder.isPending || otpRequest.isPending) return;
    if (channelClosed) {
      setSubmitError(
        t("order.checkout.errChannelClosed", {
          defaultValue: "Sorry — this branch just stopped accepting orders on this channel.",
        }),
      );
      return;
    }
    const err = validateForm();
    if (err) {
      setSubmitError(err);
      return;
    }
    idempotencyKey.current = newUid();
    // OTP is optional per branch — when the branch has it off, place the order
    // directly with no verification (no request, no dialog).
    if (branchObj && branchObj.otp_required === false) {
      await submitOrder("");
      return;
    }
    // If OTP was already done in the phone step (or was cached from a previous visit),
    // the resolved token is used directly without re-challenging.
    if (resolvedPhone?.deviceToken) {
      await submitOrder(resolvedPhone.deviceToken);
      return;
    }
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

  // ── Per-step header copy ──────────────────────────────────────────────────
  const headers = channelClosed
    ? { title: t("order.channel.heading", "How would you like it?"), subtitle: undefined }
    : stepHeaders(step, branchObj?.name ?? "", t);

  // ── Sticky footer (view-cart bar on menu) ─────────────────────────────────
  const footer =
    step === "menu" && itemCount > 0 && !channelClosed ? (
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="flex w-full items-center justify-between rounded-full bg-foreground px-5 py-3.5 text-background shadow-lg transition-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="inline-flex items-center gap-2.5">
          <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-brand px-2 py-0.5 text-xs font-bold tabular-nums text-brand-foreground">
            {itemCount}
          </span>
          <span className="text-sm">{t("order.cart.units", { count: itemCount, defaultValue: "items" })}</span>
        </span>
        <span className="inline-flex items-center gap-2 text-sm font-semibold tabular-nums">
          {fmtMoney(subtotal)}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </span>
      </button>
    ) : undefined;

  // Desktop menu search lives in the header (mobile renders its own inside MenuStep).
  const headerSearch =
    step === "menu" && !channelClosed ? (
      <div className="relative w-full">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={menuQuery}
          onChange={(e) => setMenuQuery(e.target.value)}
          placeholder={t("order.menu.search")}
          className="ps-9 rounded-full"
          inputMode="search"
        />
      </div>
    ) : undefined;

  // Every step except the first (branch picker) has a back button. The channel
  // step returns to the branch picker — important so it's never a dead end when
  // there's only one deliverable branch (no inline branch selector to escape via).
  const hasBack = step !== "branch";

  return (
    <>
      <StepShell
        step={step}
        showLocationDot={needsLocation}
        title={headers.title}
        subtitle={headers.subtitle}
        onBack={
          channelClosed
            ? () => setUrl({ branch: branchId ?? undefined, channel: undefined })
            : hasBack
              ? handleBack
              : undefined
        }
        branchSelector={
          branchLocked ? undefined : (
            <BranchSelector
              branches={deliverableBranches}
              currentId={branchId ?? ""}
              onSelect={handleSwitchBranch}
            />
          )
        }
        headerSearch={headerSearch}
        wide={step === "menu" && !channelClosed}
        footer={footer}
        onOpenHistory={orders.length > 0 ? () => setHistoryOpen(true) : undefined}
        historyCount={orders.length}
      >
        <AnimatePresence mode="wait">
          <motion.div key={step} variants={fadeIn} initial="hidden" animate="show" exit="hidden">
            {/* Branch list still loading for a pre-selected ?branch= id — show a
                loader rather than the blank channel/phone step. */}
            {branchPending && (
              <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
                <p className="text-sm">{t("common.loading", "Loading…")}</p>
              </div>
            )}

            {step === "branch" && (
              <BranchStep
                orgId={orgId}
                onSelect={handleSelectBranch}
                onPreview={(b) => setUrl({ branch: b.id, channel: undefined, preview: true })}
              />
            )}

            {step === "channel" && branchObj && (
              <div className="space-y-4">
                {!branchLocked && deliverableBranches.length > 1 && (
                  <div className="flex justify-center">
                    <BranchSelector
                      branches={deliverableBranches}
                      currentId={branchId ?? ""}
                      onSelect={handleSwitchBranch}
                      align="center"
                    />
                  </div>
                )}
                <ChannelStep branch={branchObj} onSelect={handleSelectChannel} onBrowse={enterBrowse} />
              </div>
            )}

            {channelClosed && selectedChannel && (
              <ChannelClosed
                channel={selectedChannel}
                onChoose={() => setUrl({ branch: branchId ?? undefined, channel: undefined })}
                onBrowse={enterBrowse}
              />
            )}

            {step === "phone" && branchObj && selectedChannel && !channelClosed && (
              <PhoneStep
                orgId={orgId}
                otpRequired={branchObj.otp_required}
                onContinue={handlePhoneContinue}
              />
            )}

            {step === "location" && branchId && selectedChannel && !channelClosed && (
              <LocationStep
                branchId={branchId}
                channel={selectedChannel}
                point={point}
                required={locationRequired}
                savedLocations={locations as GuestSavedLocation[]}
                onPointChange={setPoint}
                onQuoteChange={setQuote}
                onApplySavedAddress={handleApplySavedAddress}
                onContinue={() => setLocationDone(true)}
              />
            )}

            {step === "menu" && branchId && (selectedChannel ?? browseChannel) && (!channelClosed || browseOnly) && (
              <MenuStep
                branchId={branchId}
                channel={menuChannel}
                browseOnly={browseOnly}
                onExitBrowse={() => setUrl({ branch: branchId ?? undefined, channel: undefined, preview: undefined })}
                countByItem={countByItem}
                onAdd={addOrUpdateLine}
                query={menuQuery}
                onQueryChange={setMenuQuery}
                cartSlot={
                  <CartPanel
                    lines={lines}
                    deliveryFee={deliveryFee}
                    discountAmount={discountAmount}
                    onEdit={startEdit}
                    onRemove={removeLine}
                    onSetQty={setLineQty}
                    onCheckout={requestCheckout}
                  />
                }
              />
            )}

            {step === "checkout" && selectedChannel && !channelClosed && (
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
                phoneReadOnly={!!resolvedPhone}
              />
            )}

          </motion.div>
        </AnimatePresence>

        {/* Empty-cart hint on the menu footer area (mobile / tablet only) */}
        {step === "menu" && itemCount === 0 && (
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-[480px] items-center justify-center gap-2 px-4 py-4 text-xs text-muted-foreground xl:hidden">
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
          requestCheckout();
        }}
        onAddMore={() => setCartOpen(false)}
      />

      {/* Browse-mode checkout: pick a channel, or the warm "closed" state */}
      {branchObj && (
        <CheckoutChannelSheet
          open={checkoutSheetOpen}
          onOpenChange={setCheckoutSheetOpen}
          branch={branchObj}
          itemCount={itemCount}
          subtotal={subtotal}
          onChoose={handleChooseChannelFromBrowse}
        />
      )}

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

      {/* Order history drawer */}
      <OrderHistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        orders={orders}
      />
    </>
  );
}

/** Effective open-now for a channel on a public branch. */
function channelOpenNow(b: PublicBranch | null | undefined, c: Channel | null): boolean {
  if (!b || !c) return false;
  switch (c) {
    case "in_mall":
      return b.in_mall_open_now;
    case "outside":
      return b.outside_open_now;
    case "umbrella":
      return b.umbrella_open_now;
    case "pickup":
      return b.pickup_open_now;
  }
}

function stepHeaders(
  step: Step,
  branchName: string,
  t: TFunction,
): { title: string; subtitle?: string } {
  switch (step) {
    case "branch":
      return { title: t("order.branch.heading", "Choose a branch"), subtitle: t("order.branch.subtitle") };
    case "channel":
      return {
        title: t("order.channel.heading", "How would you like it?"),
        subtitle: t("order.channel.subtitle", { name: branchName }),
      };
    case "phone":
      return { title: t("order.phone.heading", "Your number"), subtitle: t("order.phone.headingSubtitle", { name: branchName }) };
    case "location":
      return { title: t("order.location.short", "Where to?") };
    case "menu":
      return { title: t("order.menu.title") };
    case "checkout":
      return { title: t("order.checkout.title") };
    case "done":
      return { title: t("order.done.title") };
  }
}
