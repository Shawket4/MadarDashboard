import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, ChevronDown, Crosshair, Loader2, MapPin, MapPinOff, Route } from "lucide-react";

import { useDeliveryQuote } from "@/data/api/generated/api";
import type { QuoteResponse } from "@/data/api/generated/models/quoteResponse";
import type { GuestSavedLocation } from "@/data/api/generated/models/guestSavedLocation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/motion";
import { fmtMoney } from "@/lib/format";

import type { Channel } from "../types";
import { DeliveryMap, type LatLng } from "./delivery-map";

/** Initial map view before a point is set / when geolocation is unavailable.
 * Cairo centre — the customer searches or taps to their real spot. */
const FALLBACK_CENTER: LatLng = { lat: 30.0444, lng: 31.2357 };

interface LocationStepProps {
  branchId: string;
  channel: Channel;
  point: LatLng | null;
  /** Whether a confirmed location is required to proceed. Outside is always
   * required; in-mall depends on the branch's `in_mall_require_location` toggle.
   * When false, the customer may continue without sharing their location. */
  required?: boolean;
  /** All saved locations from the guest profile (org-wide, both channels). */
  savedLocations?: GuestSavedLocation[];
  onPointChange: (p: LatLng) => void;
  /** Called when a saved location is applied — pre-fills all form fields. */
  onApplySavedAddress?: (loc: GuestSavedLocation) => void;
  /** Surfaces the resolved quote up to the page so checkout can gate on it. */
  onQuoteChange: (q: QuoteResponse | null) => void;
  onContinue: () => void;
}

export function LocationStep({
  branchId,
  channel,
  point,
  required = true,
  savedLocations = [],
  onPointChange,
  onApplySavedAddress,
  onQuoteChange,
  onContinue,
}: LocationStepProps) {
  const { t } = useTranslation();
  const [locating, setLocating] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);

  // Saved addresses for the current channel (both branches).
  const channelLocations = savedLocations.filter((l) => l.channel === channel);
  const branchSavedLocations = channelLocations.filter((l) => l.branch_id === branchId);
  const otherLocations = channelLocations.filter((l) => l.branch_id !== branchId);
  const hasSaved = channelLocations.length > 0;

  // Auto-select the most recent location for a returning branch (same branch+channel).
  // Only fires on mount if we don't already have a point.
  useEffect(() => {
    if (point || branchSavedLocations.length === 0) return;
    const best = branchSavedLocations[0];
    if (best.customer_lat != null && best.customer_lng != null) {
      onPointChange({ lat: best.customer_lat, lng: best.customer_lng });
    }
    onApplySavedAddress?.(best);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setPermissionDenied(true);
      return;
    }
    setLocating(true);
    setPermissionDenied(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onPointChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setPermissionDenied(true);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  }, [onPointChange]);

  // Ask for location once on mount if we don't already have a pin.
  useEffect(() => {
    if (!point) requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: quote, isFetching } = useDeliveryQuote(
    branchId,
    { lat: point?.lat ?? 0, lng: point?.lng ?? 0, channel },
    { query: { enabled: !!point, staleTime: 30_000, retry: false } },
  );

  useEffect(() => {
    onQuoteChange(point ? (quote ?? null) : null);
  }, [quote, point, onQuoteChange]);

  // Channel-aware label: in_mall highlights the indoor address; outside shows street address.
  const locationLabel = (loc: GuestSavedLocation): string => {
    if (loc.channel === "in_mall") {
      const parts = [loc.place_name, loc.floor ? `Fl. ${loc.floor}` : null, loc.unit_number].filter(Boolean);
      if (parts.length) return parts.join(" · ");
    }
    if (loc.address_line) return loc.address_line;
    if (loc.place_name) return loc.place_name;
    if (loc.customer_lat != null && loc.customer_lng != null)
      return `${loc.customer_lat.toFixed(5)}, ${loc.customer_lng.toFixed(5)}`;
    return t("order.location.savedUnknown", "Saved location");
  };

  // ── In-mall: device GPS only — no map, no draggable pin (a manual pin could be
  // dropped on the mall to fake presence). Missing location blocks ordering;
  // being far is allowed and just shown (registered for the teller). ───────────
  if (channel === "in_mall") {
    const dist = distanceText(t, quote?.distance_meters);
    return (
      <div className="space-y-5">
        {hasSaved && (
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            <button
              type="button"
              onClick={() => setSavedOpen((o) => !o)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted"
            >
              <span className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-brand" />
                <span className="truncate text-muted-foreground">
                  {t("order.location.savedLabel", "Use a saved address")}
                </span>
              </span>
              <ChevronDown
                className={cn("size-4 shrink-0 text-muted-foreground transition-transform", savedOpen && "rotate-180")}
              />
            </button>
            {savedOpen && (
              <div className="border-t border-border/70">
                {branchSavedLocations.length > 0 && (
                  <>
                    <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("order.location.thisBranch", "This branch")}
                    </p>
                    {branchSavedLocations.map((loc, i) => (
                      <SavedLocationRow
                        key={i}
                        label={locationLabel(loc)}
                        date={loc.last_used_at}
                        onSelect={() => applyLocation(loc)}
                      />
                    ))}
                  </>
                )}
                {otherLocations.length > 0 && (
                  <>
                    <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("order.location.otherBranches", "Other branches")}
                    </p>
                    {otherLocations.map((loc, i) => (
                      <SavedLocationRow
                        key={i}
                        label={locationLabel(loc)}
                        date={loc.last_used_at}
                        onSelect={() => applyLocation(loc)}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
        <div className="rounded-2xl border border-border/70 bg-card p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <MapPin className="size-6" />
          </div>
          <h2 className="font-serif text-lg leading-tight">
            {required
              ? t("order.location.inMallTitle", "Confirm you're at the branch")
              : t("order.location.inMallTitleOptional", "Share your location (optional)")}
          </h2>
          {permissionDenied ? (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">
                {required
                  ? t(
                      "order.location.required",
                      "We need your location to confirm you're at the branch before you can order.",
                    )
                  : t(
                      "order.location.optional",
                      "Sharing your location helps us serve you faster, but it's optional — you can continue without it.",
                    )}
              </p>
              <Button variant="outline" className="mt-4" onClick={requestLocation}>
                <Crosshair className="size-4" />
                {t("order.location.retry", "Enable location")}
              </Button>
            </div>
          ) : !point ? (
            <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("order.location.locating")}
            </p>
          ) : (
            <div className="mt-2">
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
                <CheckCircle2 className="size-4" />
                {t("order.location.confirmed", "Location confirmed")}
              </p>
              {dist && <p className="mt-1 text-xs text-muted-foreground">{dist}</p>}
            </div>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {t("order.location.inMallNote", "Your location is used only to confirm you're at the branch.")}
        </p>
        <Button variant="brand" size="lg" className="w-full" disabled={required && !point} onClick={onContinue}>
          {!point && !required ? t("order.location.skip", "Continue without location") : t("order.location.continue")}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    );
  }

  // ── Outside: map + draggable pin + zone quote. ──────────────────────────────
  const status = quote?.status;
  const canContinue = !!point && status === "ok" && !isFetching;

  const applyLocation = (loc: GuestSavedLocation) => {
    if (loc.customer_lat != null && loc.customer_lng != null) {
      onPointChange({ lat: loc.customer_lat, lng: loc.customer_lng });
    }
    onApplySavedAddress?.(loc);
    setSavedOpen(false);
  };

  return (
    <div className="space-y-5">
      {hasSaved && (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <button
            type="button"
            onClick={() => setSavedOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted"
          >
            <span className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-brand" />
              <span className="truncate text-muted-foreground">
                {t("order.location.savedLabel", "Use a saved address")}
              </span>
            </span>
            <ChevronDown
              className={cn("size-4 shrink-0 text-muted-foreground transition-transform", savedOpen && "rotate-180")}
            />
          </button>
          {savedOpen && (
            <div className="border-t border-border/70">
              {branchSavedLocations.length > 0 && (
                <>
                  <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("order.location.thisBranch", "This branch")}
                  </p>
                  {branchSavedLocations.map((loc, i) => (
                    <SavedLocationRow
                      key={i}
                      label={locationLabel(loc)}
                      date={loc.last_used_at}
                      onSelect={() => applyLocation(loc)}
                    />
                  ))}
                </>
              )}
              {otherLocations.length > 0 && (
                <>
                  <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("order.location.otherBranches", "Other branches")}
                  </p>
                  {otherLocations.map((loc, i) => (
                    <SavedLocationRow
                      key={i}
                      label={locationLabel(loc)}
                      date={loc.last_used_at}
                      onSelect={() => applyLocation(loc)}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <DeliveryMap
          point={point}
          fallbackCenter={FALLBACK_CENTER}
          onChange={onPointChange}
          onLocate={requestLocation}
          locating={locating}
        />
      </div>

      <p className="text-center text-xs text-muted-foreground">{t("order.location.dragHint")}</p>

      {permissionDenied && (
        <p className="flex items-center justify-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-center text-xs text-warning-foreground">
          <MapPinOff className="size-3.5 shrink-0" />
          {t("order.location.permissionDenied")}
        </p>
      )}

      {point && <QuoteStatus quote={quote ?? null} loading={isFetching} />}

      <Button variant="brand" size="lg" className="w-full" disabled={!canContinue} onClick={onContinue}>
        {t("order.location.continue")}
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

function SavedLocationRow({
  label,
  date,
  onSelect,
}: {
  label: string;
  date: string;
  onSelect: () => void;
}) {
  const ago = new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 px-4 py-3 text-start text-sm transition-colors hover:bg-muted"
    >
      <MapPin className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{ago}</span>
    </button>
  );
}

/** Walking-distance label for the in-mall confirm screen (no zones). */
function distanceText(t: TFunction, meters?: number | null): string | null {
  if (meters == null) return null;
  if (meters < 1000)
    return t("order.location.distanceFromBranch", {
      meters: Math.round(meters),
      defaultValue: "~{{meters}} m from the branch",
    });
  return t("order.location.distanceFromBranchKm", {
    km: (meters / 1000).toFixed(1),
    defaultValue: "~{{km}} km from the branch",
  });
}

function QuoteStatus({ quote, loading }: { quote: QuoteResponse | null; loading: boolean }) {
  const { t } = useTranslation();

  if (loading || !quote) {
    return (
      <Banner tone="neutral" icon={<Loader2 className="size-4 animate-spin" />}>
        {t("order.location.checkingRange")}
      </Banner>
    );
  }

  if (quote.status === "out_of_range") {
    return (
      <Banner tone="warn" icon={<MapPinOff className="size-4" />}>
        <span className="font-serif text-base font-semibold">{t("order.location.outOfRange")}</span>
        <span className="block text-xs opacity-90">{t("order.location.outOfRangeHint")}</span>
      </Banner>
    );
  }

  if (quote.status !== "ok") {
    return (
      <Banner tone="warn" icon={<MapPinOff className="size-4" />}>
        <span className="font-serif text-base font-semibold">{t("order.location.unavailable")}</span>
        <span className="block text-xs opacity-90">{t("order.location.unavailableHint")}</span>
      </Banner>
    );
  }

  const fee = quote.fee ?? 0;
  const km = quote.distance_meters != null ? (quote.distance_meters / 1000).toFixed(1) : null;

  return (
    <Banner tone="ok" icon={<CheckCircle2 className="size-4" />}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
        <span className="font-serif text-base font-semibold">{t("order.location.deliverable")}</span>
        <span className="font-semibold">
          {fee > 0 ? t("order.location.fee", { fee: fmtMoney(fee) }) : t("order.location.free")}
        </span>
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs opacity-90">
        {quote.zone_name && <span>{t("order.location.zone", { name: quote.zone_name })}</span>}
        {km && (
          <span className="inline-flex items-center gap-1">
            <Route className="size-3" />
            {t("order.location.distance", { km })}
          </span>
        )}
      </div>
    </Banner>
  );
}

function Banner({
  tone,
  icon,
  children,
}: {
  tone: "ok" | "warn" | "neutral";
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm",
        tone === "ok" && "border-success/30 bg-success/10 text-success",
        tone === "warn" && "border-warning/30 bg-warning/10 text-warning-foreground",
        tone === "neutral" && "border-border/70 bg-muted/50 text-muted-foreground",
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </motion.div>
  );
}
