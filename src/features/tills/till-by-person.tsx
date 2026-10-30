import { useTranslation } from "react-i18next";

import { SectionHeader } from "@/components/app/section-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { TillPersonLine } from "@/data/api/generated/models";
import { fmtMoney, fmtNumber } from "@/lib/format";

/**
 * The till's sales by who served them (TELLER_PICK §3.8): the person picked
 * at checkout, else whoever was signed in. The server sends the lines only
 * when someone on this till was picked, largest first, and they add up to the
 * payment summary's sales and tips; the drawer itself is shared, not split.
 * Absent or empty, there is no section.
 */
export function TillByPerson({ lines }: { lines: TillPersonLine[] | undefined }) {
  const { t } = useTranslation();
  if (!lines || lines.length === 0) return null;
  // Tighter gaps between columns than the table's default; its outer 16px stays.
  const num = "px-2 text-end font-mono tabular-nums";
  return (
    <section className="space-y-3">
      <SectionHeader
        as="h3"
        title={t("tills.byPerson.title", "By person")}
        description={t("tills.byPerson.hint", "Who served each sale: the person picked at checkout, or whoever was signed in when nobody was picked.")}
      />
      <div className="overflow-hidden rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-2">{t("tills.teller", "Teller")}</TableHead>
              <TableHead className="px-2 text-end">{t("dashboard.orders", "Orders")}</TableHead>
              <TableHead className="px-2 text-end">{t("common.total", "Total")}</TableHead>
              <TableHead className="px-2 text-end">{t("tills.tips", "Tips")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((l, i) => (
              <TableRow key={l.person_id ?? `nobody-${i}`} className="hover:bg-transparent" data-testid="till-person-line">
                {/* The name takes what the figures leave and truncates; the figures never wrap. */}
                <TableCell className="w-full max-w-0 truncate px-2 font-medium" dir="auto">{l.name ?? "—"}</TableCell>
                <TableCell className={num}>{fmtNumber(l.order_count)}</TableCell>
                <TableCell className={num}>{fmtMoney(l.total)}</TableCell>
                <TableCell className={num}>{fmtMoney(l.tips)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
