/**
 * A code for every table in the room.
 *
 * The per-table code is what makes ordering-from-the-table reachable at all.
 * Unlike the other codes on this page there is not ONE of these — there is one
 * per table, and a shop with thirty tables is not going to generate, preview
 * and print them thirty times. So the whole set is generated together and
 * printed together, on one sheet.
 *
 * The set follows the page's output switches like every other code: flip
 * Unbranded and the sheet is made again, unbranded (`useQuery` keyed by the
 * output, the old sheet held up until the new one is complete).
 *
 * On screen each code carries the table's LABEL in large type: a sheet of
 * thirty identical squares is unsortable. On paper the label goes with the
 * branded card, as it always has; an unbranded sheet prints the codes and
 * nothing else, in the order of the list.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Printer, QrCode, Table2 } from "lucide-react";
import { toast } from "@/components/ui/toast";

import { tableQr, useListTables } from "@/data/api/generated/api";
import type { QrResponse } from "@/data/api/generated/models/qrResponse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { LIVE_QR_KEY } from "./live";
import { qrRenderParams, qrShape, useQrOutput } from "./output";
import { QrOutputControls } from "./output-controls";
import { printCodes } from "./print";
import { missingLogo } from "./qr-dialog";
import { QrPreviewDialog } from "./qr-preview-dialog";

/** What we hold per table once its code has been fetched. */
interface TableCode {
  id: string;
  label: string;
  qr: QrResponse;
}

export function TableCodes({ branchId }: { branchId: string | null }) {
  const { t } = useTranslation();
  const [output] = useQrOutput();
  const params = qrRenderParams(output);
  const shape = qrShape(output);
  const [requestedFor, setRequestedFor] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const tables = useListTables(branchId ?? "", {
    query: { enabled: !!branchId },
  });
  const rows = tables.data ?? [];

  // Codes belong to the branch they were made for; switching branches must not
  // leave the previous room's sheet on screen.
  const enabled = !!branchId && requestedFor === branchId && rows.length > 0;
  const sheet = useQuery({
    queryKey: [LIVE_QR_KEY, "tables", branchId, rows.map((r) => `${r.id}:${r.label}`), params],
    // Sequential on purpose. Each one mints (or looks up) a short link
    // server-side, and firing thirty at once at a shared provider is how a
    // shop with a big room gets rate-limited on the one action it needs.
    queryFn: async () => {
      const out: TableCode[] = [];
      for (const row of rows) {
        const qr = await tableQr(branchId!, row.id, { ...params, caption: row.label });
        out.push({ id: row.id, label: row.label, qr });
      }
      return out;
    },
    enabled,
    staleTime: Infinity,
    gcTime: 10 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
  const codes = enabled ? (sheet.data ?? []) : [];
  const making = enabled && sheet.isFetching;
  const preview = codes.find((c) => c.id === previewId) ?? null;

  const failedAt = enabled && sheet.isError ? sheet.errorUpdatedAt : 0;
  useEffect(() => {
    if (failedAt) toast.error(t("qr.tables.failed", "Could not make the codes. Try again."));
  }, [failedAt, t]);

  const generateAll = () => {
    if (!branchId || rows.length === 0) return;
    if (requestedFor === branchId) void sheet.refetch();
    else setRequestedFor(branchId);
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
              <Button onClick={generateAll} disabled={making && codes.length === 0}>
                {making ? <Spinner /> : <QrCode className="size-4" />}
                {/* `count` is i18next's plural selector, and that is the
                    point: Arabic has six plural forms and "3 أكواد" is not
                    "11 كوداً". The locale files carry the forms; this passes
                    the number and lets the language decide. */}
                {making
                  ? t("qr.tables.making", { count: rows.length })
                  : t("qr.tables.make", { count: rows.length })}
              </Button>
              {codes.length > 0 ? (
                <Button
                  variant="outline"
                  data-testid="qr-tables-print"
                  disabled={making}
                  onClick={() =>
                    void printCodes(
                      codes.map((c) => ({ src: c.qr.qr_data_url, label: c.label })),
                      shape,
                    )
                  }
                >
                  <Printer className="size-4" />
                  {t("qr.tables.print", "Print sheet")}
                </Button>
              ) : null}
            </div>

            {codes.length > 0 ? (
              <TableCodeSheet codes={codes} busy={making} onPreview={(c) => setPreviewId(c.id)} />
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
        onOpenChange={(o) => !o && setPreviewId(null)}
        busy={making}
        shape={shape}
        controls={
          <QrOutputControls
            noLogo={missingLogo({ output, data: preview?.qr, isPlaceholderData: sheet.isPlaceholderData })}
          />
        }
      />
    </Card>
  );
}

/**
 * The sheet on screen. Each code sits on white whatever the dashboard's theme
 * is (a code printed out of a dark theme does not scan); the table's label is
 * screen furniture under it. Printing goes through `printCodes`, which lays
 * the paper out on its own.
 */
function TableCodeSheet({
  codes,
  busy,
  onPreview,
}: {
  codes: TableCode[];
  busy: boolean;
  onPreview: (code: TableCode) => void;
}) {
  const { t } = useTranslation();
  return (
    // A fresh batch arrives card by card.
    <Stagger replayKey={codes} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" data-testid="qr-table-sheet">
      {codes.map((code) => (
        <button
          key={code.id}
          type="button"
          onClick={() => onPreview(code)}
          title={t("qr.tables.previewHint", "Open this table's code")}
          className="flex break-inside-avoid flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center transition-colors hover:bg-muted"
        >
          <span className={cn("block w-full rounded bg-white p-1 transition-opacity duration-fast", busy && "opacity-50")}>
            <img
              src={code.qr.qr_data_url}
              alt={t("qr.tables.imageAlt", "Code for table {{label}}", {
                label: code.label,
              })}
              className="aspect-square w-full object-contain"
            />
          </span>
          {/* The label, large: thirty identical squares are unsortable. It
              prints under a branded card; an unbranded sheet prints the codes
              alone (`printCodes`). */}
          <span className="text-lg font-semibold leading-none">{code.label}</span>
        </button>
      ))}
    </Stagger>
  );
}
