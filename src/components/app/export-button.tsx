import { useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Download, FileSpreadsheet, FileText, Sheet as CsvIcon } from "lucide-react";

import { SegmentedControl } from "@/components/app/segmented-control";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type ExportFormat, type ExportPick, useExportFormat } from "@/lib/export-format";
import { useShake } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * One sheet of a file, named for the panel. A sheet of tables (the recipe
 * book's) has no CSV: `{ label, csv: false }`.
 */
export type ExportSheet = string | { label: string; csv: false };

/** One file the Export panel offers. */
export interface ExportFile {
  key: string;
  label: string;
  /**
   * Makes the file: `exportFile(config, pick)`, which reads the format chosen
   * here and makes a PDF or CSV of `pick.sheet`. Reject after toasting the
   * error to mark a failed export: the button shakes.
   */
  onExport: (pick: ExportPick) => void | Promise<void>;
  /**
   * The workbook's sheets, in the workbook's order. A PDF or a CSV is one
   * sheet: with two or more to choose from, the panel asks which.
   */
  sheets?: ExportSheet[];
}

interface Props {
  /** The page's own file. See `ExportFile`. */
  onExport: ExportFile["onExport"];
  sheets?: ExportSheet[];
  /** The page's file's name, when the panel offers several (`more`). */
  fileLabel?: string;
  /** Other files, offered after the page's own. */
  more?: ExportFile[];
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  size?: "default" | "sm";
  className?: string;
}

const FORMATS: ExportFormat[] = ["xlsx", "pdf", "csv"];

/** Every format's icon and name. */
const useFormats = () => {
  const { t } = useTranslation();
  return {
    xlsx: { icon: FileSpreadsheet, label: t("common.exportFormat.excel", "Excel") },
    pdf: { icon: FileText, label: t("common.exportFormat.pdf", "PDF") },
    csv: { icon: CsvIcon, label: t("common.exportFormat.csv", "CSV") },
  } as const;
};

/**
 * Excel, PDF or CSV: the export's format, as a row of even pills, remembered
 * on this device. Shared by the Export panel and the orders export.
 */
export function ExportFormatPicker() {
  const { t } = useTranslation();
  const formats = useFormats();
  const [format, setFormat] = useExportFormat();
  return (
    <SegmentedControl<ExportFormat>
      fill
      aria-label={t("common.exportFormat.label", "Format")}
      value={format}
      onChange={setFormat}
      options={FORMATS.map((v) => {
        const { icon: Icon, label } = formats[v];
        return { value: v, label: <><Icon aria-hidden />{label}</> };
      })}
    />
  );
}

/** The sheets a format can be, by their index in the workbook. */
export const sheetChoices = (sheets: ExportSheet[] | undefined, format: ExportFormat): { index: number; label: string }[] =>
  format === "xlsx"
    ? []
    : (sheets ?? []).flatMap((s, index) =>
        typeof s === "string" ? [{ index, label: s }] : format === "csv" && s.csv === false ? [] : [{ index, label: s.label }],
      );

/**
 * The sheet picker of a PDF or CSV: shown when there is a choice, and the
 * pick to pass `exportFile` (the one sheet when only one fits the format).
 */
export function useSheetPick(sheets: ExportSheet[] | undefined, format: ExportFormat) {
  const [chosen, setChosen] = useState(0);
  const choices = sheetChoices(sheets, format);
  const at = choices.find((c) => c.index === chosen) ?? choices[0];
  const pick: ExportPick = (sheets?.length ?? 0) > 1 && at ? { sheet: at.index } : {};
  return { choices, at, pick, choose: setChosen, asks: choices.length > 1 };
}

/** The Sheet pills of a PDF or CSV. */
export function SheetPicker({ choices, at, onChange }: { choices: { index: number; label: string }[]; at: number; onChange: (index: number) => void }) {
  const { t } = useTranslation();
  return (
    <SegmentedControl<string>
      fill
      aria-label={t("common.exportFormat.sheet", "Sheet")}
      value={String(at)}
      onChange={(v) => onChange(Number(v))}
      options={choices.map((c) => ({ value: String(c.index), label: c.label }))}
    />
  );
}

/** A labelled part of the panel. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

/**
 * The shared Export button of every list and report. It opens a small panel
 * (as Apex's trip report): the format at the top (Excel, PDF or CSV,
 * remembered on this device for every export); the file, when the page offers
 * several; the sheet, when a PDF or CSV is asked of a workbook with several
 * (each is one sheet); then Download.
 */
export function ExportButton({ onExport, sheets, fileLabel, more, label, loading, disabled, size = "default", className }: Props) {
  const { t } = useTranslation();
  const formats = useFormats();
  const [open, setOpen] = useState(false);
  const [format] = useExportFormat();
  const [fileKey, setFileKey] = useState<string>("page");

  // A failed export reads at the control as well as in the toast.
  const ref = useRef<HTMLButtonElement>(null);
  const [failures, setFailures] = useState(0);
  useShake(ref, failures);

  const files: ExportFile[] = [
    { key: "page", label: fileLabel ?? t("common.exportMenu", "Export"), onExport, sheets },
    ...(more ?? []),
  ];
  const file = files.find((f) => f.key === fileKey) ?? files[0];
  const sheet = useSheetPick(file.sheets, format);

  const download = () => {
    setOpen(false);
    void Promise.resolve()
      .then(() => file.onExport(sheet.pick))
      .catch(() => setFailures((n) => n + 1));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button ref={ref} variant="outline" size={size} loading={loading} disabled={disabled} className={cn(className)}>
          <Download className="size-4" />
          {label ?? t("common.exportMenu", "Export")}
          <ChevronDown className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        // Clear of the screen's edge on a phone.
        collisionPadding={12}
        className="w-[min(20rem,calc(100vw-2rem))] space-y-4"
        aria-label={label ?? t("common.exportMenu", "Export")}
      >
        <Field label={t("common.exportFormat.label", "Format")}>
          <ExportFormatPicker />
        </Field>

        {files.length > 1 ? (
          <Field label={t("common.exportFormat.file", "File")}>
            <div role="radiogroup" aria-label={t("common.exportFormat.file", "File")} className="space-y-0.5 rounded-lg border p-1">
              {files.map((f) => {
                const on = f.key === file.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setFileKey(f.key)}
                    className={cn(
                      "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-start text-sm transition-colors duration-base focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      on ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{f.label}</span>
                    {on ? <Check className="size-4 shrink-0" aria-hidden /> : null}
                  </button>
                );
              })}
            </div>
          </Field>
        ) : null}

        {sheet.asks && sheet.at ? (
          <Field label={t("common.exportFormat.sheet", "Sheet")}>
            <SheetPicker choices={sheet.choices} at={sheet.at.index} onChange={sheet.choose} />
          </Field>
        ) : null}

        <Button className="w-full" onClick={download}>
          <Download className="size-4" />
          {t("common.exportFormat.download", { format: formats[format].label, defaultValue: "Download {{format}}" })}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
