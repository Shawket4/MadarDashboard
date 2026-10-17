import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useShake } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface Props {
  /** Reject after toasting the error to mark a failed export: the button shakes. */
  onExport: () => void | Promise<void>;
  /** When given, the button becomes a dropdown offering Excel + CSV. */
  onExportCsv?: () => void | Promise<void>;
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  size?: "default" | "sm";
  className?: string;
}

/** Shared "Export Excel" button used across every list/report screen. */
export function ExportButton({ onExport, onExportCsv, label, loading, disabled, size = "default", className }: Props) {
  const { t } = useTranslation();
  // A failed export reads at the control as well as in the toast.
  const ref = useRef<HTMLButtonElement>(null);
  const [failures, setFailures] = useState(0);
  useShake(ref, failures);
  const run = (fn: () => void | Promise<void>) => {
    void Promise.resolve()
      .then(fn)
      .catch(() => setFailures((n) => n + 1));
  };

  if (!onExportCsv) {
    return (
      <Button ref={ref} variant="outline" size={size} loading={loading} disabled={disabled} className={cn(className)} onClick={() => run(onExport)}>
        <Download className="size-4" />
        {label ?? t("common.export", "Export Excel")}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button ref={ref} variant="outline" size={size} loading={loading} disabled={disabled} className={cn(className)}>
          <Download className="size-4" />
          {label ?? t("common.export", "Export")}
          <ChevronDown className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => run(onExport)}>{t("common.exportExcel", "Export Excel")}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run(onExportCsv)}>{t("common.exportCsv", "Export CSV")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
