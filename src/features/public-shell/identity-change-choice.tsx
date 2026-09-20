/**
 * The question a returning guest is asked when they change who the order is
 * for (§4.4): is this for this order alone, or is it who they are now?
 *
 *  - a name edit asks inline, already answered "just this order";
 *  - a phone edit blocks: nothing is pre-selected, and the order cannot go on
 *    until they answer or take the old number back.
 *
 * It only collects the answer. The server classifies the edit itself, and a
 * replacement still needs a code on the new number before anything changes.
 */
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatPhoneDisplay } from "@/lib/phone";
import { cn } from "@/lib/utils";

import type { IdentityChange } from "./identity-edit";

interface Option {
  value: IdentityChange;
  label: string;
  hint: string;
}

function Options({
  legend,
  options,
  value,
  onChange,
  disabled,
}: {
  legend: string;
  options: Option[];
  value: IdentityChange | null;
  onChange: (value: IdentityChange) => void;
  disabled?: boolean;
}) {
  const name = useId();
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      {options.map((o) => (
        <label
          key={o.value}
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-card p-3 text-start transition-colors",
            "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60",
            value === o.value && "border-brand bg-brand/5",
          )}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="mt-0.5 size-4 shrink-0 accent-[var(--color-brand)]"
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium">{o.label}</span>
            <span className="block text-xs text-muted-foreground">{o.hint}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

interface NameProps {
  kind: "name";
  value: IdentityChange;
  onChange: (value: IdentityChange) => void;
  disabled?: boolean;
}

interface PhoneProps {
  kind: "phone";
  open: boolean;
  /** The number the customer is known by, and the one they typed. */
  currentPhone: string;
  newPhone: string;
  value: IdentityChange | null;
  onChange: (value: IdentityChange) => void;
  /** Go on with the answer in `value`. */
  onConfirm: () => void;
  /** Take the old number back; the order is not placed. */
  onCancel: () => void;
  busy?: boolean;
}

export type IdentityChangeChoiceProps = NameProps | PhoneProps;

export function IdentityChangeChoice(props: IdentityChangeChoiceProps) {
  const { t } = useTranslation();

  if (props.kind === "name") {
    return (
      <Options
        legend={t("order.identity.nameLegend", "You changed the name")}
        value={props.value}
        onChange={props.onChange}
        disabled={props.disabled}
        options={[
          {
            value: "once",
            label: t("order.identity.nameOnce", "Just this order"),
            hint: t("order.identity.nameOnceHint", "I’m ordering for someone else. My name stays as it is."),
          },
          {
            value: "replace",
            label: t("order.identity.nameReplace", "Update my name"),
            hint: t("order.identity.nameReplaceHint", "Use this name on my card and my next orders."),
          },
        ]}
      />
    );
  }

  const { open, currentPhone, newPhone, value, onChange, onConfirm, onCancel, busy } = props;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onCancel()}>
      <DialogContent
        // A blocking question: only its own buttons answer it.
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>{t("order.identity.phoneTitle", "Is this your new number?")}</DialogTitle>
          <DialogDescription>
            {t("order.identity.phoneBody", "The number you entered isn’t the one we know you by.")}
          </DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">{t("order.identity.phoneCurrent", "Your number")}</dt>
          <dd className="text-end font-medium"><bdi dir="ltr">{formatPhoneDisplay(currentPhone)}</bdi></dd>
          <dt className="text-muted-foreground">{t("order.identity.phoneNew", "You entered")}</dt>
          <dd className="text-end font-medium"><bdi dir="ltr">{formatPhoneDisplay(newPhone)}</bdi></dd>
        </dl>
        <Options
          legend={t("order.identity.phoneLegend", "What should we do with it?")}
          value={value}
          onChange={onChange}
          disabled={busy}
          options={[
            {
              value: "once",
              label: t("order.identity.phoneOnce", "Just this order"),
              hint: t("order.identity.phoneOnceHint", "I’m ordering for someone else. We’ll call this number about the order; your points and your number stay yours."),
            },
            {
              value: "replace",
              label: t("order.identity.phoneReplace", "This is my new number"),
              hint: t("order.identity.phoneReplaceHint", "We’ll send it a WhatsApp code, then move your orders, points and card to it."),
            },
          ]}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            {t("order.identity.phoneCancel", "Keep my number")}
          </Button>
          <Button onClick={onConfirm} disabled={value === null} loading={busy}>
            {t("order.identity.phoneContinue", "Continue")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
