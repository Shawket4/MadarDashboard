import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button";



export function ChartCard({ title, children, onExport, loading }: { title: string; children: React.ReactNode; onExport?: () => void; loading?: boolean }) {
  const { t, i18n } = useTranslation(); /* eslint-disable-next-line @typescript-eslint/no-unused-vars */ void i18n.language;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">{title}</p>
          {onExport && <Button variant="ghost" size="sm" onClick={onExport}>{t("common.export")}</Button>}
        </div>
        {loading ? <Skeleton className="h-[300px] rounded-lg" /> : children}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview Tab — KPIs + payment pie + top items progress
// ─────────────────────────────────────────────────────────────────────────────
