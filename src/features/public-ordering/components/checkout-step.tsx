import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Banknote, CreditCard, User, MapPin, Wallet, ReceiptText } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { Channel, CartLine } from "../types";
import { Totals } from "./cart-sheet";
import { cartSubtotal, isValidPhone } from "../utils";
import { FIELD_LIMITS } from "../limits";

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
  /** estimated channel discount on the subtotal (piastres); 0 = none. */
  discountAmount?: number;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
  /** When true the phone field is read-only (already collected in the phone step). */
  phoneReadOnly?: boolean;
}

export function CheckoutStep({
  channel,
  form,
  onChange,
  lines,
  deliveryFee,
  discountAmount = 0,
  submitting,
  error,
  onSubmit,
  phoneReadOnly = false,
}: CheckoutStepProps) {
  const { t } = useTranslation();
  const subtotal = cartSubtotal(lines);
  const total = subtotal - discountAmount + (deliveryFee ?? 0);
  const isMall = channel === "in_mall";

  type FieldKey = keyof CheckoutForm;
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});

  // Update a field and clear its inline error as the customer edits it.
  const setField = (patch: Partial<CheckoutForm>) => {
    const key = Object.keys(patch)[0] as FieldKey;
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    onChange(patch);
  };

  // Field-level required/format checks (mirrors the page's backstop validation).
  const validate = (): Partial<Record<FieldKey, string>> => {
    const e: Partial<Record<FieldKey, string>> = {};
    if (!form.name.trim()) e.name = t("order.checkout.errName");
    if (!form.phone.trim()) e.phone = t("order.checkout.errPhoneRequired", "Please enter your phone number.");
    else if (!isValidPhone(form.phone)) e.phone = t("order.checkout.errPhone");
    if (isMall) {
      if (!form.place_name.trim()) e.place_name = t("order.checkout.errShop");
      if (!form.floor.trim()) e.floor = t("order.checkout.errFloor");
      if (!form.unit_number.trim()) e.unit_number = t("order.checkout.errUnit");
    } else if (!form.address_line.trim()) {
      e.address_line = t("order.checkout.errAddress");
    }
    return e;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) onSubmit();
  };

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      {/* Contact */}
      <SectionCard icon={<User className="size-4" />} title={t("order.checkout.contact", "Contact")}>
        <Field label={t("order.checkout.name")} htmlFor="po-name" required error={errors.name}>
          <Input
            id="po-name"
            value={form.name}
            onChange={(e) => setField({ name: e.target.value })}
            placeholder={t("order.checkout.namePlaceholder")}
            autoComplete="name"
            maxLength={FIELD_LIMITS.name}
            aria-invalid={!!errors.name}
          />
        </Field>
        <Field label={t("order.checkout.phone")} htmlFor="po-phone" required error={errors.phone}>
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 start-0 flex select-none items-center ps-3 text-sm font-medium text-muted-foreground"
              dir="ltr"
            >
              +20
            </span>
            <Input
              id="po-phone"
              value={form.phone}
              onChange={(e) => !phoneReadOnly && setField({ phone: e.target.value })}
              readOnly={phoneReadOnly}
              placeholder={t("order.checkout.phonePlaceholder")}
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              className={cn("ps-12", phoneReadOnly && "cursor-default bg-muted/50 text-muted-foreground")}
              aria-invalid={!!errors.phone}
            />
          </div>
        </Field>
      </SectionCard>

      {/* Address — channel specific */}
      <SectionCard icon={<MapPin className="size-4" />} title={t("order.checkout.deliveryAddress", "Delivery address")}>
        {isMall ? (
          <>
            <Field label={t("order.checkout.placeName")} htmlFor="po-place" required error={errors.place_name}>
              <Input
                id="po-place"
                value={form.place_name}
                onChange={(e) => setField({ place_name: e.target.value })}
                placeholder={t("order.checkout.placeNamePlaceholder")}
                maxLength={FIELD_LIMITS.shortText}
                aria-invalid={!!errors.place_name}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("order.checkout.floor")} htmlFor="po-floor" required error={errors.floor}>
                <Input
                  id="po-floor"
                  value={form.floor}
                  onChange={(e) => setField({ floor: e.target.value })}
                  maxLength={FIELD_LIMITS.shortText}
                  aria-invalid={!!errors.floor}
                />
              </Field>
              <Field label={t("order.checkout.unitMall")} htmlFor="po-unit" required error={errors.unit_number}>
                <Input
                  id="po-unit"
                  value={form.unit_number}
                  onChange={(e) => setField({ unit_number: e.target.value })}
                  maxLength={FIELD_LIMITS.shortText}
                  aria-invalid={!!errors.unit_number}
                />
              </Field>
            </div>
            <Field label={t("order.checkout.landmark")} htmlFor="po-landmark">
              <Input
                id="po-landmark"
                value={form.landmark}
                onChange={(e) => setField({ landmark: e.target.value })}
                placeholder={t("order.checkout.landmarkPlaceholder")}
                maxLength={FIELD_LIMITS.shortText}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label={t("order.checkout.address")} htmlFor="po-address-line" required error={errors.address_line}>
              <Textarea
                id="po-address-line"
                rows={2}
                value={form.address_line}
                onChange={(e) => setField({ address_line: e.target.value })}
                placeholder={t("order.checkout.addressPlaceholder")}
                maxLength={FIELD_LIMITS.address}
                aria-invalid={!!errors.address_line}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("order.checkout.placeNameOpt")} htmlFor="po-place2">
                <Input
                  id="po-place2"
                  value={form.place_name}
                  onChange={(e) => setField({ place_name: e.target.value })}
                  maxLength={FIELD_LIMITS.shortText}
                />
              </Field>
              <Field label={t("order.checkout.floor")} htmlFor="po-floor2">
                <Input
                  id="po-floor2"
                  value={form.floor}
                  onChange={(e) => setField({ floor: e.target.value })}
                  maxLength={FIELD_LIMITS.shortText}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("order.checkout.unit")} htmlFor="po-unit2">
                <Input
                  id="po-unit2"
                  value={form.unit_number}
                  onChange={(e) => setField({ unit_number: e.target.value })}
                  maxLength={FIELD_LIMITS.shortText}
                />
              </Field>
              <Field label={t("order.checkout.landmark")} htmlFor="po-landmark2">
                <Input
                  id="po-landmark2"
                  value={form.landmark}
                  onChange={(e) => setField({ landmark: e.target.value })}
                  placeholder={t("order.checkout.landmarkPlaceholder")}
                  maxLength={FIELD_LIMITS.shortText}
                />
              </Field>
            </div>
            <Field label={t("order.checkout.notes")} htmlFor="po-notes">
              <Textarea
                id="po-notes"
                rows={2}
                value={form.delivery_notes}
                onChange={(e) => setField({ delivery_notes: e.target.value })}
                placeholder={t("order.checkout.notesPlaceholder")}
                maxLength={FIELD_LIMITS.notes}
              />
            </Field>
          </>
        )}
      </SectionCard>

      {/* Payment */}
      <SectionCard icon={<Wallet className="size-4" />} title={t("order.checkout.payment")}>
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
        <p className="text-xs text-muted-foreground">
          {t("order.checkout.paymentHint")}
        </p>
      </SectionCard>

      {/* Summary */}
      <SectionCard icon={<ReceiptText className="size-4" />} title={t("order.checkout.summary")}>
        <Totals subtotal={subtotal} deliveryFee={deliveryFee} total={total} discount={discountAmount} />
        <p className="text-xs text-muted-foreground">
          {t("order.cart.estimate")}
        </p>
      </SectionCard>

      {error && (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" variant="brand" className="w-full" size="lg" loading={submitting} disabled={submitting}>
        {t("order.checkout.placeOrder")}
      </Button>
    </form>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          {icon}
        </span>
        <p className="font-serif text-sm font-semibold text-foreground">{title}</p>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
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
        "flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all active:translate-y-0",
        active
          ? "border-brand bg-brand/10 text-brand shadow-sm"
          : "border-border/70 bg-card text-foreground hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
