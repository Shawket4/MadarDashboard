import { useTranslation } from "react-i18next";
import { Banknote, CreditCard } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { Channel, CartLine } from "../types";
import { Totals } from "./cart-sheet";
import { cartSubtotal } from "../utils";

export interface CheckoutForm {
  name: string;
  phone: string;
  place_name: string;
  floor: string;
  unit_number: string;
  landmark: string;
  address_line: string;
  delivery_notes: string;
  payment: "cash" | "card";
}

export const emptyForm = (): CheckoutForm => ({
  name: "",
  phone: "",
  place_name: "",
  floor: "",
  unit_number: "",
  landmark: "",
  address_line: "",
  delivery_notes: "",
  payment: "cash",
});

interface CheckoutStepProps {
  channel: Channel;
  form: CheckoutForm;
  onChange: (patch: Partial<CheckoutForm>) => void;
  lines: CartLine[];
  deliveryFee: number | null;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
}

export function CheckoutStep({
  channel,
  form,
  onChange,
  lines,
  deliveryFee,
  submitting,
  error,
  onSubmit,
}: CheckoutStepProps) {
  const { t } = useTranslation();
  const subtotal = cartSubtotal(lines);
  const total = subtotal + (deliveryFee ?? 0);
  const isMall = channel === "in_mall";

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {/* Contact */}
      <div className="space-y-3">
        <Field label={t("order.checkout.name")} htmlFor="po-name">
          <Input
            id="po-name"
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder={t("order.checkout.namePlaceholder")}
            autoComplete="name"
            required
          />
        </Field>
        <Field label={t("order.checkout.phone")} htmlFor="po-phone">
          <Input
            id="po-phone"
            value={form.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder={t("order.checkout.phonePlaceholder")}
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            required
          />
        </Field>
      </div>

      {/* Address — channel specific */}
      <div className="space-y-3 rounded-2xl border border-border/70 bg-card/50 p-3.5">
        {isMall ? (
          <>
            <Field label={t("order.checkout.placeName")} htmlFor="po-place">
              <Input
                id="po-place"
                value={form.place_name}
                onChange={(e) => onChange({ place_name: e.target.value })}
                placeholder={t("order.checkout.placeNamePlaceholder")}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("order.checkout.floor")} htmlFor="po-floor">
                <Input
                  id="po-floor"
                  value={form.floor}
                  onChange={(e) => onChange({ floor: e.target.value })}
                />
              </Field>
              <Field label={t("order.checkout.unitMall")} htmlFor="po-unit">
                <Input
                  id="po-unit"
                  value={form.unit_number}
                  onChange={(e) => onChange({ unit_number: e.target.value })}
                />
              </Field>
            </div>
            <Field label={t("order.checkout.landmark")} htmlFor="po-landmark">
              <Input
                id="po-landmark"
                value={form.landmark}
                onChange={(e) => onChange({ landmark: e.target.value })}
                placeholder={t("order.checkout.landmarkPlaceholder")}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label={t("order.checkout.address")} htmlFor="po-address-line">
              <Textarea
                id="po-address-line"
                rows={2}
                value={form.address_line}
                onChange={(e) => onChange({ address_line: e.target.value })}
                placeholder={t("order.checkout.addressPlaceholder")}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("order.checkout.placeNameOpt")} htmlFor="po-place2">
                <Input
                  id="po-place2"
                  value={form.place_name}
                  onChange={(e) => onChange({ place_name: e.target.value })}
                />
              </Field>
              <Field label={t("order.checkout.floor")} htmlFor="po-floor2">
                <Input
                  id="po-floor2"
                  value={form.floor}
                  onChange={(e) => onChange({ floor: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("order.checkout.unit")} htmlFor="po-unit2">
                <Input
                  id="po-unit2"
                  value={form.unit_number}
                  onChange={(e) => onChange({ unit_number: e.target.value })}
                />
              </Field>
              <Field label={t("order.checkout.landmark")} htmlFor="po-landmark2">
                <Input
                  id="po-landmark2"
                  value={form.landmark}
                  onChange={(e) => onChange({ landmark: e.target.value })}
                  placeholder={t("order.checkout.landmarkPlaceholder")}
                />
              </Field>
            </div>
            <Field label={t("order.checkout.notes")} htmlFor="po-notes">
              <Textarea
                id="po-notes"
                rows={2}
                value={form.delivery_notes}
                onChange={(e) => onChange({ delivery_notes: e.target.value })}
                placeholder={t("order.checkout.notesPlaceholder")}
              />
            </Field>
          </>
        )}
      </div>

      {/* Payment */}
      <div>
        <p className="mb-2 text-sm font-bold">{t("order.checkout.payment")}</p>
        <div className="grid grid-cols-2 gap-3">
          <PaymentChip
            active={form.payment === "cash"}
            icon={<Banknote className="size-5" />}
            label={t("order.checkout.cash")}
            onClick={() => onChange({ payment: "cash" })}
          />
          <PaymentChip
            active={form.payment === "card"}
            icon={<CreditCard className="size-5" />}
            label={t("order.checkout.card")}
            onClick={() => onChange({ payment: "card" })}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {t("order.checkout.paymentHint")}
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-border/70 bg-card/50 p-3.5">
        <p className="mb-2 text-sm font-bold">{t("order.checkout.summary")}</p>
        <Totals subtotal={subtotal} deliveryFee={deliveryFee} total={total} />
        <p className="mt-2 text-xs text-muted-foreground">
          {t("order.cart.estimate")}
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" size="lg" loading={submitting} disabled={submitting}>
        {t("order.checkout.placeOrder")}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function PaymentChip({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all",
        active
          ? "border-brand bg-brand/10 text-brand shadow-sm"
          : "border-border/70 bg-card hover:border-brand/40",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
