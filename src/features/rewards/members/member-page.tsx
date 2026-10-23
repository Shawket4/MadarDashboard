/**
 * One member: where each stamp track stands, their card in the wallets, the
 * ledger (every earn, reward, reversal and hand adjustment), and the actions
 * their account allows (adjust, leave the programme). Read with `loyalty.read`;
 * the wallet panel with `loyalty.members.list`.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { BellOff, SlidersHorizontal, UserRound } from "lucide-react";

import { ErrorState } from "@/components/app/empty-state";
import { Link } from "@/components/app/link";
import { Page, PageHeader } from "@/components/app/page";
import { ProgressBar } from "@/components/app/progress-bar";
import { Restricted } from "@/components/app/restricted";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetLoyaltyMember, useGetLoyaltyMemberWallet, useListBranches } from "@/data/api/generated/api";
import type { MemberTrack, MemberView, MemberWallet } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { keepScope } from "@/data/scope/list-search";
import { useScope } from "@/data/scope/use-scope";
import { AdjustDialog } from "@/features/loyalty/admin/members/adjust-dialog";
import { LeaveProgrammeButton } from "@/features/loyalty/admin/members/leave-programme-dialog";
import { LedgerTable } from "@/features/loyalty/admin/members/member-section";
import { unitLabel } from "@/features/loyalty/shared/util";
import { OrderDetailSheet } from "@/features/orders/order-detail-sheet";
import { useOrgId } from "@/hooks/use-org-id";
import { fmtDate, fmtDateTime, fmtNumber } from "@/lib/format";
import { Reveal } from "@/lib/motion";
import { isSelling } from "@/lib/selling";

import { rewardsAccess } from "../access";
import { trackLabel, useTrackNames } from "../use-track-names";

const routeApi = getRouteApi("/_app/rewards/members_/$memberId");

/** More stamps than this read as a bar, not a row of dots. */
const MAX_DOTS = 20;

export function RewardsMemberPage() {
  const { t } = useTranslation();
  const authz = useAuthz();
  const access = rewardsAccess(authz);
  if (authz.ready && !access.canReadProgram) {
    return (
      <Restricted
        title={t("rewards.member.title", "Member")}
        who={t("rewards.member.restricted", "Your account can't open a member's card. The owner can give you access.")}
      />
    );
  }
  return <MemberBody />;
}

function MemberBody() {
  const { t, i18n } = useTranslation();
  const { memberId } = routeApi.useParams();
  const navigate = useNavigate();
  const authz = useAuthz();
  const access = rewardsAccess(authz);
  const { branchId } = useScope();
  const orgId = useOrgId() ?? "";
  const q = useGetLoyaltyMember(memberId);
  const wallet = useGetLoyaltyMemberWallet(memberId, { query: { enabled: access.canListMembers } });
  const branches = useListBranches({ org_id: orgId }, { query: { enabled: !!orgId && access.canAdjust } });
  const [adjusting, setAdjusting] = useState(false);
  const [openOrder, setOpenOrder] = useState<string | null>(null);
  const arabic = i18n.language.startsWith("ar");
  // What track 1 counts (stamp_unit): the word under each balance.
  const { unit: stampUnit } = useTrackNames();

  const member = q.data?.member;
  const tracks = useMemo(() => (member ? tracksOf(member) : []), [member]);
  const name = (tr: MemberTrack) =>
    trackLabel(tr, arabic, tr.position === 1 ? t("rewards.common.trackOne", "Main card") : t("rewards.common.trackN", { defaultValue: "Track {{n}}", n: tr.position }));
  const activeBranches = useMemo(
    () => (branches.data ?? []).filter((b) => b.is_active && isSelling(b)).map((b) => ({ id: b.id, name: b.name })),
    [branches.data],
  );
  const back = { to: "/rewards/members" };

  if (q.isError) {
    return (
      <Page>
        <PageHeader title={t("rewards.member.title", "Member")} back={back} />
        <ErrorState
          title={t("rewards.member.loadFailed", "Couldn't load this member")}
          message={getErrorMessage(q.error)}
          onRetry={() => void q.refetch()}
          retrying={q.isFetching}
        />
      </Page>
    );
  }

  if (!member || !q.data) {
    return (
      <Page>
        <PageHeader title={t("rewards.member.title", "Member")} back={back} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <Skeleton className="mt-4 h-64 rounded-2xl" />
      </Page>
    );
  }

  const multi = tracks.length > 1;

  return (
    <Page>
      <PageHeader
        title={<bdi>{member.name}</bdi>}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-x-2">
            <span dir="ltr" className="font-mono tabular">
              {member.phone}
            </span>
            <span>·</span>
            <span>{t("rewards.member.joined", { defaultValue: "Joined {{date}}", date: fmtDate(member.enrolled_at) })}</span>
          </span>
        }
        back={back}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/customers" search={{ q: member.phone }}>
                <UserRound className="size-4" />
                {t("rewards.member.customer", "Customer record")}
              </Link>
            </Button>
            {access.canAdjust ? (
              <Button variant="outline" size="sm" onClick={() => setAdjusting(true)}>
                <SlidersHorizontal className="size-4" />
                {t("loyalty.adjustTitle", "Adjust balance")}
              </Button>
            ) : null}
            {access.canForget ? (
              <LeaveProgrammeButton member={member} onLeft={() => void navigate({ to: "/rewards/members", search: keepScope } as never)} />
            ) : null}
          </>
        }
      />

      <Reveal className="space-y-4">
        <section aria-label={t("rewards.member.cardSection", "The card")} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tracks.map((tr) => (
            <TrackCard key={tr.position} track={tr} name={name(tr)} mode={tr.position === 1 ? member.mode : "visits"} unit={tr.position === 1 ? (stampUnit ?? (member.mode === "points" ? "points" : "order")) : "stamp"} />
          ))}
        </section>

        {access.canListMembers ? <WalletCard wallet={wallet.data} loading={wallet.isLoading} error={wallet.error} /> : null}

        <section className="space-y-2">
          <h2 className="text-base font-semibold">{t("rewards.member.ledger", "History")}</h2>
          <LedgerTable
            entries={q.data.ledger}
            onOpenOrder={setOpenOrder}
            trackName={multi ? (p) => name(tracks.find((x) => x.position === p) ?? ({ position: p } as MemberTrack)) : undefined}
          />
          {q.data.ledger.length >= 200 ? (
            <p className="text-xs text-muted-foreground">{t("loyalty.ledgerTruncated", "Showing the latest 200 movements.")}</p>
          ) : null}
        </section>
      </Reveal>

      {access.canAdjust ? (
        <AdjustDialog
          member={member}
          branches={activeBranches}
          defaultBranchId={branchId}
          open={adjusting}
          onOpenChange={setAdjusting}
          tracks={multi ? tracks.map((tr) => ({ position: tr.position, name: name(tr), balance: tr.balance })) : undefined}
        />
      ) : null}
      <OrderDetailSheet orderId={openOrder} open={!!openOrder} onOpenChange={(o) => !o && setOpenOrder(null)} onSwitchOrder={setOpenOrder} />
    </Page>
  );
}

/** Every track (the server sends them only when there are several); else track 1 from the member's own fields. */
function tracksOf(m: MemberView): MemberTrack[] {
  if (m.tracks && m.tracks.length > 0) return m.tracks;
  return [
    {
      position: 1,
      name_en: "",
      name_ar: "",
      size: m.next_reward_cost,
      balance: m.balance,
      rewards_ready: m.rewards_ready,
      progress_to_next: m.progress_to_next,
      points_to_next_reward: m.points_to_next_reward,
      can_redeem: m.can_redeem,
    },
  ];
}

function TrackCard({ track, name, mode, unit }: { track: MemberTrack; name: string; mode: string; unit: string }) {
  const { t } = useTranslation();
  const size = Math.max(1, track.size);
  const dots = mode === "visits" && size <= MAX_DOTS;
  const colour = track.colour ?? undefined;
  return (
    <Card className="py-0" data-testid="member-track">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-semibold">
            <bdi>{name}</bdi>
          </h3>
          {track.rewards_ready > 0 ? (
            <StatusPill tone="success" size="sm">
              {t("rewards.member.rewardsReady", { defaultValue: "{{n}} ready", n: fmtNumber(track.rewards_ready) })}
            </StatusPill>
          ) : null}
        </div>
        {dots ? (
          <div className="flex flex-wrap gap-1" aria-hidden>
            {Array.from({ length: size }, (_, i) => {
              const on = i < track.progress_to_next;
              return (
                <span
                  key={i}
                  className={on ? "size-4 rounded-full bg-primary" : "size-4 rounded-full border-2 border-border"}
                  // The track's colour is the shop's data, drawn as the card draws it.
                  style={on && colour ? { backgroundColor: colour } : undefined}
                />
              );
            })}
          </div>
        ) : (
          <ProgressBar value={track.progress_to_next} max={size} ariaLabel={name} className="h-2" />
        )}
        <p className="text-sm">
          <span className="font-mono tabular">
            {t("rewards.member.progress", { defaultValue: "{{n}} of {{size}}", n: track.progress_to_next, size })}
          </span>{" "}
          <span className="text-xs text-muted-foreground">
            {t("rewards.member.balanceIs", {
              defaultValue: "Balance {{balance}} {{unit}}",
              balance: fmtNumber(track.balance),
              unit: unitLabel(unit, track.balance),
            })}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}

function WalletCard({ wallet, loading, error }: { wallet: MemberWallet | undefined; loading: boolean; error: unknown }) {
  const { t } = useTranslation();
  if (loading) return <Skeleton className="h-28 rounded-2xl" />;
  if (error || !wallet) return <ErrorState title={t("rewards.member.walletFailed", "Couldn't load the wallet status")} message={error ? getErrorMessage(error) : undefined} />;
  const row = (label: string, value: string) => (
    <div className="flex justify-between gap-3 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-end">{value}</dd>
    </div>
  );
  const never = t("rewards.member.never", "—");
  return (
    <Card className="py-0">
      <CardContent className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold">{t("rewards.member.wallet", "In the wallets")}</h2>
          {wallet.marketing_opt_out ? (
            <StatusPill tone="neutral" size="sm" icon={BellOff}>
              {t("rewards.member.optedOut", "Turned off offers: messages never reach them")}
            </StatusPill>
          ) : null}
        </div>
        <dl className="grid gap-x-6 text-sm sm:grid-cols-2 [&>div]:border-b">
          {row(
            t("rewards.member.apple", "Apple Wallet"),
            wallet.apple_devices > 0
              ? t("rewards.member.appleDevices", { defaultValue: "{{n}} devices, since {{date}}", n: wallet.apple_devices, date: fmtDate(wallet.apple_registered_at) })
              : t("rewards.member.notAdded", "Not added"),
          )}
          {row(t("rewards.member.google", "Google Wallet"), wallet.google_card ? t("rewards.member.added", "Added") : t("rewards.member.notAdded", "Not added"))}
          {row(t("rewards.member.passUpdated", "Card last updated"), wallet.pass_updated_at ? fmtDateTime(wallet.pass_updated_at) : never)}
          {row(t("rewards.member.messages", "Messages received"), fmtNumber(wallet.messages_received))}
          {row(
            t("rewards.member.birthdayGift", "Birthday gift"),
            wallet.birthday_gift?.status === "open"
              ? t("rewards.member.giftOpen", { defaultValue: "Open until {{date}}", date: fmtDate(wallet.birthday_gift.valid_until) })
              : wallet.birthday_gift?.status === "claimed"
                ? t("rewards.member.giftClaimed", "Claimed")
                : t("rewards.member.giftNone", "None"),
          )}
        </dl>
        {wallet.notice ? (
          <div className="rounded-lg bg-secondary/60 p-3 text-sm">
            <p className="text-xs text-muted-foreground">
              {t("rewards.member.notice", { defaultValue: "On the card since {{at}}", at: fmtDateTime(wallet.notice_at) })}
              {" · "}
              {wallet.notice_seen_at
                ? t("rewards.member.noticeSeen", { defaultValue: "seen {{at}}", at: fmtDateTime(wallet.notice_seen_at) })
                : t("rewards.member.noticeUnseen", "not seen yet")}
            </p>
            <p className="mt-1" dir="auto">
              {wallet.notice}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
