/**
 * What a changed name or phone MEANS, asked at the moment the order is placed
 * (§4.4). The client only puts the question; the server classifies the edit
 * again and is the one that acts.
 *
 *   nothing changed   → the order goes, as the customer
 *   name only         → inline, already answered "just this order"
 *   phone             → blocking:
 *       just this order → `identity_change: "one_time"`; the other number is
 *                         proved (WhatsApp code) only where the branch demands it
 *       my new number   → prove the new number → replace-identity → the order
 *                         goes on as the same customer under the new number
 *           belongs to someone else (and both are proved) → "these are both me"
 *           locked after a merge / changed too often       → say so, offer one-time
 *
 * Every refusal leaves a way to still get the food: one-time, or the old number.
 */
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getErrorMessage } from "@/data/api/errors";
import { useOrderNowCombine, useOrderNowReplaceIdentity } from "@/data/api/generated/api";
import { clearDeviceToken, getDeviceToken, setDeviceToken, setGuestPhone } from "@/features/public-shell/guest";
import { IdentityChangeChoice } from "@/features/public-shell/identity-change-choice";
import { useErrorToast } from "@/features/public-shell/public-toaster";
import { classifyIdentityEdit, type IdentityChange, type IdentityEdit } from "@/features/public-shell/identity-edit";
import { otpRefusal, useOtpTransport } from "@/features/public-shell/use-phone-otp";
import { canonicalPhone, formatPhoneDisplay, ltrIsolate } from "@/lib/phone";

import { OtpDialog } from "../components/otp-dialog";
import { CONTACT_VERIFICATION_REQUIRED, identityRefusal, isTooManyAttempts, type OrderIdentityFields, type OrderNowSession, type PlaceOutcome } from "./session";

type Purpose = "once" | "replace";
type Stage =
  | null
  | { k: "choice" }
  | { k: "otp"; purpose: Purpose }
  | { k: "combine"; newToken: string }
  | { k: "refused"; reason: "locked" | "limit" };

const NO_EDIT: IdentityEdit = { kind: "none", nameChanged: false, phoneChanged: false };

interface Args {
  session: OrderNowSession | null;
  typed: { name: string; phone: string };
  /** The branch wants a proved phone for the number the driver will call. */
  otpRequired: boolean;
  /** The order is sent somewhere (not self-collect), so "save this address" means something. */
  hasAddress: boolean;
  /** Send the order. Resolves either way; never throws. */
  place: (identity: OrderIdentityFields) => Promise<PlaceOutcome>;
  /** Say what went wrong with an outcome nobody here could do anything about. */
  report: (outcome: PlaceOutcome) => void;
  /** "Keep my number": put the customer's own number back in the form. */
  onKeepNumber: () => void;
}

export interface OrderIdentity {
  edit: IdentityEdit;
  /** A request of this flow's own is in flight. */
  busy: boolean;
  /** Place the order, asking first if the edit needs an answer. */
  begin: () => Promise<void>;
  /** Under the name/phone fields: the name question, and "save this address". */
  inline: ReactNode;
  dialogs: ReactNode;
}

export function useOrderIdentity({ session, typed, otpRequired, hasAddress, place, report, onKeepNumber }: Args): OrderIdentity {
  const { t } = useTranslation();
  const otp = useOtpTransport();
  const { mutateAsync: replaceAsync } = useOrderNowReplaceIdentity();
  const { mutateAsync: combineAsync } = useOrderNowCombine();

  const [nameChoice, setNameChoice] = useState<IdentityChange>("once");
  const [phoneChoice, setPhoneChoice] = useState<IdentityChange | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);
  const [stage, setStage] = useState<Stage>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  // Also as a toast: the inline copy sits where the customer may have scrolled from.
  useErrorToast(error);
  useErrorToast(otpError);

  const edit = useMemo(
    () => (session ? classifyIdentityEdit(session.customer, { name: typed.name, phone: typed.phone }) : NO_EDIT),
    [session, typed.name, typed.phone],
  );
  const newPhone = canonicalPhone(typed.phone) ?? "";
  const tooMany = t("order.now.tooMany", "Too many attempts just now. Give it a moment and try again.");

  const close = useCallback(() => {
    setStage(null);
    setError(null);
    setOtpError(null);
  }, []);

  const keepNumber = () => {
    close();
    onKeepNumber();
  };

  const startOtp = async (purpose: Purpose) => {
    setOtpError(null);
    setError(null);
    try {
      await otp.requestCode(newPhone);
      setStage({ k: "otp", purpose });
    } catch (err) {
      // Back to the question, with the server's own words when it has some.
      setError(otpRefusal(err) ?? t("order.otp.errSend", "Couldn’t send the code. Try again."));
      setStage({ k: "choice" });
    }
  };

  /** Just this order. `fresh` = a token verified a moment ago, as opposed to one remembered. */
  const runOnce = async (fresh?: string) => {
    if (!session) return;
    const contactToken = fresh ?? (otpRequired ? getDeviceToken(newPhone) : null);
    if (otpRequired && !contactToken) return startOtp("once");
    setWorking(true);
    const outcome = await place({
      device_token: session.deviceToken,
      member_token: session.memberToken,
      identity_change: "one_time",
      save_address: hasAddress ? saveAddress : null,
      contact_device_token: contactToken,
    });
    setWorking(false);
    // The server is the one that knows whether this branch wants the other
    // number proved, and it says so by name. A remembered token it no longer
    // honours is forgotten. Any other 401 is not about this number: reported.
    if (!outcome.ok && outcome.code === CONTACT_VERIFICATION_REQUIRED && !fresh) {
      clearDeviceToken(newPhone);
      return startOtp("once");
    }
    close();
    report(outcome);
  };

  const afterReplaced = async (newToken: string) => {
    if (!session) return;
    setDeviceToken(newPhone, newToken);
    setGuestPhone(session.orgId, newPhone);
    session.onIdentityReplaced({ phone: newPhone, deviceToken: newToken, name: typed.name.trim() });
    close();
    // The same customer, now under the new number: an ordinary order.
    report(await place({ device_token: newToken, member_token: session.memberToken }));
  };

  const body = (newToken: string) => ({
    device_token: session!.deviceToken,
    new_phone: newPhone,
    new_phone_device_token: newToken,
    name: edit.nameChanged ? typed.name.trim() : null,
  });

  const runReplace = async (fresh?: string) => {
    if (!session) return;
    const newToken = fresh ?? getDeviceToken(newPhone);
    if (!newToken) return startOtp("replace");
    setWorking(true);
    try {
      await replaceAsync({ token: session.memberToken, data: body(newToken) });
      await afterReplaced(newToken);
    } catch (err) {
      const refusal = identityRefusal(err);
      if (refusal.code === "PHONE_BELONGS_TO_ANOTHER" && refusal.canCombine) setStage({ k: "combine", newToken });
      else if (refusal.code === "IDENTITY_LOCKED_AFTER_MERGE") setStage({ k: "refused", reason: "locked" });
      else if (refusal.code === "IDENTITY_REPLACE_LIMIT") setStage({ k: "refused", reason: "limit" });
      else if (refusal.status === 401 && !fresh) {
        clearDeviceToken(newPhone);
        await startOtp("replace");
      } else {
        setError(isTooManyAttempts(err) ? tooMany : getErrorMessage(err));
        setStage({ k: "choice" });
      }
    } finally {
      setWorking(false);
    }
  };

  const runCombine = async (newToken: string) => {
    if (!session) return;
    setWorking(true);
    setError(null);
    try {
      await combineAsync({ token: session.memberToken, data: body(newToken) });
      await afterReplaced(newToken);
    } catch (err) {
      const refusal = identityRefusal(err);
      if (refusal.code === "IDENTITY_LOCKED_AFTER_MERGE") setStage({ k: "refused", reason: "locked" });
      else if (refusal.code === "IDENTITY_REPLACE_LIMIT") setStage({ k: "refused", reason: "limit" });
      // The other profile went away in the meantime: the number is free to take.
      else if (refusal.code === "NOTHING_TO_COMBINE") await runReplace(newToken);
      else setError(isTooManyAttempts(err) ? tooMany : getErrorMessage(err));
    } finally {
      setWorking(false);
    }
  };

  const verifyOtp = async (code: string, purpose: Purpose) => {
    setOtpError(null);
    let token: string;
    try {
      token = await otp.verifyCode(newPhone, code);
    } catch {
      setOtpError(t("order.otp.errInvalid", "That code didn’t work. Try again."));
      return;
    }
    setDeviceToken(newPhone, token);
    if (purpose === "once") await runOnce(token);
    else await runReplace(token);
  };

  const openChoice = () => {
    setPhoneChoice(null);
    setError(null);
    setStage({ k: "choice" });
  };

  const begin = async () => {
    if (!session) return;
    if (edit.kind === "phone") return openChoice();
    const outcome = await place({
      device_token: session.deviceToken,
      member_token: session.memberToken,
      ...(edit.kind === "name"
        ? nameChoice === "replace"
          ? { identity_change: "update_name" }
          : { identity_change: "one_time", save_address: hasAddress ? saveAddress : null }
        : {}),
    });
    // The server saw a different phone where this page saw none: it decides.
    if (!outcome.ok && outcome.code === "IDENTITY_CHOICE_REQUIRED") return openChoice();
    report(outcome);
  };

  const saveAddressBox = (id: string) => (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm">
      <Checkbox id={id} checked={saveAddress} onCheckedChange={(v) => setSaveAddress(v === true)} className="mt-0.5" />
      <span>
        <span className="block font-medium">{t("order.identity.saveAddress", "Save this address to my profile")}</span>
        <span className="block text-xs text-muted-foreground">
          {t("order.identity.saveAddressHint", "Off by default: an order for someone else usually goes somewhere that isn’t yours.")}
        </span>
      </span>
    </label>
  );

  const inline =
    session && edit.kind === "name" ? (
      <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
        <IdentityChangeChoice kind="name" value={nameChoice} onChange={setNameChoice} />
        {hasAddress && nameChoice === "once" ? saveAddressBox("po-save-address") : null}
      </div>
    ) : null;

  const phoneShown = ltrIsolate(formatPhoneDisplay(newPhone));
  const dialogs = session ? (
    <>
      <IdentityChangeChoice
        kind="phone"
        open={stage?.k === "choice"}
        currentPhone={session.customer.phone}
        newPhone={newPhone}
        value={phoneChoice}
        onChange={setPhoneChoice}
        busy={working || otp.sending}
        error={error}
        onCancel={keepNumber}
        onConfirm={() => void (phoneChoice === "replace" ? runReplace() : runOnce())}
      >
        {hasAddress && phoneChoice === "once" ? saveAddressBox("po-save-address-once") : null}
      </IdentityChangeChoice>

      <OtpDialog
        open={stage?.k === "otp"}
        onOpenChange={(o) => !o && setStage({ k: "choice" })}
        phone={newPhone}
        sending={otp.sending}
        verifying={otp.verifying || working}
        error={otpError}
        onVerify={(code) => stage?.k === "otp" && void verifyOtp(code, stage.purpose)}
        onResend={() => stage?.k === "otp" && void startOtp(stage.purpose)}
        onChangeNumber={keepNumber}
      />

      <Dialog open={stage?.k === "combine"} onOpenChange={(o) => !o && !working && keepNumber()}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("order.identity.combineTitle", "That number already has a profile here")}</DialogTitle>
            <DialogDescription>
              {t("order.identity.combineBody", {
                defaultValue:
                  "You’ve just proved {{phone}} is yours too. Combine the two and everything — orders, points and saved addresses — lives under this card.",
                phone: phoneShown,
              })}
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button variant="brand" loading={working} onClick={() => stage?.k === "combine" && void runCombine(stage.newToken)}>
              {t("order.identity.combineConfirm", "These are both me — combine")}
            </Button>
            <Button variant="outline" disabled={working} onClick={() => void runOnce()}>
              {t("order.identity.useOnce", "Use it for just this order")}
            </Button>
            <Button variant="ghost" disabled={working} onClick={keepNumber}>
              {t("order.identity.phoneCancel", "Keep my number")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={stage?.k === "refused"} onOpenChange={(o) => !o && !working && keepNumber()}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("order.identity.refusedTitle", "We can’t change your number right now")}</DialogTitle>
            <DialogDescription>
              {stage?.k === "refused" && stage.reason === "limit"
                ? t(
                    "order.identity.refusedLimit",
                    "The number on this card was changed twice in the last 30 days, which is the most we allow. The shop can change it for you. You can still send this order to the new number.",
                  )
                : t(
                    "order.identity.refusedLocked",
                    "This profile was combined with another in the last 24 hours, so its number is locked until tomorrow. You can still send this order to the new number.",
                  )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button variant="brand" loading={working} onClick={() => void runOnce()}>
              {t("order.identity.useOnce", "Use it for just this order")}
            </Button>
            <Button variant="ghost" disabled={working} onClick={keepNumber}>
              {t("order.identity.phoneCancel", "Keep my number")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  ) : null;

  return { edit, busy: working || otp.sending || otp.verifying, begin, inline, dialogs };
}
