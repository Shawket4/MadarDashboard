/**
 * Coverage needs (Dawam SC-13 input): how many people each hour of each
 * weekday needs at one branch. Typed here as an hour grid and saved as the
 * whole list — the server replaces it. Empty means no typed need; when the
 * engine is running on POS sales instead, what sales suggest shows greyed in
 * the empty cells. A need tied to a department isn't on this grid and is kept
 * as it is.
 */
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { putCoverage, useGetCoverage } from "@/data/api/generated/api";
import type { CoverageNeed } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { WEEKDAYS } from "@/features/staff/util";

/** Saturday first, as the roster's week runs; 0 = Sunday … 6 = Saturday. */
const DAY_ORDER = [6, 0, 1, 2, 3, 4, 5];
const END_OF_DAY = "23:59:59";

const hourOf = (t: string) => Number(t.slice(0, 2));
const endHour = (t: string) => {
  const [h, m, s] = t.split(":").map(Number);
  return h + (m || s ? 1 : 0);
};
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

export type Grid = Map<string, number>;
const key = (dow: number, h: number) => `${dow}|${h}`;

/** Bands (department-wide only) → one cell per weekday and hour. */
export function toGrid(needs: CoverageNeed[]): Grid {
  const g: Grid = new Map();
  for (const n of needs) {
    if (n.department_id) continue;
    for (let h = hourOf(n.band_start); h < endHour(n.band_end); h++) g.set(key(n.day_of_week, h), n.staff);
  }
  return g;
}

/** Cells → bands, runs of equal hours merged, empty and zero cells dropped. */
export function fromGrid(g: Grid): CoverageNeed[] {
  const out: CoverageNeed[] = [];
  for (let dow = 0; dow < 7; dow++) {
    let h = 0;
    while (h < 24) {
      const staff = g.get(key(dow, h));
      if (!staff) { h++; continue; }
      let end = h + 1;
      while (end < 24 && g.get(key(dow, end)) === staff) end++;
      out.push({ day_of_week: dow, band_start: `${hh(h)}:00`, band_end: end === 24 ? END_OF_DAY : `${hh(end)}:00`, staff, department_id: null });
      h = end;
    }
  }
  return out;
}

export function CoverageEditor({ branchId }: { branchId: string }) {
  const { t } = useTranslation();
  const q = useGetCoverage({ branch_id: branchId }, { query: { enabled: !!branchId } });
  const [grid, setGrid] = useState<Grid>(new Map());
  const [busy, setBusy] = useState(false);
  const view = q.data;
  useEffect(() => {
    if (view) setGrid(toGrid(view.needs));
  }, [view]);

  const derived = useMemo(() => (view?.source === "pos" ? toGrid(view.derived) : new Map<string, number>()), [view]);
  // 06:00–24:00, widened to any hour that already has a need.
  const hours = useMemo(() => {
    const used = [...grid.keys(), ...derived.keys()].map((k) => Number(k.split("|")[1]));
    const from = Math.min(6, ...used);
    return Array.from({ length: 24 - from }, (_, i) => from + i);
  }, [grid, derived]);

  if (!view) return <Skeleton className="h-64 w-full rounded-2xl" />;

  const set = (dow: number, h: number, v: string) => {
    const next = new Map(grid);
    const n = Math.max(0, Math.min(200, Math.trunc(Number(v))));
    if (v === "" || !Number.isFinite(n) || n === 0) next.delete(key(dow, h));
    else next.set(key(dow, h), n);
    setGrid(next);
  };

  const save = async () => {
    setBusy(true);
    try {
      const kept = view.needs.filter((n) => n.department_id);
      await putCoverage({ branch_id: branchId, needs: [...kept, ...fromGrid(grid)] });
      toast.success(t("dawam.coverageSaved", "Coverage needs saved"));
      void q.refetch();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const dayLabel = (dow: number) => {
    const w = WEEKDAYS.find((x) => x.value === dow)!;
    return t(w.labelKey, w.fallback);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle>{t("dawam.coverageTitle", "Coverage needs")}</CardTitle>
          <CardDescription>
            {view.source === "pos"
              ? t("dawam.coveragePos", { n: view.orders_per_staff, defaultValue: `Suggestions follow your sales now: one person for every ${view.orders_per_staff} orders an hour. Type a number to set it yourself.` })
              : view.source === "pattern"
                ? t("dawam.coveragePattern", "Suggestions follow the standing pattern. Type how many people each hour needs to set it yourself.")
                : t("dawam.coverageGrid", "How many people each hour needs. Suggestions fill the gaps.")}
          </CardDescription>
        </div>
        <Button onClick={() => void save()} disabled={busy}><Save className="size-4" />{t("common.save", "Save")}</Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th className="w-16" />
              {DAY_ORDER.map((d) => <th key={d} className="text-xs font-semibold text-muted-foreground">{dayLabel(d)}</th>)}
            </tr>
          </thead>
          <tbody>
            {hours.map((h) => (
              <tr key={h}>
                <td className="text-xs tabular-nums text-muted-foreground">{hh(h)}</td>
                {DAY_ORDER.map((d) => (
                  <td key={d}>
                    <input
                      type="number"
                      min={0}
                      max={200}
                      inputMode="numeric"
                      aria-label={`${dayLabel(d)} ${hh(h)}`}
                      className="h-8 w-full rounded-md border bg-background text-center tabular-nums placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      value={grid.get(key(d, h)) ?? ""}
                      placeholder={derived.get(key(d, h))?.toString() ?? ""}
                      onChange={(e) => set(d, h, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
