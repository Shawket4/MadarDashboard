import { useTranslation } from "react-i18next";
import { Eye } from "lucide-react";

import { ListCard } from "@/components/app/list-row";
import { SectionHeader } from "@/components/app/section-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/data/api/errors";
import { useCan } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { fmtDateTime } from "@/lib/format";

import { useTillSpotViews, type TillSpotView } from "./api";

/** Who looked at the till's spot report (T17). No amounts. Gated by the till read capability. */
export function TillSpotViews({ tillId, enabled }: { tillId: string | null; enabled: boolean }) {
  const canRead = useCan(Cap.tillRead);
  if (!canRead) return null;
  return <TillSpotViewsLoader tillId={tillId} enabled={enabled} />;
}

function TillSpotViewsLoader({ tillId, enabled }: { tillId: string | null; enabled: boolean }) {
  const q = useTillSpotViews(tillId, enabled);
  if (q.isLoading) return <Skeleton className="h-24 w-full rounded-2xl" />;
  if (q.isError) {
    return (
      <p role="alert" className="text-sm text-muted-foreground">
        {getErrorMessage(q.error)}
      </p>
    );
  }
  return <SpotViewList views={q.data ?? []} />;
}

export function SpotViewList({ views }: { views: TillSpotView[] }) {
  const { t } = useTranslation();
  return (
    <section className="space-y-3" data-testid="till-spot-views">
      <SectionHeader as="h3" icon={Eye} title={t("tills.spotViews.title", "Spot reports viewed")} count={views.length} />
      {views.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="spot-views-empty">
          {t("tills.spotViews.empty", "Nobody has viewed the spot report for this till.")}
        </p>
      ) : (
        <ListCard>
          {views.map((v) => (
            <SpotViewRow key={v.id} view={v} />
          ))}
        </ListCard>
      )}
    </section>
  );
}

function SpotViewRow({ view }: { view: TillSpotView }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start justify-between gap-2 px-3 py-3 text-sm sm:px-4" data-testid="spot-view-row">
      <div className="min-w-0">
        <p className="font-medium">{view.viewed_by_name}</p>
        <p className="text-xs text-muted-foreground">
          <bdi className="tabular-nums">{fmtDateTime(view.viewed_at)}</bdi>
          {view.approved_by ? (
            <span data-testid="spot-view-unlocked">
              {" · "}
              {t("tills.spotViews.unlockedBy", { name: view.approved_by_name ?? "", defaultValue: "unlocked by {{name}}" })}
            </span>
          ) : null}
        </p>
      </div>
      {view.printed ? (
        <Badge variant="secondary" data-testid="spot-view-printed">
          {t("tills.spotViews.printed", "Printed")}
        </Badge>
      ) : null}
    </div>
  );
}
