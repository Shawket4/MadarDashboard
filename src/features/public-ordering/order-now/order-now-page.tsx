/**
 * `/now/<member_token>` — "Order now" from a loyalty card (§4).
 *
 * The token identifies, the device authorises. Opening this page asks the
 * server who the card belongs to; without a device token proving that
 * customer's phone it answers with a first name, the last four digits and a
 * branch name — enough to say "is this you?" and nothing a stranger could use.
 *
 * This device's tokens are keyed by phone, and the masked answer does not say
 * the phone. So: try the tokens that could plausibly be theirs (`guest.ts` →
 * `orderNowCandidates`); if none unlocks it, the customer types their number
 * and proves it with a WhatsApp code. The server never starts a code from the
 * token — it would let anyone holding a card spam its owner — so the number is
 * typed in full and checked against nothing here: a code for some other number
 * verifies fine and simply leaves the answer masked, and the page says so.
 *
 * With the full context in hand the ordinary ordering page takes over, seeded:
 * branch and channel in the URL (unless the server marked them stale), and the
 * rest as a session.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { AlertCircle, ArrowRight, CreditCard, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useOrderNowContext } from "@/data/api/generated/api";
import { orderNowCandidates, setGuestPhone } from "@/features/public-shell/guest";
import { PhoneVerify } from "@/features/public-shell/phone-verify";
import { StorefrontShell } from "@/features/public-shell/storefront-shell";
import { usePublicBrand } from "@/features/public-shell/use-brand";
import { usePublicTheme } from "@/features/public-shell/use-public-theme";
import { ltrIsolate } from "@/lib/phone";

import { PublicOrderingPage } from "../public-ordering-page";
import type { OrderNowSession } from "./session";

interface Props {
  token: string;
  /** From the URL, once the flow is under way — the ordering page mirrors its selection there. */
  branch?: string;
  channel?: string;
  preview?: boolean;
}

interface Proof {
  phone: string;
  token: string;
}

export function OrderNowPage({ token, branch, channel, preview }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    usePublicTheme.getState().apply();
    return () => usePublicTheme.getState().restoreGlobal();
  }, []);

  // 1. Who is this card? Always answerable, always masked.
  const masked = useOrderNowContext(token, undefined, { query: { retry: false, staleTime: 5 * 60_000 } });
  const brand = usePublicBrand(masked.data?.org_id ?? null);

  // 2. The proofs worth trying, in order — then whatever the customer verifies.
  const candidates = useMemo<Proof[]>(
    () => (masked.data ? orderNowCandidates(masked.data.org_id, masked.data.phone_hint) : []),
    [masked.data],
  );
  const [tryIndex, setTryIndex] = useState(0);
  const [verified, setVerified] = useState<Proof | null>(null);
  // After a replace/combine the customer is known by another phone, proved a moment ago.
  const [replaced, setReplaced] = useState<(Proof & { name: string }) | null>(null);
  const proof: Proof | null = replaced ?? verified ?? candidates[tryIndex] ?? null;

  // The previous answer is kept while the next proof is checked, so a change of
  // number mid-order does not pull the ordering page out from under the cart.
  const unlocked = useOrderNowContext(token, { device_token: proof?.token ?? "" }, {
    query: { enabled: !!proof, retry: false, staleTime: 60_000, placeholderData: keepPreviousData },
  });
  const full = proof && unlocked.data && !unlocked.data.verify_required ? (unlocked.data.full ?? null) : null;
  const stillMasked = !!proof && !!unlocked.data && !unlocked.isPlaceholderData && unlocked.data.verify_required;

  // A remembered token that did not unlock it: on to the next one.
  useEffect(() => {
    if (stillMasked && !verified && tryIndex < candidates.length) setTryIndex((i) => i + 1);
  }, [stillMasked, verified, tryIndex, candidates.length]);

  // 3. Seed the ordering page's URL once: the branch and channel they last used,
  // unless the server says either cannot be used as-is right now.
  const seeded = useRef(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!full || seeded.current) return;
    seeded.current = true;
    const last = full.last_branch;
    const usable = last && !(last.stale && last.stale_reason !== "channel_closed");
    const next = branch
      ? null
      : usable
        ? { branch: last.id, channel: last.stale ? undefined : last.channel }
        : null;
    if (!next) {
      setReady(true);
      return;
    }
    void Promise.resolve(
      navigate({ to: ".", replace: true, search: (prev: Record<string, unknown>) => ({ ...prev, ...next }) }),
    ).finally(() => setReady(true));
  }, [full, branch, navigate]);

  const onIdentityReplaced = useCallback((next: { phone: string; deviceToken: string; name: string }) => {
    setReplaced({ phone: next.phone, token: next.deviceToken, name: next.name });
  }, []);

  const session = useMemo<OrderNowSession | null>(() => {
    if (!full || !proof || !masked.data) return null;
    return {
      memberToken: token,
      orgId: masked.data.org_id,
      customer: {
        id: full.customer_id,
        name: replaced?.name || full.name,
        phone: replaced?.phone ?? full.phone,
      },
      deviceToken: replaced?.token ?? proof.token,
      lastBranch: full.last_branch ?? null,
      addresses: full.addresses,
      paymentHint: full.last_payment_hint === "card" || full.last_payment_hint === "cash" ? full.last_payment_hint : null,
      onIdentityReplaced,
    };
  }, [full, proof, masked.data, token, replaced, onIdentityReplaced]);

  if (session && ready && masked.data) {
    return <PublicOrderingPage orgId={masked.data.org_id} branch={branch} channel={channel} preview={preview} orderNow={session} />;
  }

  const trying = !!proof && !stillMasked && !unlocked.isError && !full;
  const loading = masked.isLoading || trying || (!!full && !ready);
  // A code was verified and the card is still locked: the number proved is not the card's.
  const wrongNumber = !!verified && stillMasked;

  return (
    <StorefrontShell brand={brand} product="ordering">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 14 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto flex min-h-[58vh] w-full max-w-md flex-col justify-center gap-6"
      >
        {masked.isError ? (
          <div className="space-y-4 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <CreditCard className="size-7" />
            </span>
            <h1 className="font-serif text-2xl font-semibold text-balance">{t("order.now.notFoundTitle", "We couldn’t find that card")}</h1>
            <p className="text-pretty text-muted-foreground">
              {t("order.now.notFoundBody", "The link may be old. Open your loyalty card and tap Order now again.")}
            </p>
            <Button variant="outline" onClick={() => void masked.refetch()}>
              {t("common.retry", "Retry")}
            </Button>
          </div>
        ) : loading || !masked.data ? (
          <div className="flex flex-col items-center gap-4 py-16 text-muted-foreground" role="status">
            <Loader2 className="size-8 animate-spin text-brand" />
            <p className="text-sm">{t("order.now.opening", "Opening your order…")}</p>
          </div>
        ) : (
          <>
            <header className="space-y-2 text-center">
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-balance">
                {t("order.now.greeting", { defaultValue: "Hi {{name}}, is this you?", name: masked.data.first_name })}
              </h1>
              <p className="text-pretty text-muted-foreground">
                {masked.data.last_branch_name
                  ? t("order.now.verifyBodyBranch", {
                      defaultValue:
                        "Confirm your number ending {{hint}} and we’ll have your usual from {{branch}} ready to order: your address, your details, one tap to the menu.",
                      hint: ltrIsolate(masked.data.phone_hint),
                      branch: masked.data.last_branch_name,
                    })
                  : t("order.now.verifyBody", {
                      defaultValue: "Confirm your number ending {{hint}} and we’ll fill in your details for you.",
                      hint: ltrIsolate(masked.data.phone_hint),
                    })}
              </p>
            </header>

            {wrongNumber || unlocked.isError ? (
              <p role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />
                <span>
                  {wrongNumber
                    ? t("order.now.wrongNumber", {
                        defaultValue: "That isn’t the number on this card. Use the one ending {{hint}}.",
                        hint: ltrIsolate(masked.data.phone_hint),
                      })
                    : t("order.now.unlockFailed", "We couldn’t open your details. Try again.")}
                </span>
              </p>
            ) : null}

            <PhoneVerify
              // A refused number starts the form over rather than resuming a verified machine.
              key={wrongNumber ? `retry-${verified?.phone}` : "verify"}
              otpRequired
              submitVariant="brand"
              onVerified={(phone, deviceToken) => {
                if (!deviceToken) return;
                setGuestPhone(masked.data.org_id, phone);
                setVerified({ phone, token: deviceToken });
              }}
              copy={{
                title: t("order.now.phoneTitle", "Your phone number"),
                hint: t("order.now.phoneHint", "We’ll send a WhatsApp code the first time you order from this device."),
                sent: (phone) => t("order.otp.sent", { phone }),
                submitLabel: (
                  <>
                    {t("order.now.continue", "Continue")}
                    <ArrowRight className="size-4 rtl:rotate-180" />
                  </>
                ),
              }}
            />

            <p className="text-center text-sm text-muted-foreground">
              {t("order.now.notYou", "Not you?")}{" "}
              <a href={`${import.meta.env.BASE_URL}${masked.data.org_id}`} className="font-medium text-foreground underline underline-offset-4">
                {t("order.now.orderWithout", "Order without the card")}
              </a>
            </p>
          </>
        )}
      </motion.div>
    </StorefrontShell>
  );
}
