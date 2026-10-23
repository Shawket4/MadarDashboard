/**
 * The counter: find the member (card QR by camera, a card reader, or their
 * phone), then stamp their card for this visit or complete a full one.
 *
 * Scan first. The home screen is the viewfinder, with the phone field under
 * it and this session's activity at the foot; a card reader works from
 * anywhere on the page, with no field focused. The member screen is their
 * card as it looks in their wallet, with the visit's items and the Stamp
 * button where a thumb rests.
 *
 * Every number on screen is the server's: how many stamps a visit earns, the
 * card's size, whether it is full. The page sends who and how many items.
 * Each attempt carries its own key, so a retried tap never stamps twice.
 */
import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Ban,
  Cake,
  Check,
  CircleAlert,
  Gift,
  Minus,
  Plus,
  RotateCcw,
  ScanLine,
  ScanQrCode,
  Stamp,
  UserX,
  WifiOff,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useLoyaltyCounterBirthdayGift,
  useLoyaltyCounterRedeem,
  useLoyaltyCounterStamp,
  useLoyaltyLookup,
  usePublicOrgBrand,
} from "@/data/api/generated/api";
import type { MemberView } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { fmtTime } from "@/lib/format";
import { usePop, useShake } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { tNames } from "./bidi";
import { BirthdayGift } from "./birthday-gift";
import { Camera } from "./camera";
import { CounterConfirm, type ConfirmAsk } from "./counter-confirm";
import { feedback } from "./feedback";
import { MemberCard } from "./member-card";
import { type Activity, type Setup, loadRecent, pushRecent } from "./session";
import { useOnline } from "./use-online";
import {
  MAX_ITEMS,
  type LookupBy,
  type Track,
  type Wedge,
  cardColors,
  clampItems,
  failureOf,
  feedWedge,
  giftState,
  readyToLookUp,
  tracksOf,
  type GiftState,
} from "./util";

type Notice =
  | { tone: "ok"; title: ReactNode; body?: ReactNode }
  | { tone: "fail"; icon: ReactNode; title: ReactNode; body: ReactNode; retry?: () => void };

export function CounterScreen({ setup, onExpired }: { setup: Setup; onExpired: () => void }) {
  const { t } = useTranslation();
  const online = useOnline();
  const [raw, setRaw] = useState("");
  const [camera, setCamera] = useState(false);
  const [member, setMember] = useState<MemberView | null>(null);
  const [gift, setGift] = useState<GiftState | null>(null);
  const [items, setItems] = useState(1);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [ask, setAsk] = useState<ConfirmAsk | null>(null);
  const [recent, setRecent] = useState<Activity[]>(loadRecent);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  // Camera found the last member: "Next customer" opens it again.
  const [fromCamera, setFromCamera] = useState(false);
  const answer = useRef<((yes: boolean) => void) | null>(null);
  // One key per attempt; kept across a failed try so the retry is the same act.
  const stampKey = useRef(crypto.randomUUID());
  const redeemKey = useRef(crypto.randomUUID());
  const giftKey = useRef(crypto.randomUUID());
  const cardRef = useRef<HTMLElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const [okSignal, setOkSignal] = useState(0);
  const [failSignal, setFailSignal] = useState(0);
  usePop(cardRef, okSignal);
  usePop(noticeRef, okSignal);
  useShake(noticeRef, failSignal);

  const brand = usePublicOrgBrand(
    { org_id: setup.orgId },
    { query: { staleTime: 5 * 60_000, retry: false } },
  );
  const shopName = brand.data?.name ?? setup.branchName;
  const colors = cardColors(brand.data);

  const lookup = useLoyaltyLookup();
  const stamp = useLoyaltyCounterStamp();
  const redeem = useLoyaltyCounterRedeem();
  const claimGift = useLoyaltyCounterBirthdayGift();
  const busy = lookup.isPending || stamp.isPending || redeem.isPending || claimGift.isPending;

  const succeed = (n: Notice & { tone: "ok" }) => {
    setNotice(n);
    setOkSignal((s) => s + 1);
    feedback("ok");
  };

  /** Say what went wrong, where the teller is looking, in their language. */
  const fail = (e: unknown, retry?: () => void) => {
    const f = failureOf(e);
    if (f.kind === "expired") {
      onExpired();
      return;
    }
    const n: Notice =
      f.kind === "offline"
        ? {
            tone: "fail",
            icon: <WifiOff className="size-6" />,
            title: t("rewardsTeller.offlineTitle", "No connection"),
            body: t("rewardsTeller.offlineBody", "Nothing was saved. Check the Wi-Fi, then try again."),
            retry,
          }
        : f.kind === "giftNone"
          ? {
              tone: "fail",
              icon: <Cake className="size-6" />,
              title: t("rewardsTeller.giftNoneTitle", "No birthday gift to give"),
              body: t("rewardsTeller.giftNoneBody", "It has expired or was already handed over."),
            }
        : f.kind === "notMember"
          ? {
              tone: "fail",
              icon: <UserX className="size-6" />,
              title: t("rewardsTeller.notMemberTitle", "Not a member yet"),
              body: t("rewardsTeller.notMemberBody", "No card matches. Check the number, or ask them to join with the shop's QR code."),
            }
          : f.kind === "notAllowed"
            ? {
                tone: "fail",
                icon: <Ban className="size-6" />,
                title: t("rewardsTeller.notAllowedTitle", "Stamps are off for this shop"),
                // A plan refusal's own sentence talks to the owner about upgrading; the teller needs who to ask.
                body: f.plan
                  ? t("rewardsTeller.notAllowedPlan", "Rewards isn't switched on for this shop. Ask the shop owner.")
                  : `${getErrorMessage(e)} ${t("rewardsTeller.askOwner", "Ask the shop owner.")}`,
              }
            : {
                tone: "fail",
                icon: <CircleAlert className="size-6" />,
                title: t("rewardsTeller.failedTitle", "That didn't go through"),
                body: getErrorMessage(e),
                retry,
              };
    setNotice(n);
    setFailSignal((s) => s + 1);
    feedback("fail");
  };

  const find = (by: LookupBy, viaCamera = false) => {
    setCamera(false);
    setNotice(null);
    const run = () =>
      lookup.mutate(
        { data: { branch_id: setup.branchId, ...by } },
        {
          onSuccess: (r) => {
            setMember(r.member);
            setGift(giftState(r.birthday_gift));
            setFromCamera(viaCamera);
            setItems(1);
            setRaw("");
            stampKey.current = crypto.randomUUID();
            redeemKey.current = crypto.randomUUID();
            giftKey.current = crypto.randomUUID();
            feedback("ok");
          },
          onError: (e) => fail(e, run),
        },
      );
    run();
  };

  const capture = (text: string, submitted: boolean, viaCamera = false) => {
    const by = readyToLookUp(text, submitted);
    if (by) find(by, viaCamera);
    else if (submitted) {
      setNotice({
        tone: "fail",
        icon: <CircleAlert className="size-6" />,
        title: t("rewardsTeller.notACard", "That isn't a card or a phone number."),
        body: t("rewardsTeller.notACardBody", "Type the member's mobile number, like 010 1234 5678, or scan their card."),
      });
      setFailSignal((s) => s + 1);
      feedback("fail");
    }
  };

  // A card reader types into the page with no field focused.
  const wedge = useRef<Wedge>({ buf: "", at: 0 });
  const findRef = useRef(find);
  useEffect(() => {
    findRef.current = find;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (el?.closest("input, textarea, select, [contenteditable=true], [role=dialog], [role=alertdialog]")) return;
      const { wedge: next, lookup: by } = feedWedge(wedge.current, e.key, e.timeStamp);
      wedge.current = next;
      if (by) {
        e.preventDefault();
        findRef.current(by);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const nextCustomer = () => {
    setMember(null);
    setGift(null);
    setNotice(null);
    setRaw("");
    setCamera(fromCamera);
  };

  const confirm = (a: ConfirmAsk) =>
    new Promise<boolean>((resolve) => {
      answer.current = resolve;
      setAsk(a);
    });

  const remember = (a: Omit<Activity, "at">) => setRecent(pushRecent({ ...a, at: new Date().toISOString() }));

  const doStamp = async () => {
    if (!member) return;
    const name = member.name;
    if (
      items > 1 &&
      !(await confirm({
        figure: items,
        title: t("rewardsTeller.confirmStampsTitle", "Stamp {{count}} items?", { count: items }),
        body: tNames(t, "rewardsTeller.confirmStampsBody", { defaultValue: "{{name}} bought {{count}} items on this visit.", name, count: items }, ["name"]),
        yes: t("rewardsTeller.stampYes", "Yes, stamp {{count}}", { count: items }),
      }))
    )
      return;
    setNotice(null);
    const run = () =>
      stamp.mutate(
        { data: { branch_id: setup.branchId, customer_id: member.id, items, idempotency_key: stampKey.current } },
        {
          onSuccess: (r) => {
            setMember(r.member);
            setItems(1);
            stampKey.current = crypto.randomUUID();
            const [tr] = tracksOf(r.member);
            if (!r.already) remember({ memberId: r.member.id, name, kind: "stamp", count: r.stamps });
            succeed({
              tone: "ok",
              title: r.already
                ? t("rewardsTeller.alreadyStamped", "Already stamped")
                : t("rewardsTeller.stampedN", { count: r.stamps, defaultValue_one: "1 stamp added", defaultValue_other: "{{count}} stamps added" }),
              body: tr?.canRedeem
                ? t("rewardsTeller.nowFull", "The card is full.")
                : tNames(t, "rewardsTeller.nowHas", { defaultValue: "{{name}} now has {{have}} of {{size}}.", name, have: tr?.filled ?? 0, size: tr?.size ?? 0 }, ["name"]),
            });
          },
          onError: (e) => fail(e, run),
        },
      );
    run();
  };

  const doRedeem = async (track: Track) => {
    if (!member) return;
    const name = member.name;
    const ok = await confirm({
      figure: <Gift className="mx-auto size-16" strokeWidth={1.5} />,
      title: tNames(t, "rewardsTeller.confirmRedeemTitle", { defaultValue: "Complete {{name}}'s card?", name }, ["name"]),
      body: t("rewardsTeller.confirmRedeemBody", "Hand over the free item. {{size}} stamps come off the card.", { size: track.size }),
      yes: t("rewardsTeller.redeem", "Complete card"),
    });
    if (!ok) return;
    setNotice(null);
    setRedeeming(track.id);
    const run = () =>
      redeem.mutate(
        { data: { branch_id: setup.branchId, customer_id: member.id, idempotency_key: redeemKey.current } },
        {
          onSuccess: (r) => {
            setMember(r.member);
            redeemKey.current = crypto.randomUUID();
            if (!r.already) remember({ memberId: r.member.id, name, kind: "redeem", count: track.size });
            succeed({
              tone: "ok",
              title: t("rewardsTeller.redeemedTitle", "Card completed"),
              body: t("rewardsTeller.redeemedBody", "Hand over the reward. Enjoy!"),
            });
          },
          onError: (e) => fail(e, run),
          onSettled: () => setRedeeming(null),
        },
      );
    run();
  };

  const doGift = async () => {
    if (!member) return;
    const name = member.name;
    const ok = await confirm({
      figure: <Cake className="mx-auto size-16" strokeWidth={1.5} />,
      title: tNames(t, "rewardsTeller.giftConfirmTitle", { defaultValue: "Give {{name}} their birthday gift?", name }, ["name"]),
      body: t("rewardsTeller.giftConfirmBody", "Hand over one free item, the shop's pick. Their stamps don't change."),
      yes: t("rewardsTeller.giftGive", "Give the gift"),
    });
    if (!ok) return;
    setNotice(null);
    const run = () =>
      claimGift.mutate(
        { data: { branch_id: setup.branchId, customer_id: member.id, idempotency_key: giftKey.current } },
        {
          onSuccess: (r) => {
            setMember(r.member);
            setGift(giftState(r.birthday_gift));
            giftKey.current = crypto.randomUUID();
            if (!r.already) remember({ memberId: r.member.id, name, kind: "gift", count: 0 });
            succeed({
              tone: "ok",
              title: r.already
                ? t("rewardsTeller.giftAlready", "Already given")
                : t("rewardsTeller.giftGiven", "Gift given"),
              body: r.already
                ? t("rewardsTeller.giftAlreadyBody", "This gift was handed over a moment ago. Nothing new was recorded.")
                : tNames(t, "rewardsTeller.giftGivenBody", { defaultValue: "Hand over one free item. Happy birthday, {{name}}!", name }, ["name"]),
            });
          },
          onError: (e) => {
            // Gone since the lookup (expired, or claimed at another till): say so on the card too.
            if (failureOf(e).kind === "giftNone") setGift((g) => (g ? { ...g, status: "expired" } : g));
            fail(e, run);
          },
        },
      );
    run();
  };

  const offlineBlock = !online;

  const banner = notice ? <NoticeBanner ref={noticeRef} notice={notice} onDismiss={() => setNotice(null)} /> : null;

  const dialog = (
    <CounterConfirm
      ask={ask}
      onAnswer={(yes) => {
        setAsk(null);
        answer.current?.(yes);
        answer.current = null;
      }}
    />
  );

  if (member) {
    const tracks = tracksOf(member);
    return (
      <div className="mx-auto grid w-full max-w-xl md:max-w-2xl grid-cols-[minmax(0,1fr)] gap-4 lg:max-w-5xl lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start lg:gap-6">
        <div className="space-y-4">
          <Button variant="outline" className="h-12 rounded-2xl px-4 text-base" onClick={nextCustomer}>
            <ArrowLeft className="size-5 rtl:rotate-180" aria-hidden />
            {t("rewardsTeller.nextCustomer", "Next customer")}
          </Button>
          {gift ? (
            <BirthdayGift
              gift={gift.status === "open" && gift.lastDay.getTime() < Date.now() ? { ...gift, status: "expired" } : gift}
              busy={claimGift.isPending}
              disabled={offlineBlock || busy}
              onGive={() => void doGift()}
            />
          ) : null}
          <MemberCard
            ref={cardRef}
            shopName={shopName}
            name={member.name}
            phone={member.phone}
            tracks={tracks}
            colors={colors}
            redeeming={redeeming}
            disabled={offlineBlock || busy}
            onRedeem={(tr) => void doRedeem(tr)}
          />
        </div>

        {/* Sticky on a phone, so Stamp stays under the thumb while the card scrolls. */}
        <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] lg:static lg:pt-16">
          <section
            aria-labelledby="items-label"
            className="space-y-4 rounded-[28px] border bg-card p-5 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.25)] lg:static lg:shadow-xs"
          >
            {/* The answer lands where the thumb is: above the stepper, never scrolled away. */}
            <div aria-live="polite" aria-atomic="true" className="empty:hidden">{banner}</div>
            <p id="items-label" className="text-base font-semibold">
              {t("rewardsTeller.items", "Items on this visit")}
            </p>
            <div className="flex items-center gap-3" role="group" aria-labelledby="items-label">
              <Button
                variant="secondary"
                className="size-16 shrink-0 rounded-2xl"
                aria-label={t("rewardsTeller.fewer", "One fewer")}
                disabled={items <= 1}
                onClick={() => setItems((n) => clampItems(n - 1))}
              >
                <Minus className="size-7" aria-hidden />
              </Button>
              {/* A figure, not a field: phones force inputs to 16px, and a count read
                  across a counter wants to be the biggest thing in the panel. */}
              <output
                aria-live="polite"
                className="min-w-0 flex-1 text-center font-mono text-5xl font-semibold tabular-nums"
              >
                {items}
              </output>
              <Button
                variant="secondary"
                className="size-16 shrink-0 rounded-2xl"
                aria-label={t("rewardsTeller.more", "One more")}
                disabled={items >= MAX_ITEMS}
                onClick={() => setItems((n) => clampItems(n + 1))}
              >
                <Plus className="size-7" aria-hidden />
              </Button>
            </div>
            <Button
              className="h-16 w-full rounded-2xl text-lg font-semibold"
              loading={stamp.isPending}
              disabled={offlineBlock || lookup.isPending || redeem.isPending}
              onClick={() => void doStamp()}
            >
              {stamp.isPending ? null : <Stamp className="size-6" aria-hidden />}
              {t("rewardsTeller.stampN", { count: items, defaultValue_one: "Stamp 1 item", defaultValue_other: "Stamp {{count}} items" })}
            </Button>
          </section>
        </div>
        {dialog}
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-xl md:max-w-2xl grid-cols-[minmax(0,1fr)] gap-5 lg:max-w-5xl lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
      {/* The viewfinder: the camera when it is on, the big Scan button when it is off. */}
      <section
        aria-label={t("rewardsTeller.scanCard", "Scan a card")}
        className="relative h-[clamp(17rem,46dvh,32rem)] overflow-hidden rounded-[28px] bg-[var(--madar-ink)] text-[var(--madar-paper)] dark:ring-1 dark:ring-white/12 lg:h-auto lg:aspect-[4/3.6]"
      >
        {camera ? (
          <>
            <Camera onCode={(text) => capture(text, true, true)} />
            <Button
              variant="ghost"
              size="icon"
              className="absolute end-3 top-3 size-12 rounded-full bg-black/45 text-white hover:bg-black/60 hover:text-white"
              aria-label={t("rewardsTeller.cameraOff", "Close the camera")}
              onClick={() => setCamera(false)}
            >
              <X className="size-6" aria-hidden />
            </Button>
          </>
        ) : (
          <button
            type="button"
            data-press="product"
            disabled={lookup.isPending}
            onClick={() => {
              setNotice(null);
              setCamera(true);
            }}
            className="flex size-full flex-col items-center justify-center gap-4 p-6 outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white/60"
          >
            <span className="grid size-24 place-items-center rounded-[28px] bg-white/8 ring-1 ring-white/15">
              <ScanQrCode className="size-12" strokeWidth={1.5} aria-hidden />
            </span>
            <span className="text-2xl font-semibold">{t("rewardsTeller.scanCard", "Scan a card")}</span>
            <span className="text-sm opacity-75">{t("rewardsTeller.scanTap", "Tap to open the camera")}</span>
          </button>
        )}
      </section>

      <div className="space-y-5">
        <div aria-live="polite" aria-atomic="true">{banner}</div>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            capture(raw, true);
          }}
        >
          <label htmlFor="scan" className="text-base font-semibold">
            {t("rewardsTeller.scanLabel", "Or type the phone number")}
          </label>
          <div className="flex gap-2">
            <Input
              id="scan"
              dir="ltr"
              inputMode="tel"
              autoComplete="off"
              enterKeyHint="search"
              placeholder="01X XXXX XXXX"
              value={raw}
              className="h-14 rounded-2xl px-4 font-mono text-xl md:text-xl"
              onChange={(e) => {
                setRaw(e.target.value);
                setNotice(null);
                capture(e.target.value, false);
              }}
            />
            <Button
              type="submit"
              className="h-14 rounded-2xl px-6 text-base"
              loading={lookup.isPending}
              disabled={offlineBlock || !raw.trim()}
            >
              {t("rewardsTeller.find", "Find")}
            </Button>
          </div>
          <p className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
            <ScanLine className="size-4 shrink-0" aria-hidden />
            {t("rewardsTeller.readerHint", "A card reader works any time: just scan.")}
          </p>
        </form>
        <RecentStrip recent={recent} disabled={busy || offlineBlock} onOpen={(a) => find({ customer_id: a.memberId })} />
      </div>
      {dialog}
    </div>
  );
}

function NoticeBanner({
  notice,
  onDismiss,
  ref,
}: {
  notice: Notice;
  onDismiss: () => void;
  ref: Ref<HTMLDivElement>;
}) {
  const { t } = useTranslation();
  const ok = notice.tone === "ok";
  return (
    <div
      ref={ref}
      role={ok ? "status" : "alert"}
      className={cn(
        "flex items-start gap-3 rounded-[22px] border p-4",
        ok
          ? "border-[color-mix(in_oklab,var(--color-success)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-success)_12%,var(--color-card))]"
          : "border-[color-mix(in_oklab,var(--color-destructive)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-destructive)_10%,var(--color-card))]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-full",
          ok ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground",
        )}
      >
        {ok ? <Check className="size-6" strokeWidth={3} /> : notice.icon}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p
          className={cn(
            "text-lg font-semibold leading-snug",
            ok
              ? "text-[color-mix(in_oklab,var(--color-success)_50%,var(--color-foreground))]"
              : "text-[color-mix(in_oklab,var(--color-destructive)_50%,var(--color-foreground))]",
          )}
        >
          {notice.title}
        </p>
        {notice.body ? <p className="mt-0.5 text-[15px] text-pretty">{notice.body}</p> : null}
        {!ok && notice.retry ? (
          <Button variant="outline" className="mt-3 h-11 rounded-xl px-4" onClick={notice.retry}>
            <RotateCcw className="size-4" aria-hidden />
            {t("rewardsTeller.tryAgain", "Try again")}
          </Button>
        ) : null}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="-me-1 -mt-1 size-10 shrink-0 rounded-full"
        aria-label={t("rewardsTeller.dismiss", "Dismiss")}
        onClick={onDismiss}
      >
        <X className="size-5" aria-hidden />
      </Button>
    </div>
  );
}

/** This session's stamps and completed cards: a glance back, and a way to reopen a member. */
function RecentStrip({
  recent,
  disabled,
  onOpen,
}: {
  recent: Activity[];
  disabled: boolean;
  onOpen: (a: Activity) => void;
}) {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="recent-label" className="space-y-2">
      <h2 id="recent-label" className="text-base font-semibold">
        {t("rewardsTeller.recentTitle", "This session")}
      </h2>
      {recent.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-4 text-sm text-muted-foreground">
          {t("rewardsTeller.recentEmpty", "Cards you stamp show up here, so you can open one again.")}
        </p>
      ) : (
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {recent.map((a) => (
            <li key={`${a.memberId}-${a.at}`} className="shrink-0">
              <button
                type="button"
                data-press="product"
                disabled={disabled}
                onClick={() => onOpen(a)}
                className="flex h-16 w-max min-w-44 items-center gap-3 rounded-2xl border bg-card px-3 text-start outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60 lg:w-full"
              >
                <span
                  aria-hidden
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full",
                    a.kind === "stamp" ? "bg-secondary" : "bg-primary text-primary-foreground",
                  )}
                >
                  {a.kind === "redeem" ? <Gift className="size-5" /> : a.kind === "gift" ? <Cake className="size-5" /> : <Stamp className="size-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block max-w-40 truncate font-semibold lg:max-w-none">
                    <bdi>{a.name}</bdi>
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {a.kind === "redeem"
                      ? t("rewardsTeller.recentRedeemed", "Card completed")
                      : a.kind === "gift"
                        ? t("rewardsTeller.recentGift", "Birthday gift")
                      : t("rewardsTeller.recentStamped", { count: a.count, defaultValue_one: "+1 stamp", defaultValue_other: "+{{count}} stamps" })}
                    {" · "}
                    <time dateTime={a.at}>{fmtTime(a.at)}</time>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
