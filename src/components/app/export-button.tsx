import { useTranslation } from "react-i18next";
import { ChevronDown, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Props {
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

  if (!onExportCsv) {
    return (
      <Button variant="outline" size={size} loading={loading} disabled={disabled} className={cn(className)} onClick={() => void onExport()}>
        <Download className="size-4" />
        {label ?? t("common.export", "Export Excel")}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size} loading={loading} disabled={disabled} className={cn(className)}>
          <Download className="size-4" />
          {label ?? t("common.export", "Export")}
          <ChevronDown className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => void onExport()}>{t("common.exportExcel", "Export Excel")}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void onExportCsv()}>{t("common.exportCsv", "Export CSV")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
