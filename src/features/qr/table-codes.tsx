/**
 * A code for every table in the room.
 *
 * The per-table code is what makes ordering-from-the-table reachable at all,
 * and until now there was no way to get one: the endpoint has existed since
 * the QR module was written, and nothing in the dashboard called it. A shop
 * could turn the feature on and still have no codes to put on the tables.
 *
 * Unlike the other codes on this page there is not ONE of these — there is one
 * per table, and a shop with thirty tables is not going to generate, preview
 * and print them thirty times. So the whole set is generated together and laid
 * out on one printable sheet, cut lines and all.
 *
 * Each card carries the table's LABEL in large type. A sheet of thirty
 * identical QR squares is unsortable once it comes off the printer, and the
 * one thing that distinguishes them is the thing the customer never looks at.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Printer, QrCode, Table2 } from "lucide-react";
import { toast } from "sonner";

import { tableQr, useListTables } from "@/data/api/generated/api";
import type { QrResponse } from "@/data/api/generated/models/qrResponse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { QrPreviewDialog } from "./qr-preview-dialog";

/** What we hold per table once its code has been fetched. */
interface TableCode {
  id: string;
  label: string;
  qr: QrResponse;
}

export function TableCodes({ branchId }: { branchId: string | null }) {
  const { t } = useTranslation();
  const [codes, setCodes] = useState<TableCode[]>([]);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<TableCode | null>(null);

  const tables = useListTables(branchId ?? "", {
    query: { enabled: !!branchId },
  });
  const rows = tables.data ?? [];

  // Codes belong to the branch they were made for; switching branches must not
  // leave the previous room's sheet on screen.
  const [shownFor, setShownFor] = useState<string | null>(null);
  if (shownFor !== branchId) {
    setShownFor(branchId);
    if (codes.length) setCodes([]);
  }

  const generateAll = async () => {
    if (!branchId || rows.length === 0) return;
    setBusy(true);
    try {
      // Sequential on purpose. Each one mints (or looks up) a short link
      // server-side, and firing thirty at once at a shared provider is how a
      // shop with a big room gets rate-limited on the one action it needs.
      const out: TableCode[] = [];
      for (const row of rows) {
        const qr = await tableQr(branchId, row.id, { caption: row.label });
        out.push({ id: row.id, label: row.label, qr });
      }
      setCodes(out);
    } catch {
      toast.error(t("qr.tables.failed", "Could not make the codes. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Table2 className="size-4" />
          {t("qr.tables.title", "Table codes")}
        </CardTitle>
        <CardDescription>
          {t(
            "qr.tables.description",
            "One code per table. A customer scans the one on their table and orders straight onto its bill — no branch to pick, no address to give.",
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {!branchId ? (
          <p className="text-sm text-muted-foreground">
            {t("qr.tables.pickBranch", "Choose a branch to see its tables.")}
          </p>
        ) : tables.isPending ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t(
              "qr.tables.none",
              "This branch has no tables yet. Add them on the floor plan first.",
            )}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={generateAll} disabled={busy}>
                <QrCode className="size-4" />
                {/* `count` is i18next's plural selector, and that is the
                    point: Arabic has six plural forms and "3 أكواد" is not
                    "11 كوداً". The locale files carry the forms; this passes
                    the number and lets the language decide. */}
                {busy
                  ? t("qr.tables.making", { count: rows.length })
                  : t("qr.tables.make", { count: rows.length })}
              </Button>
              {codes.length > 0 ? (
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="size-4" />
                  {t("qr.tables.print", "Print sheet")}
                </Button>
              ) : null}
            </div>

            {codes.length > 0 ? (
              <TableCodeSheet codes={codes} onPreview={setPreview} />
            ) : null}
          </>
        )}
      </CardContent>

      <QrPreviewDialog
        qr={preview?.qr ?? null}
        title={
          preview
            ? t("qr.tables.previewTitle", "Table {{label}}", { label: preview.label })
            : undefined
        }
        open={!!preview}
        onOpenChange={(o) => !o && setPreview(null)}
      />
    </Card>
  );
}

/**
 * The printable sheet.
 *
 * `print:` utilities turn the grid into something that survives a printer: the
 * page chrome disappears, each card gets a cut border, and a card is never
 * split across two sheets (`break-inside-avoid`). The QR itself sits on white
 * whatever the dashboard's theme is — a code printed out of a dark theme is a
 * code that does not scan.
 */
function TableCodeSheet({
  codes,
  onPreview,
}: {
  codes: TableCode[];
  onPreview: (code: TableCode) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="print-sheet grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {codes.map((code) => (
        <button
          key={code.id}
          type="button"
          onClick={() => onPreview(code)}
          title={t("qr.tables.previewHint", "Open this table's code")}
          className="flex break-inside-avoid flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center transition-colors hover:bg-muted print:border-dashed print:bg-white"
        >
          <span className="block w-full rounded bg-white p-1">
            <img
              src={code.qr.qr_data_url}
              alt={t("qr.tables.imageAlt", "Code for table {{label}}", {
                label: code.label,
              })}
              className="aspect-square w-full object-contain"
            />
          </span>
          {/* The label, large. Thirty identical squares are unsortable the
              moment they come off the printer. */}
          <span className="text-lg font-semibold leading-none print:text-black">
            {code.label}
          </span>
        </button>
      ))}
    </div>
  );
}
