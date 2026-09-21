import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { SegmentedControl } from "@/components/app/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { getGetPolicyQueryKey, setPolicy, useGetPolicy } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { queryClient } from "@/data/api/query";

import { approvalCapabilities, capLabel } from "./catalog";

type Mode = "hidden" | "ask";

/**
 * What someone sees for an act they are not allowed: nothing ("hidden"), or the
 * button with a manager PIN step ("ask a manager"). One choice per capability for
 * the whole business; only capabilities the registry marks for approval appear.
 */
export function AskManagerCard() {
  const { t, i18n } = useTranslation();
  const q = useGetPolicy();
  const [busy, setBusy] = useState<string | null>(null);
  const asks = new Set((q.data ?? []).filter((p) => p.ask_manager).map((p) => p.capability));
  const caps = approvalCapabilities();
  if (caps.length === 0) return null;

  const change = async (capability: string, mode: Mode) => {
    setBusy(capability);
    try {
      await setPolicy({ capability, ask_manager: mode === "ask" });
      await queryClient.invalidateQueries({ queryKey: getGetPolicyQueryKey() });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b bg-muted/30 px-4 py-2.5">
        <h3 className="text-sm font-semibold">{t("access.askTitle", "When someone isn't allowed")}</h3>
        <p className="text-xs text-muted-foreground">
          {t("access.askHint", "Hide the action, or let them ask a manager to approve it with their PIN.")}
        </p>
      </div>
      {q.isLoading ? (
        <div className="space-y-2 p-4">{caps.map((c) => <Skeleton key={c.key} className="h-10" />)}</div>
      ) : (
        <ul className="divide-y">
          {caps.map((c) => (
            <li key={c.key} className="flex min-h-12 flex-wrap items-center justify-between gap-3 px-4 py-2.5">
              <p className="text-sm font-medium">{capLabel(c, i18n.language)}</p>
              <SegmentedControl<Mode>
                value={asks.has(c.key) ? "ask" : "hidden"}
                onChange={(m) => busy !== c.key && void change(c.key, m)}
                options={[
                  { value: "hidden", label: t("access.hidden", "Hidden") },
                  { value: "ask", label: t("access.askManager", "Ask a manager") },
                ]}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
