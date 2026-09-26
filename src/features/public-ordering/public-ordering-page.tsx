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
  useGuestOrderHistory,
  useGuestPastLocations,
  createDeliveryOrder,
} from "@/data/api/generated/api";
import type { PublicBranch } from "@/data/api/generated/models/publicBranch";
import type { QuoteResponse } from "@/data/api/generated/models/quoteResponse";
import type { DeliveryOrderInput } from "@/data/api/generated/models/deliveryOrderInput";
import { ArrowRight, Info, Loader2, MapPin, Search, ShoppingBag, Store } from "lucide-react";
import type { GuestSavedLocation } from "@/data/api/generated/models/guestSavedLocation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmtMoney } from "@/lib/format";
import { fadeIn } from "@/lib/motion";

import { isFlatChannel, type CartLine, type Channel, type Step } from "./types";
import { asChannel, calcDiscount, clearCart, loadCart, newUid, saveCart, toCartLineInput } from "./utils";
import { getDeviceToken, setDeviceToken } from "@/features/public-shell/guest";
import { canonicalPhone, formatPhoneInput, isValidPhone, samePhone } from "@/lib/phone";
import { FIELD_LIMITS } from "./limits";
import { usePublicTheme } from "@/features/public-shell/use-public-theme";
import { usePublicBrand } from "@/features/public-shell/use-brand";
import { useErrorToast } from "@/features/public-shell/public-toaster";
import { StepShell } from "./components/step-shell";
import { BranchStep } from "./components/branch-step";
import { BranchSelector } from "./components/branch-selector";
import { ChannelStep } from "./components/channel-step";
import { ChannelClosed } from "./components/channel-closed";
import { otpRefusal, useOtpTransport } from "@/features/public-shell/use-phone-otp";
import { PhoneStep } from "./components/phone-step";
import { LocationStep } from "./components/location-step";
import { MenuStep } from "./components/menu-step";
import { ItemCustomizer } from "./components/item-customizer";
import { ComboCustomizer } from "./components/combo-customizer";
import { isCombo } from "./combo";
import { useCartQuote } from "./use-cart-quote";
import { getErrorMessage } from "@/data/api/errors";
import { CartSheet, CartPanel } from "./components/cart-sheet";
import { CheckoutStep, emptyForm, type CheckoutForm } from "./components/checkout-step";
import { CheckoutChannelSheet } from "./components/checkout-channel-sheet";
import { OtpDialog } from "./components/otp-dialog";
import { OrderHistoryDrawer } from "./components/order-history-drawer";
import type { LatLng } from "./components/delivery-map";
import { addressForChannel, identityRefusal, type OrderIdentityFields, type OrderNowSession, type PlaceOutcome } from "./order-now/session";
import { useOrderIdentity } from "./order-now/use-order-identity";

interface PublicOrderingPageProps {
  orgId: string;
  branch?: string;
  /** True when the branch is fixed by the URL path (scanned QR) — the branch
   *  selector is hidden and switching is disabled. */
  branchLocked?: boolean;
  channel?: string;
  /** Browse-only menu preview (read-only): show the menu even when closed. */
  preview?: boolean;
  /**
   * The shop's read-only MENU (`/menu`): browse mode with the menu's own
   * voice — its heading and tab title, no add buttons, no cart — and an
   * "Order now" bar only where the branch takes orders.
   */
  menuMode?: boolean;
  prefillPlaceName?: string;
  prefillFloor?: string;
  prefillUnitNumber?: string;
  /**
   * "Order now" from a loyalty card: the customer is already known and proved
   * on this device. The flow opens on the menu with what they last used, the
   * phone step never runs, and a changed name or phone is asked about at
   * checkout. Absent, this page is exactly what it was.
   */
  orderNow?: OrderNowSession;
}

/** What goes on the wire: canonical digits. Callers validate first; "" never matches a guest. */
const wirePhone = (raw: string): string => canonicalPhone(raw) ?? "";

export function PublicOrderingPage({
  orgId,
  branch,
  branchLocked,
  channel,
  preview,
  menuMode = false,
  prefillPlaceName,
  prefillFloor,
  prefillUnitNumber,
  orderNow,
}: PublicOrderingPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Scope the order flow to its own light-by-default theme, then restore the
  // dashboard's global theme when the customer leaves the flow.
  useLayoutEffect(() => {
    usePublicTheme.getState().apply();
    return () => usePublicTheme.getState().restoreGlobal();
  }, []);

  // Whose shop this is. The tier is resolved server-side, so this is simply
  // "the shop's identity" — a shop off the branding tier gets Madar's palette
  // back under its own name, and the page never asks which it received.
  const brand = usePublicBrand(orgId);
  // The tab says what the page is: the shop's menu, not "Madar — Order".
  useEffect(() => {
    if (menuMode && brand?.orgName) {
      document.title = `${t("order.menuMode.title", "Menu")} · ${brand.orgName}`;
    }
  }, [menuMode, brand?.orgName, t]);

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
  const [resolvedPhone, setResolvedPhone] = useState<{ phone: string; deviceToken: string } | null>(() =>
    orderNow ? { phone: orderNow.customer.phone, deviceToken: orderNow.deviceToken } : null,
  );
  // From a card, the customer IS the resolved phone — including after they
  // replace their number mid-order, when both the phone and its token change.
  const cardPhone = orderNow?.customer.phone;
  const cardDeviceToken = orderNow?.deviceToken;
  useEffect(() => {
    if (cardPhone && cardDeviceToken) setResolvedPhone({ phone: cardPhone, deviceToken: cardDeviceToken });
  }, [cardPhone, cardDeviceToken]);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Profile data loads in the background after phone is resolved (non-blocking).
  // The backend REQUIRES the OTP device token for history and saved addresses
  // (401 without it), so only ask when we have one; with no token the guest
  // simply has no history/saved addresses (e.g. branches with OTP turned off).
  const hasGuestToken = !!resolvedPhone?.deviceToken;
  const { data: orders = [] } = useGuestOrderHistory(
    {
      phone: resolvedPhone ? wirePhone(resolvedPhone.phone) : "",
      org_id: orgId,
      device_token: resolvedPhone?.deviceToken || null,
    },
    { query: { enabled: hasGuestToken, staleTime: 60_000, retry: false } },
  );
  const { data: locations = [] } = useGuestPastLocations(
    {
      phone: resolvedPhone ? wirePhone(resolvedPhone.phone) : "",
      org_id: orgId,
      device_token: resolvedPhone?.deviceToken || null,
    },
    { query: { enabled: hasGuestToken, staleTime: 60_000, retry: false } },
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
    ...(orderNow
      ? {
          name: orderNow.customer.name,
          phone: formatPhoneInput(orderNow.customer.phone),
          payment: orderNow.paymentHint ?? "cash",
        }
      : {}),
    place_name: prefillPlaceName ?? "",
    floor: prefillFloor ?? "",
    unit_number: prefillUnitNumber ?? "",
  }));
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // OTP
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  // Also as a toast: the inline copy sits where the customer may have scrolled from.
  useErrorToast(submitError);
  useErrorToast(phoneError);
  useErrorToast(otpError);
  const idempotencyKey = useRef<string>(newUid());

  // ── Resolve the selected branch object (needed by channel step) ───────────
  // Browsing lists every branch: a shop with ordering off still has a menu.
  const { data: branches, isLoading: branchesLoading } = usePublicBranches({
    org_id: orgId,
    browse: preview || undefined,
  });
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
  // Which branches the header's switcher offers: to ORDER, the ones taking
  // orders; to BROWSE the menu, every active branch (the list was fetched with
  // `browse`) — a branch with ordering off still has a menu to read.
  const switchableBranches = preview ? (branches ?? []) : deliverableBranches;

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
  // The channel whose menu/prices we actually request. A branch that takes no
  // online orders shows its dine-in menu, read-only.
  const menuChannel: Channel | "dine_in" =
    selectedChannel ?? browseChannel ?? (browseOnly ? "dine_in" : "in_mall");
  const menuOnly = browseOnly && browseChannel == null;
  const branchOpenNow =
    !!branchObj &&
    (branchObj.in_mall_open_now ||
      branchObj.outside_open_now ||
      branchObj.umbrella_open_now ||
      branchObj.pickup_open_now);
  const enterBrowse = () => setUrl({ branch: branchId ?? undefined, channel: undefined, preview: true });
  // From the MENU to an order at this branch: the ordering flow's own entry
  // (this bundle's root), not a search-param flip — `/menu` is browse by route.
  const startOrder = () =>
    window.location.assign(
      `${import.meta.env.BASE_URL}${branchId ? `?branch=${encodeURIComponent(branchId)}` : ""}`,
    );

  // A selected channel that isn't open right now (direct link to a closed channel,
  // or one that closed mid-session). Drives the apologetic ChannelClosed state.
  // Suppressed in browse mode — there we intentionally ignore open-now.
  const channelClosed =
    !browseOnly && !!branchObj && !!selectedChannel && !channelOpenNow(branchObj, selectedChannel);

  // The menu link of a one-branch shop opens straight on that branch's menu:
  // a picker with one choice in it is a tap for nothing.
  useEffect(() => {
    if (preview && !branchId && branches?.length === 1) {
      setUrl({ branch: branches[0].id, channel: undefined, preview: true });
    }
  }, [preview, branchId, branches, setUrl]);

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

  // ── "Order now": open where they left off ────────────────────────────────
  // The saved address for the channel they last used. Applied once, when the
  // branch and channel on screen are the ones it was saved for; the server has
  // already re-checked it, and `stale` sends the customer to the location step
  // with the reason instead of silently dropping what they had.
  const cardAddress = useMemo(
    () => (orderNow ? addressForChannel(orderNow.addresses, orderNow.lastBranch?.channel) : null),
    [orderNow],
  );
  const onLastBranch =
    !!orderNow?.lastBranch && branchId === orderNow.lastBranch.id && selectedChannel === orderNow.lastBranch.channel;
  const addressApplied = useRef(false);
  useEffect(() => {
    if (addressApplied.current || !onLastBranch || !branchObj || !cardAddress || cardAddress.stale) return;
    addressApplied.current = true;
    setForm((f) => ({
      ...f,
      address_line: cardAddress.address_line ?? f.address_line,
      place_name: cardAddress.place_name ?? f.place_name,
      floor: cardAddress.floor ?? f.floor,
      unit_number: cardAddress.unit_number ?? f.unit_number,
      landmark: cardAddress.landmark ?? f.landmark,
      delivery_notes: cardAddress.delivery_notes ?? f.delivery_notes,
    }));
    const pinned = cardAddress.lat != null && cardAddress.lng != null;
    if (selectedChannel === "outside" && pinned) {
      // A delivery pin they have used before: straight to the menu.
      setPoint({ lat: cardAddress.lat!, lng: cardAddress.lng! });
      setLocationDone(true);
    } else if (selectedChannel === "in_mall" && !branchObj.in_mall_require_location) {
      // In-mall asks for the DEVICE's location (proof of being there), which a
      // saved address cannot stand in for — skipped only where the branch does not ask.
      setLocationDone(true);
    }
  }, [onLastBranch, branchObj, cardAddress, selectedChannel]);

  // The location step computes the quote; skipped, somebody else has to.
  const { data: prefillQuote } = useDeliveryQuote(
    branchId ?? "",
    { lat: point?.lat ?? 0, lng: point?.lng ?? 0, channel: selectedChannel ?? "in_mall" },
    {
      query: {
        enabled: !!orderNow && !!branchId && !!point && needsLocation && locationDone && !quote && !channelClosed,
        staleTime: 30_000,
        retry: false,
      },
    },
  );
  const mapQuote = quote ?? prefillQuote ?? null;
  // Re-validated at open time, and again here: a pin that turns out to be out
  // of range goes back to the location step rather than failing at checkout.
  const [pinRefused, setPinRefused] = useState(false);
  const prefillOutOfRange = !quote && prefillQuote?.status === "out_of_range";
  useEffect(() => {
    if (!prefillOutOfRange) return;
    setPinRefused(true);
    setLocationDone(false);
  }, [prefillOutOfRange]);

  /** A gentle line above the one step that needs asking again, and why. */
  const cardNotice: { step: Step; text: string } | null = (() => {
    if (!orderNow) return null;
    const last = orderNow.lastBranch;
    if (last?.stale && last.stale_reason === "channel_closed")
      return {
        step: "channel",
        text: t("order.now.staleChannel", {
          defaultValue: "{{branch}} isn’t taking that kind of order right now. Pick another way to get it — everything else is as you left it.",
          branch: last.name,
        }),
      };
    if (last?.stale)
      return {
        step: "branch",
        text: t("order.now.staleBranch", {
          defaultValue: "{{branch}} isn’t taking online orders right now. Pick another branch — your details are still filled in.",
          branch: last.name,
        }),
      };
    if (onLastBranch && (cardAddress?.stale || pinRefused)) {
      const label = cardAddress?.label?.trim() || t("order.now.yourAddress", "your saved address");
      return {
        step: "location",
        text:
          cardAddress?.stale_reason === "zone_unavailable"
            ? t("order.now.staleZone", { defaultValue: "Delivery to {{label}} is paused right now. Choose where to send this order.", label })
            : t("order.now.staleAddress", {
                defaultValue: "{{label}} is outside {{branch}}’s delivery area now. Choose where to send this order.",
                label,
                branch: branchObj?.name ?? "",
              }),
      };
    }
    return null;
  })();

  // The fee comes from the location-step quote for map channels (outside: zone
  // fee; in-mall: flat fee + haversine distance) or the flat quote above.
  const activeQuote = flatChannelSelected ? flatQuote : mapQuote;
  const deliveryFee: number | null = activeQuote?.status === "ok" ? (activeQuote.fee ?? 0) : null;

  // ── Mutations ─────────────────────────────────────────────────────────────
  // Checkout's OTP talks to the same endpoints as the phone step, through the same transport.
  const otp = useOtpTransport();
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
  // The server's price for this cart on this channel, deals applied — what
  // intake will charge for the items. Falls back to the estimate silently.
  // A read-only menu has no cart to price; the quote needs a real channel.
  const quoteChannel: Channel = menuChannel === "dine_in" ? "in_mall" : menuChannel;
  const pricing = useCartQuote({ kind: "branch", id: branchId, channel: quoteChannel }, lines);
  const itemsAfterDeals = pricing.afterDeals;
  // Estimated channel discount. Intake takes it off what is left AFTER the
  // deals, so this does too (server reprices authoritatively at intake).
  const discountAmount = calcDiscount(itemsAfterDeals, menu?.discount);

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
    // The step hands over the CANONICAL number (201…); the field wants what a
    // person types (01…), or it reads "+20 2010…" under its own +20 prefix.
    setForm((f) => ({ ...f, phone: formatPhoneInput(phone) }));
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
    customer_phone: wirePhone(form.phone),
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

  // Send the order and say how it went. It never throws and never writes the
  // error itself: from a card, some refusals are questions to put to the
  // customer (`useOrderIdentity`), not failures to report.
  const sendOrder = async (identity: OrderIdentityFields): Promise<PlaceOutcome> => {
    setSubmitError(null);
    const estimate = itemsAfterDeals - discountAmount + (deliveryFee ?? 0);
    try {
      const order = await createOrder.mutateAsync({ data: { ...buildInput(identity.device_token), ...identity } });
      setOtpOpen(false);
      // Order placed — forget the persisted cart so a return visit starts clean.
      if (branchId) clearCart(orgId, branchId);
      setLines([]);
      // Route to the live tracking page (dynamic link with the order UUID). The
      // estimate is carried so the tracking page can flag a backend reprice.
      void navigate({ to: "/track/$id", params: { id: order.id }, search: { est: estimate } });
      return { ok: true };
    } catch (e) {
      setOtpOpen(false);
      // Fresh idempotency key for the retry (this attempt failed).
      idempotencyKey.current = newUid();
      const { status, code } = identityRefusal(e);
      // A coded refusal reads in the customer's language (a combo missing
      // its picks, an item that just sold out) rather than "try again".
      return { ok: false, status, code, message: code ? getErrorMessage(e) : undefined };
    }
  };

  const reportOutcome = (outcome: PlaceOutcome) => {
    if (outcome.ok) return;
    setSubmitError(
      // A bare 409 is the channel closing under the order; one with a code is its own story.
      outcome.status === 409 && !outcome.code
        ? t("order.checkout.errChannelClosed", {
            defaultValue: "Sorry — this branch just stopped accepting orders on this channel.",
          })
        : (outcome.message ?? t("order.checkout.errSubmit")),
    );
  };

  const submitOrder = async (deviceToken: string) => reportOutcome(await sendOrder({ device_token: deviceToken }));

  const identity = useOrderIdentity({
    session: orderNow ?? null,
    typed: { name: form.name, phone: form.phone },
    otpRequired: branchObj?.otp_required !== false,
    hasAddress: selectedChannel !== "pickup",
    place: sendOrder,
    report: reportOutcome,
    onKeepNumber: () => orderNow && setForm((f) => ({ ...f, phone: formatPhoneInput(orderNow.customer.phone) })),
  });

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
      if (mapQuote?.status === "out_of_range") return t("order.checkout.errRange");
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
    if (createOrder.isPending || otp.sending || identity.busy) return;
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
    // From a card the customer is already proved; what is left to settle is
    // whether the name or number they typed is theirs.
    if (orderNow) {
      await identity.begin();
      return;
    }
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
    setPhoneError(null);
    try {
      await otp.requestCode(wirePhone(form.phone));
      setOtpOpen(true);
    } catch (err) {
      const refused = otpRefusal(err);
      if (refused) setPhoneError(refused);
      else setSubmitError(t("order.otp.errSend"));
    }
  };

  const handleVerify = async (code: string) => {
    if (code.length < 4) {
      setOtpError(t("order.otp.errCode"));
      return;
    }
    setOtpError(null);
    try {
      const deviceToken = await otp.verifyCode(wirePhone(form.phone), code);
      setDeviceToken(form.phone, deviceToken);
      // A token verified at checkout also unlocks this guest's history.
      setResolvedPhone((prev) =>
        prev && samePhone(prev.phone, form.phone)
          ? { ...prev, deviceToken }
          : prev,
      );
      await submitOrder(deviceToken);
    } catch {
      setOtpError(t("order.otp.errInvalid"));
    }
  };

  const handleResend = async () => {
    setOtpError(null);
    try {
      await otp.requestCode(wirePhone(form.phone));
    } catch (err) {
      setOtpError(otpRefusal(err) ?? t("order.otp.errSend"));
    }
  };

  const handleChangeNumber = () => {
    setOtpOpen(false);
  };

  // ── Per-step header copy ──────────────────────────────────────────────────
  const headers = channelClosed
    ? { title: t("order.channel.heading", "How would you like it?"), subtitle: undefined }
    : menuMode && step === "branch"
      ? {
          title: t("order.branch.heading", "Choose a branch"),
          subtitle: t("order.menuMode.pickBranch", "Pick a branch to see its menu"),
        }
      : stepHeaders(step, branchObj?.name ?? "", t);

  // ── Sticky footer (view-cart bar on menu) ─────────────────────────────────
  const footer =
    step === "menu" && itemCount > 0 && !channelClosed && !menuMode ? (
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
          {fmtMoney(itemsAfterDeals)}
          <ArrowRight className="size-4 rtl:rotate-180" />
        </span>
      </button>
    ) : step === "menu" && itemCount === 0 && !menuMode ? (
      // In the same floating slot as the cart bar it turns into, so the page
      // keeps room for it — laid over the page, it sat on the footer's links.
      <div className="pointer-events-none flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
        <ShoppingBag className="size-3.5" />
        {t("order.cart.emptyHint")}
      </div>
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
              branches={switchableBranches}
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
        brand={brand}
        hideProgress={menuMode}
        menuHeading={
          menuMode
            ? { title: t("order.menuMode.title", "Menu"), subtitle: branchObj?.name }
            : undefined
        }
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

            {cardNotice && cardNotice.step === step && !branchPending ? (
              <p role="status" className="mb-4 flex items-start gap-2.5 rounded-2xl border border-border/70 bg-muted/40 p-3.5 text-sm">
                <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
                <span className="text-pretty">{cardNotice.text}</span>
              </p>
            ) : null}

            {step === "branch" && (
              <BranchStep
                orgId={orgId}
                onSelect={
                  preview
                    ? (b) => setUrl({ branch: b.id, channel: undefined, preview: true })
                    : handleSelectBranch
                }
                onPreview={(b) => setUrl({ branch: b.id, channel: undefined, preview: true })}
                browse={preview}
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

            {step === "menu" && orderNow && selectedChannel && branchObj && !channelClosed && !browseOnly ? (
              <OrderNowSummary
                channel={selectedChannel}
                branchName={branchObj.name}
                firstName={orderNow.customer.name.trim().split(/\s+/)[0] ?? ""}
                place={
                  needsLocation
                    ? (onLastBranch && cardAddress && !cardAddress.stale ? cardAddress.label?.trim() : "") ||
                      form.place_name.trim() ||
                      form.address_line.trim()
                    : ""
                }
                onChange={() => {
                  if (needsLocation) setLocationDone(false);
                  else setUrl({ branch: branchId ?? undefined, channel: undefined });
                }}
              />
            ) : null}

            {step === "menu" && branchId && (selectedChannel ?? browseChannel ?? (browseOnly ? "dine_in" : null)) && (!channelClosed || browseOnly) && (
              <MenuStep
                branchId={branchId}
                channel={menuChannel}
                browseOnly={browseOnly}
                open={branchOpenNow}
                readOnly={menuOnly}
                menuMode={menuMode}
                onOrder={menuMode && browseChannel ? startOrder : undefined}
                onExitBrowse={() => setUrl({ branch: branchId ?? undefined, channel: undefined, preview: undefined })}
                countByItem={countByItem}
                onAdd={addOrUpdateLine}
                query={menuQuery}
                onQueryChange={setMenuQuery}
                cartSlot={
                  menuOnly || menuMode ? undefined : (
                    <CartPanel
                      lines={lines}
                      deliveryFee={deliveryFee}
                      discountAmount={discountAmount}
                      onEdit={startEdit}
                      onRemove={removeLine}
                      onSetQty={setLineQty}
                      onCheckout={requestCheckout}
                      quote={pricing.quote}
                    />
                  )
                }
              />
            )}

            {step === "checkout" && selectedChannel && !channelClosed && (
              <CheckoutStep
                channel={selectedChannel}
                form={form}
                onChange={(patch) => {
                  if ("phone" in patch) setPhoneError(null);
                  setForm((f) => ({ ...f, ...patch }));
                }}
                lines={lines}
                deliveryFee={deliveryFee}
                discountAmount={discountAmount}
                quote={pricing.quote}
                submitting={createOrder.isPending || otp.sending || identity.busy}
                error={submitError}
                phoneError={phoneError}
                onSubmit={handlePlace}
                // From a card the number stays editable: an order for someone
                // else, or a new number, is exactly what the question is for.
                phoneReadOnly={!!resolvedPhone && !orderNow}
                identitySlot={identity.inline}
              />
            )}

          </motion.div>
        </AnimatePresence>

        {/* Empty-cart hint on the menu footer area (mobile / tablet only) */}
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
        quote={pricing.quote}
      />

      {/* Browse-mode checkout: pick a channel, or the warm "closed" state */}
      {branchObj && (
        <CheckoutChannelSheet
          open={checkoutSheetOpen}
          onOpenChange={setCheckoutSheetOpen}
          branch={branchObj}
          itemCount={itemCount}
          subtotal={itemsAfterDeals}
          onChoose={handleChooseChannelFromBrowse}
        />
      )}

      {/* Edit customizer (re-opens a configured line from the cart) */}
      <ItemCustomizer
        item={editing && !isCombo(editing.item) ? editing.item : null}
        addons={addons}
        editing={editing}
        open={!!editing && !isCombo(editing.item)}
        onOpenChange={(o) => !o && setEditing(null)}
        onConfirm={addOrUpdateLine}
      />
      {/* A combo line reopens its own picker, with its picks. */}
      <ComboCustomizer
        item={editing && isCombo(editing.item) ? editing.item : null}
        editing={editing}
        open={!!editing && isCombo(editing.item)}
        onOpenChange={(o) => !o && setEditing(null)}
        onConfirm={addOrUpdateLine}
      />

      {/* OTP */}
      <OtpDialog
        open={otpOpen}
        onOpenChange={setOtpOpen}
        phone={form.phone}
        sending={otp.sending}
        verifying={otp.verifying || createOrder.isPending}
        error={otpError}
        onVerify={handleVerify}
        onResend={handleResend}
        onChangeNumber={handleChangeNumber}
      />

      {/* "Is this your new number?" — and everything that can follow from the answer */}
      {identity.dialogs}

      {/* Order history drawer */}
      <OrderHistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        orders={orders}
      />
    </>
  );
}

/**
 * "Delivering to Home · Branch X · Change" — what the card remembered, in one
 * line above the menu, with the way to change it. Everything here is also
 * reachable through the ordinary steps; this only says it out loud.
 */
function OrderNowSummary({
  channel,
  branchName,
  firstName,
  place,
  onChange,
}: {
  channel: Channel;
  branchName: string;
  firstName: string;
  place: string;
  onChange: () => void;
}) {
  const { t } = useTranslation();
  const lead =
    channel === "pickup"
      ? t("order.now.summaryPickup", "Pickup")
      : channel === "umbrella"
        ? t("order.now.summaryUmbrella", "To your umbrella")
        : place
          ? t("order.now.summaryTo", { defaultValue: "Delivering to {{place}}", place })
          : t("order.now.summaryDelivery", "Delivery");
  const Icon = channel === "pickup" ? Store : MapPin;
  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-xs">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <Icon aria-hidden className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{t("order.now.welcomeBack", { defaultValue: "Welcome back, {{name}}", name: firstName })}</p>
        <p className="truncate text-sm font-medium">
          <span dir="auto">{lead}</span>
          <span aria-hidden className="mx-1.5 text-muted-foreground/60">·</span>
          <span dir="auto">{branchName}</span>
        </p>
      </div>
      <Button variant="link" size="sm" className="h-auto shrink-0 p-0 text-brand" onClick={onChange}>
        {t("order.now.change", "Change")}
      </Button>
    </div>
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
