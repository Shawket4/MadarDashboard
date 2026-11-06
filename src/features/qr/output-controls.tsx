/**
 * The switches that decide how a code comes out — the page's panel above the
 * codes, and the same switches inside a code's preview, so they are never more
 * than a glance from the code they change.
 *
 * Unbranded is the headline: one switch for "just the QR code". Under it, and
 * only meaningful with it, "Logo in the middle" — off, a completely plain QR.
 * The card switch and the resolution belong to branded mode and step aside
 * when they no longer apply (DPI stays: the unbranded code is a raster too).
 */
import { useId, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@/components/app/link";
import { keepScope } from "@/data/scope/list-search";
import { useHasFeature } from "@/hooks/use-plan";
import { cn } from "@/lib/utils";

import { QR_DPIS, useQrOutput, type QrDpi } from "./output";

function SwitchRow({
  id,
  checked,
  onChange,
  disabled,
  label,
  hint,
  testId,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  hint: ReactNode;
  testId: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3", disabled && "opacity-60")}>
      <div className="min-w-0 space-y-0.5">
        <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch
        id={id}
        data-testid={testId}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        className="mt-0.5 shrink-0"
      />
    </div>
  );
}

export function QrOutputControls({
  noLogo = false,
  className,
}: {
  /** The last code came back with no logo in the middle although one was asked for. */
  noLogo?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const [o, set] = useQrOutput();
  const hasBranding = useHasFeature("branding");
  const uid = useId();

  return (
    <div className={cn("space-y-3", className)} data-testid="qr-output-controls">
      <SwitchRow
        id={`${uid}-unbranded`}
        testId="qr-unbranded"
        checked={o.unbranded}
        onChange={(v) => set({ unbranded: v })}
        label={t("qr.output.unbranded", "Unbranded")}
        hint={t("qr.output.unbrandedHint", "Just the QR code: no card, no text, no frame, no Madar logo.")}
      />

      {/* The sub-toggle sits under its parent and reads as part of it. */}
      <div className="ms-1 border-s-2 ps-4">
        <SwitchRow
          id={`${uid}-centre`}
          testId="qr-centre-logo"
          checked={o.centreLogo}
          disabled={!o.unbranded}
          onChange={(v) => set({ centreLogo: v })}
          label={t("qr.output.centreLogo", "Logo in the middle")}
          hint={
            o.unbranded
              ? t("qr.output.centreLogoHint", "Your shop's logo in the centre of the code. Off: a plain QR.")
              : t("qr.output.centreLogoOff", "Turn on Unbranded to choose.")
          }
        />
        {o.unbranded && o.centreLogo && noLogo ? (
          <p className="mt-2 text-xs text-muted-foreground" data-testid="qr-no-logo">
            {t("qr.output.noLogo", "Your shop has no logo for codes yet, so the code comes out plain.")}{" "}
            {hasBranding ? (
              <Link to="/settings/brand" search={keepScope} className="font-medium text-foreground underline underline-offset-2">
                {t("qr.output.addLogo", "Add one under Brand")}
              </Link>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-3">
        {!o.unbranded ? (
          <div className="flex items-center gap-2">
            <Switch
              id={`${uid}-card`}
              data-testid="qr-card"
              checked={o.card}
              onCheckedChange={(v) => set({ card: v })}
            />
            <Label htmlFor={`${uid}-card`} className="cursor-pointer text-sm">
              {t("qr.output.card", "A6 card")}
            </Label>
            <span className="text-xs text-muted-foreground">
              {o.card ? null : t("qr.output.cardOff", "A small plain code, for receipts.")}
            </span>
          </div>
        ) : null}
        {o.unbranded || o.card ? (
          <div className="flex items-center gap-2">
            <Label htmlFor={`${uid}-dpi`} className="text-xs text-muted-foreground">
              {t("qr.opts.dpiLabel", "DPI")}
            </Label>
            <Select value={String(o.dpi)} onValueChange={(v) => set({ dpi: Number(v) as QrDpi })}>
              <SelectTrigger id={`${uid}-dpi`} size="sm" className="w-20 text-xs" data-testid="qr-dpi">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QR_DPIS.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
    </div>
  );
}
