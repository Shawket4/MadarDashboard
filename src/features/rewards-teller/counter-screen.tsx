/**
 * The counter: find the member (card QR by camera, a wedge scanner, or their
 * phone), then stamp their card for this visit or complete a full one.
 *
 * Every number on screen is the server's: how many stamps a visit earns, the
 * card's size, whether it is full. The page sends who and how many items.
 * Each attempt carries its own key, so a retried tap never stamps twice.
 */
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Camera as CameraIcon, Minus, Plus, X } from "lucide-react";
import { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useConfirm } from "@/components/app/confirm-dialog";
import {
  useLoyaltyCounterRedeem,
  useLoyaltyCounterStamp,
  useLoyaltyLookup,
} from "@/data/api/generated/api";
import type { MemberView } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { formatPhoneDisplay } from "@/lib/phone";

import { Camera } from "./camera";
import type { Setup } from "./session";
import { MAX_ITEMS, cardDots, clampItems, readyToLookUp, type LookupBy } from "./util";

export function CounterScreen({ setup, onExpired }: { setup: Setup; onExpired: () => void }) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const [raw, setRaw] = useState("");
  const [camera, setCamera] = useState(false);
  const [member, setMember] = useState<MemberView | null>(null);
  const [items, setItems] = useState(1);
  // One key per attempt; kept across a failed try so the retry is the same act.
  const stampKey = useRef(crypto.randomUUID());
  const redeemKey = useRef(crypto.randomUUID());
  const inputRef = useRef<HTMLInputElement>(null);

  const fail = (e: unknown) => {
    if (e instanceof AxiosError && e.response?.status === 401) {
      toast.error(t("rewardsTeller.expired", "Signed out. Enter your PIN again."));
      onExpired();
      return;
    }
    toast.error(getErrorMessage(e));
  };
  const lookup = useLoyaltyLookup({ mutation: { onError: fail } });
  const stamp = useLoyaltyCounterStamp({ mutation: { onError: fail } });
  const redeem = useLoyaltyCounterRedeem({ mutation: { onError: fail } });

  const find = (by: LookupBy) => {
    setCamera(false);
    lookup.mutate(
      { data: { branch_id: setup.branchId, ...by } },
      {
        onSuccess: (r) => {
          setMember(r.member);
          setItems(1);
          setRaw("");
          stampKey.current = crypto.randomUUID();
          redeemKey.current = crypto.randomUUID();
        },
      },
    );
  };

  const capture = (text: string, submitted: boolean) => {
    const by = readyToLookUp(text, submitted);
    if (by) find(by);
    else if (submitted) toast.error(t("rewardsTeller.notACard", "That isn't a card or a phone number."));
  };

  const clear = () => {
    setMember(null);
    setRaw("");
    inputRef.current?.focus();
  };

  const doStamp = async () => {
    if (!member) return;
    if (
      items > 1 &&
      !(await confirm({
        title: t("rewardsTeller.confirmStampsTitle", "Stamp {{count}} items?", { count: items }),
        description: t("rewardsTeller.confirmStampsBody", "{{name}} bought {{count}} items on this visit.", {
          name: member.name,
          count: items,
        }),
        confirmLabel: t("rewardsTeller.stamp", "Stamp"),
      }))
    )
      return;
    stamp.mutate(
      {
        data: {
          branch_id: setup.branchId,
          customer_id: member.id,
          items,
          idempotency_key: stampKey.current,
        },
      },
      {
        onSuccess: (r) => {
          setMember(r.member);
          setItems(1);
          stampKey.current = crypto.randomUUID();
          toast.success(
            r.already
              ? t("rewardsTeller.alreadyStamped", "Already stamped")
              : t("rewardsTeller.stamped", "{{count}} stamps added", { count: r.stamps }),
          );
        },
      },
    );
  };

  const doRedeem = async () => {
    if (!member) return;
    const ok = await confirm({
      title: t("rewardsTeller.confirmRedeemTitle", "Complete {{name}}'s card?", { name: member.name }),
      description: t("rewardsTeller.confirmRedeemBody", "Hand over the free item. {{size}} stamps come off the card.", {
        size: member.next_reward_cost,
      }),
      confirmLabel: t("rewardsTeller.redeem", "Complete card"),
    });
    if (!ok) return;
    redeem.mutate(
      { data: { branch_id: setup.branchId, customer_id: member.id, idempotency_key: redeemKey.current } },
      {
        onSuccess: (r) => {
          setMember(r.member);
          redeemKey.current = crypto.randomUUID();
          toast.success(t("rewardsTeller.redeemed", "Card completed. Enjoy!"));
        },
      },
    );
  };

  if (member) {
    const dots = cardDots(member.balance, member.next_reward_cost);
    return (
      <section className="mx-auto w-full max-w-md space-y-4">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold">{member.name}</h2>
                <p className="text-sm text-muted-foreground" dir="ltr">{formatPhoneDisplay(member.phone)}</p>
              </div>
              <Button variant="ghost" size="icon" aria-label={t("rewardsTeller.nextCustomer", "Next customer")} onClick={clear}>
                <X className="size-5" />
              </Button>
            </div>
            <div
              role="img"
              aria-label={t("rewardsTeller.stampsOf", "{{have}} of {{size}} stamps", { have: dots.filled, size: dots.size })}
              className="flex flex-wrap gap-2"
            >
              {Array.from({ length: dots.size }, (_, i) => (
                <span
                  key={i}
                  className={`size-7 rounded-full border-2 ${i < dots.filled ? "border-primary bg-primary" : "border-muted-foreground/40"}`}
                />
              ))}
            </div>
            <p className="text-sm tabular-nums" data-testid="stamp-count">
              {t("rewardsTeller.stampsOf", "{{have}} of {{size}} stamps", { have: dots.filled, size: dots.size })}
              {dots.extra > 0 ? ` · ${t("rewardsTeller.extra", "+{{count}} on the next card", { count: dots.extra })}` : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-medium" id="items-label">{t("rewardsTeller.items", "Items on this visit")}</p>
            <div className="flex items-center gap-3" role="group" aria-labelledby="items-label">
              <Button
                variant="outline"
                size="icon"
                className="size-12"
                aria-label={t("rewardsTeller.fewer", "One fewer")}
                disabled={items <= 1}
                onClick={() => setItems((n) => clampItems(n - 1))}
              >
                <Minus className="size-5" />
              </Button>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_ITEMS}
                value={items}
                aria-labelledby="items-label"
                className="h-12 w-20 text-center font-mono text-lg"
                onChange={(e) => setItems(clampItems(Number(e.target.value)))}
              />
              <Button
                variant="outline"
                size="icon"
                className="size-12"
                aria-label={t("rewardsTeller.more", "One more")}
                disabled={items >= MAX_ITEMS}
                onClick={() => setItems((n) => clampItems(n + 1))}
              >
                <Plus className="size-5" />
              </Button>
            </div>
            <Button className="h-14 w-full text-base" loading={stamp.isPending} onClick={() => void doStamp()}>
              {t("rewardsTeller.stamp", "Stamp")}
            </Button>
            <Button
              variant="outline"
              className="h-14 w-full text-base"
              disabled={!member.can_redeem}
              loading={redeem.isPending}
              onClick={() => void doRedeem()}
            >
              {member.can_redeem ? t("rewardsTeller.redeem", "Complete card") : t("rewardsTeller.notFull", "Card not full yet")}
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-md space-y-4">
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          capture(raw, true);
        }}
      >
        <label htmlFor="scan" className="text-sm font-medium">
          {t("rewardsTeller.scanLabel", "Scan the card, or type the phone number")}
        </label>
        <div className="flex gap-2">
          <Input
            id="scan"
            ref={inputRef}
            autoFocus
            dir="ltr"
            inputMode="tel"
            autoComplete="off"
            value={raw}
            className="h-12 font-mono"
            onChange={(e) => {
              setRaw(e.target.value);
              capture(e.target.value, false);
            }}
          />
          <Button type="submit" className="h-12" loading={lookup.isPending}>
            {t("rewardsTeller.find", "Find")}
          </Button>
        </div>
      </form>
      <Button variant="outline" className="h-12 w-full" onClick={() => setCamera((c) => !c)}>
        <CameraIcon className="size-5" />
        {camera ? t("rewardsTeller.cameraOff", "Close the camera") : t("rewardsTeller.cameraOn", "Scan with the camera")}
      </Button>
      {camera ? <Camera onCode={(text) => capture(text, true)} /> : null}
    </section>
  );
}
