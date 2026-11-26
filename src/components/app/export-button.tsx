import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type ExportFormat, useExportFormat } from "@/lib/export-format";
import { useShake } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** One more file the button offers, under the page's own export and CSV. */
export interface ExportOption {
  key: string;
  label: string;
  /** Reject after toasting, as `onExport`: the button shakes. */
  onSelect: () => void | Promise<void>;
}

interface Props {
  /**
   * The export. It is made in the format chosen here (Excel or PDF):
   * `exportToExcel` reads the choice. Reject after toasting the error to
   * mark a failed export: the button shakes.
   */
  onExport: () => void | Promise<void>;
  /** A CSV as well: its own item, whatever the format. */
  onExportCsv?: () => void | Promise<void>;
  /** The menu's name for `onExport` when it offers several files. */
  excelLabel?: string;
  /** Other files, in their own section of the menu. */
  more?: ExportOption[];
  /** That section's heading. */
  moreHeading?: string;
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  size?: "default" | "sm";
  className?: string;
}

/**
 * The shared Export button of every list and report: Excel or PDF of the same
 * sheets (the PDF in the dashboard's typeface, embedded).
 *
 * - One file: the menu is the choice, "Export as Excel / PDF" (as Apex's
 *   export menu), and picking one exports at once.
 * - Several files (a CSV, or `more`): the format sits at the top, remembered
 *   on this device for every export, and the files under it.
 */
export function ExportButton({
  onExport,
  onExportCsv,
  excelLabel,
  more,
  moreHeading,
  label,
  loading,
  disabled,
  size = "default",
  className,
}: Props) {
  const { t } = useTranslation();
  const [format, setFormat] = useExportFormat();
  // A failed export reads at the control as well as in the toast.
  const ref = useRef<HTMLButtonElement>(null);
  const [failures, setFailures] = useState(0);
  useShake(ref, failures);
  const run = (fn: () => void | Promise<void>) => {
    void Promise.resolve()
      .then(fn)
      .catch(() => setFailures((n) => n + 1));
  };

  const trigger = (
    <DropdownMenuTrigger asChild>
      <Button ref={ref} variant="outline" size={size} loading={loading} disabled={disabled} className={cn(className)}>
        <Download className="size-4" />
        {label ?? t("common.exportMenu", "Export")}
        <ChevronDown className="size-3.5" />
      </Button>
    </DropdownMenuTrigger>
  );
  const formats: { value: ExportFormat; label: string; icon: typeof FileText }[] = [
    { value: "xlsx", label: t("common.exportFormat.excel", "Excel"), icon: FileSpreadsheet },
    { value: "pdf", label: t("common.exportFormat.pdf", "PDF"), icon: FileText },
  ];

  if (!onExportCsv && !more?.length) {
    return (
      <DropdownMenu>
        {trigger}
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("common.exportFormat.as", "Export as")}</DropdownMenuLabel>
          {formats.map(({ value, label: text, icon: Icon }) => (
            <DropdownMenuItem
              key={value}
              onSelect={() => {
                setFormat(value);
                run(onExport);
              }}
            >
              <Icon className="size-4" />
              {text}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      {trigger}
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("common.exportFormat.label", "Format")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
          {formats.map(({ value, label: text }) => (
            // Choosing a format keeps the menu open: the file is picked next.
            <DropdownMenuRadioItem key={value} value={value} onSelect={(e) => e.preventDefault()}>
              {text}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => run(onExport)}>
          {format === "pdf" ? <FileText className="size-4" /> : <FileSpreadsheet className="size-4" />}
          {excelLabel ?? t("common.exportFile", "Export")}
        </DropdownMenuItem>
        {onExportCsv ? (
          <DropdownMenuItem onSelect={() => run(onExportCsv)}>
            <FileText className="size-4" />
            {t("common.exportCsv", "Export CSV")}
          </DropdownMenuItem>
        ) : null}
        {more?.length ? (
          <>
            <DropdownMenuSeparator />
            {moreHeading ? <DropdownMenuLabel>{moreHeading}</DropdownMenuLabel> : null}
            {more.map((o) => (
              <DropdownMenuItem key={o.key} onSelect={() => run(o.onSelect)}>
                {o.label}
              </DropdownMenuItem>
            ))}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
