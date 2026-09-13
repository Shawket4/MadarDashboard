import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  CheckCircle2,
  MessageCircle,
  PauseCircle,
  Power,
  QrCode,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

import { PaneHeader } from "@/features/settings/pane-header";
import { StatusPill } from "@/components/app/status-pill";
import { useConfirm } from "@/components/app/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/data/stores/auth.store";
import { getErrorMessage } from "@/data/api/errors";
import { queryClient } from "@/data/api/query";
import {
  getWhatsappStatusQueryKey,
  useWhatsappLogout,
  useWhatsappPair,
  useWhatsappPause,
  useWhatsappStatus,
} from "@/data/api/generated/api";
import type { WhatsappStatus } from "@/data/api/generated/models";

/** Push a fresh status snapshot into the query cache (mutations return it). */
const cacheStatus = (data: WhatsappStatus) =>
  queryClient.setQueryData(getWhatsappStatusQueryKey(), data);

export function WhatsappPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const role = useAuthStore((s) => s.user?.role);
  const isSuperAdmin = role === "super_admin";

  // Poll while the page is open so the QR refreshes and the link flips to
  // "connected" the moment the phone scans it.
  const statusQuery = useWhatsappStatus({
    query: { enabled: isSuperAdmin, refetchInterval: 2500, refetchOnWindowFocus: true },
  });
  const status = statusQuery.data;

  const onMutationError = (e: unknown) => toast.error(getErrorMessage(e));

  const pair = useWhatsappPair({
    mutation: { onSuccess: cacheStatus, onError: onMutationError },
  });
  const logout = useWhatsappLogout({
    mutation: {
      onSuccess: (d) => {
        cacheStatus(d);
        toast.success(t("whatsapp.unlinkedToast", "WhatsApp number unlinked."));
      },
      onError: onMutationError,
    },
  });
  const pause = useWhatsappPause({
    mutation: {
      onSuccess: (d) => {
        cacheStatus(d);
        toast.success(
          d.paused
            ? t("whatsapp.pausedToast", "Sending paused.")
            : t("whatsapp.resumedToast", "Sending resumed."),
        );
      },
      onError: onMutationError,
    },
  });

  // Defense-in-depth: the nav link is already super-admin-gated, but the route
  // is directly reachable, so block non-super-admins here too.
  if (!isSuperAdmin) {
    return (
      <div className="space-y-3">
        <PaneHeader title={t("whatsapp.title", "WhatsApp")} />
        <EmptyState
          icon={MessageCircle}
          title={t("whatsapp.forbidden", "Only super admins can manage the WhatsApp connection.")}
        />
      </div>
    );
  }

  const loading = statusQuery.isLoading && !status;
  const busy = pair.isPending || logout.isPending;

  return (
    <div className="space-y-3">
      <PaneHeader
        title={t("whatsapp.title", "WhatsApp")}
        description={t(
          "whatsapp.subtitle",
          "Link the WhatsApp number that sends delivery OTP codes and order updates.",
        )}
        actions={
          <Button
            variant="outline"
            onClick={() => void statusQuery.refetch()}
            disabled={statusQuery.isFetching}
          >
            <RefreshCw className={statusQuery.isFetching ? "size-4 animate-spin" : "size-4"} />
            {t("common.refresh", "Refresh")}
          </Button>
        }
      />

      <div className="space-y-3">
        {/* ── Connection card ─────────────────────────────────── */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-[10px] bg-secondary text-muted-foreground">
                  <MessageCircle className="size-4" />
                </span>
                <div>
                  <h3 className="text-base font-semibold">{t("whatsapp.connection", "Connection")}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t("whatsapp.session", "Session")}: <span className="font-mono">{status?.session ?? "—"}</span>
                  </p>
                </div>
              </div>
              <StatusBadge status={status} loading={loading} t={t} />
            </div>

            {loading ? (
              <div className="space-y-2 py-2" aria-busy>
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ) : !status?.configured ? (
              <Notice
                tone="warning"
                title={t("whatsapp.notConfigured", "Gateway not configured")}
                body={t(
                  "whatsapp.notConfiguredHint",
                  "Set WHATSAPP_SERVICE_URL on the backend to enable WhatsApp sending.",
                )}
              />
            ) : !status.reachable ? (
              <Notice
                tone="warning"
                title={t("whatsapp.unreachable", "Gateway unreachable")}
                body={t(
                  "whatsapp.unreachableHint",
                  "The WhatsApp service did not respond. Make sure it is running on the private network.",
                )}
              />
            ) : status.logged_in ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-success/12 p-3 text-[color-mix(in_oklch,var(--color-success)_60%,var(--color-foreground))]">
                  <CheckCircle2 className="size-5 shrink-0" />
                  <p className="text-sm font-medium">
                    {t("whatsapp.linked", "A number is linked and ready to send.")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full text-destructive sm:w-auto"
                  loading={logout.isPending}
                  disabled={busy}
                  onClick={async () => {
                    const ok = await confirm({
                      title: t("whatsapp.unlinkTitle", "Unlink this WhatsApp number?"),
                      description: t(
                        "whatsapp.unlinkHint",
                        "OTP codes and order updates stop sending until a number is linked again by scanning a new QR code.",
                      ),
                      confirmLabel: t("whatsapp.unlink", "Unlink number"),
                      destructive: true,
                    });
                    if (ok) logout.mutate();
                  }}
                >
                  <Power className="size-4" /> {t("whatsapp.unlink", "Unlink number")}
                </Button>
              </div>
            ) : status.has_qr && status.qr_image ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <img
                  src={status.qr_image}
                  alt={t("whatsapp.qrAlt", "WhatsApp pairing QR code")}
                  className="size-60 rounded-lg border bg-white p-2"
                />
                <ol className="max-w-xs list-decimal space-y-1 ps-5 text-xs text-muted-foreground">
                  <li>{t("whatsapp.step1", "Open WhatsApp on your phone.")}</li>
                  <li>{t("whatsapp.step2", "Tap Settings → Linked devices → Link a device.")}</li>
                  <li>{t("whatsapp.step3", "Scan this QR code. It refreshes automatically.")}</li>
                </ol>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground">
                  <QrCode className="size-6" />
                </span>
                <p className="text-sm text-muted-foreground">
                  {t("whatsapp.notLinked", "No number is linked yet.")}
                </p>
                <Button loading={pair.isPending} disabled={busy} onClick={() => pair.mutate()}>
                  <Smartphone className="size-4" /> {t("whatsapp.startPairing", "Generate QR to link")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Pause / resume sending ──────────────────────────── */}
        {status?.configured ? (
          <Card>
            <CardContent className="flex items-center justify-between gap-3 p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-secondary text-muted-foreground">
                  <PauseCircle className="size-4" />
                </span>
                <div>
                  <h3 className="text-base font-semibold">{t("whatsapp.pauseTitle", "Pause sending")}</h3>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    {t(
                      "whatsapp.pauseHint",
                      "Mute all WhatsApp messages (OTP + order updates) without unlinking the number.",
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {status.paused ? (
                  <StatusPill tone="warning">{t("whatsapp.paused", "Paused")}</StatusPill>
                ) : null}
                <Switch
                  checked={status.paused}
                  disabled={pause.isPending}
                  onCheckedChange={(next) => pause.mutate({ data: { paused: next } })}
                />
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────────

function StatusBadge({
  status,
  loading,
  t,
}: {
  status: WhatsappStatus | undefined;
  loading: boolean;
  t: (key: string, fallback: string) => string;
}) {
  if (loading || !status) {
    return (
      <StatusPill tone="neutral">{t("whatsapp.checking", "Checking…")}</StatusPill>
    );
  }
  if (!status.configured || !status.reachable) {
    return (
      <StatusPill tone="warning">{t("whatsapp.offline", "Offline")}</StatusPill>
    );
  }
  if (status.logged_in) {
    return (
      <StatusPill tone="success">{t("whatsapp.connected", "Connected")}</StatusPill>
    );
  }
  return (
    <StatusPill tone="accent" icon={QrCode}>{t("whatsapp.awaitingScan", "Awaiting scan")}</StatusPill>
  );
}

function Notice({ title, body }: { tone: "warning"; title: string; body: string }) {
  // Static classes only — Tailwind's JIT can't see interpolated class names.
  return (
    <div className="flex items-start gap-3 rounded-xl bg-warning/14 p-3">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[color-mix(in_oklch,var(--color-warning)_55%,var(--color-foreground))]" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
