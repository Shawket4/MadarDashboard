import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageCircle,
  PauseCircle,
  Power,
  QrCode,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
      <Page>
        <PageHeader title={t("whatsapp.title", "WhatsApp")} />
        <EmptyState
          icon={MessageCircle}
          title={t("whatsapp.forbidden", "Only super admins can manage the WhatsApp connection.")}
        />
      </Page>
    );
  }

  const loading = statusQuery.isLoading && !status;
  const busy = pair.isPending || logout.isPending;

  return (
    <Page>
      <PageHeader
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

      <div className="mx-auto w-full max-w-xl space-y-4">
        {/* ── Connection card ─────────────────────────────────── */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-success/10 text-success">
                  <MessageCircle className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold">{t("whatsapp.connection", "Connection")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("whatsapp.session", "Session")}: <span className="font-mono">{status?.session ?? "—"}</span>
                  </p>
                </div>
              </div>
              <StatusBadge status={status} loading={loading} t={t} />
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> {t("common.loading", "Loading…")}
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
                <div className="flex items-center gap-3 rounded-lg bg-success/10 p-3 text-success">
                  <CheckCircle2 className="size-5 shrink-0" />
                  <p className="text-sm font-medium">
                    {t("whatsapp.linked", "A number is linked and ready to send.")}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  className="w-full"
                  loading={logout.isPending}
                  disabled={busy}
                  onClick={() => logout.mutate()}
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
                <ol className="max-w-xs list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
                  <li>{t("whatsapp.step1", "Open WhatsApp on your phone.")}</li>
                  <li>{t("whatsapp.step2", "Tap Settings → Linked devices → Link a device.")}</li>
                  <li>{t("whatsapp.step3", "Scan this QR code. It refreshes automatically.")}</li>
                </ol>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
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
                <span className="grid size-10 place-items-center rounded-lg bg-warning/10 text-warning">
                  <PauseCircle className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold">{t("whatsapp.pauseTitle", "Pause sending")}</p>
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
                  <Badge variant="outline" className="border-transparent bg-warning/15 text-warning">
                    {t("whatsapp.paused", "Paused")}
                  </Badge>
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
    </Page>
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
      <Badge variant="outline" className="gap-1.5">
        <Loader2 className="size-3 animate-spin" /> {t("whatsapp.checking", "Checking…")}
      </Badge>
    );
  }
  if (!status.configured || !status.reachable) {
    return (
      <Badge variant="outline" className="gap-1.5 border-transparent bg-warning/15 text-warning">
        <AlertTriangle className="size-3" /> {t("whatsapp.offline", "Offline")}
      </Badge>
    );
  }
  if (status.logged_in) {
    return (
      <Badge variant="outline" className="gap-1.5 border-transparent bg-success/15 text-success">
        <CheckCircle2 className="size-3" /> {t("whatsapp.connected", "Connected")}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1.5 border-transparent bg-info/15 text-info">
      <QrCode className="size-3" /> {t("whatsapp.awaitingScan", "Awaiting scan")}
    </Badge>
  );
}

function Notice({ title, body }: { tone: "warning"; title: string; body: string }) {
  // Static classes only — Tailwind's JIT can't see interpolated class names.
  return (
    <div className="flex items-start gap-3 rounded-lg bg-warning/10 p-3 text-warning">
      <AlertTriangle className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs opacity-90">{body}</p>
      </div>
    </div>
  );
}
