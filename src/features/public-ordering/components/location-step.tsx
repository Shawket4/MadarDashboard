import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Loader2, Route } from "lucide-react";

import { useDeliveryQuote } from "@/data/api/generated/api";
import type { QuoteResponse } from "@/data/api/generated/models/quoteResponse";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/motion";
import { fmtMoney } from "@/lib/format";

import { DeliveryMap, type LatLng } from "./delivery-map";

/** Initial map view before a point is set / when geolocation is unavailable.
 * Cairo centre — the customer searches or taps to their real spot. */
const FALLBACK_CENTER: LatLng = { lat: 30.0444, lng: 31.2357 };

interface LocationStepProps {
  branchId: string;
  point: LatLng | null;
  address: string;
  onPointChange: (p: LatLng) => void;
  onAddressChange: (v: string) => void;
  /** Surfaces the resolved quote up to the page so checkout can gate on it. */
  onQuoteChange: (q: QuoteResponse | null) => void;
  onContinue: () => void;
}

export function LocationStep({
  branchId,
  point,
  address,
  onPointChange,
  onAddressChange,
  onQuoteChange,
  onContinue,
}: LocationStepProps) {
  const { t } = useTranslation();
  const [locating, setLocating] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) return;
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
    { lat: point?.lat ?? 0, lng: point?.lng ?? 0, channel: "outside" },
    {
      query: {
        enabled: !!point,
        staleTime: 30_000,
        retry: false,
      },
    },
  );

  useEffect(() => {
    onQuoteChange(point ? (quote ?? null) : null);
  }, [quote, point, onQuoteChange]);

  const status = quote?.status;
  const canContinue = !!point && status === "ok" && !isFetching;

  return (
    <div className="space-y-4">
      <DeliveryMap
        point={point}
        fallbackCenter={FALLBACK_CENTER}
        onChange={onPointChange}
        onLocate={requestLocation}
        locating={locating}
      />

      <p className="text-center text-xs text-muted-foreground">
        {t("order.location.dragHint")}
      </p>

      {permissionDenied && (
        <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-700 dark:text-amber-400">
          {t("order.location.permissionDenied")}
        </p>
      )}

      {/* Quote status */}
      {point && <QuoteStatus quote={quote ?? null} loading={isFetching} />}

      <div className="space-y-1.5">
        <Label htmlFor="po-address">{t("order.location.address")}</Label>
        <Textarea
          id="po-address"
          rows={2}
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder={t("order.location.addressPlaceholder")}
        />
      </div>

      <Button className="w-full" size="lg" disabled={!canContinue} onClick={onContinue}>
        {t("order.location.continue")}
      </Button>
    </div>
  );
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
      <Banner tone="warn" icon={<AlertTriangle className="size-4" />}>
        <span className="font-semibold">{t("order.location.outOfRange")}</span>
        <span className="block text-xs opacity-90">
          {t("order.location.outOfRangeHint")}
        </span>
      </Banner>
    );
  }

  if (quote.status !== "ok") {
    return (
      <Banner tone="warn" icon={<AlertTriangle className="size-4" />}>
        <span className="font-semibold">{t("order.location.unavailable")}</span>
        <span className="block text-xs opacity-90">
          {t("order.location.unavailableHint")}
        </span>
      </Banner>
    );
  }

  const fee = quote.fee ?? 0;
  const km = quote.distance_meters != null ? (quote.distance_meters / 1000).toFixed(1) : null;

  return (
    <Banner tone="ok" icon={<CheckCircle2 className="size-4" />}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
        <span className="font-semibold">{t("order.location.deliverable")}</span>
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
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm",
        tone === "ok" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        tone === "warn" && "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
        tone === "neutral" && "border-border/70 bg-muted/50 text-muted-foreground",
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </motion.div>
  );
}
