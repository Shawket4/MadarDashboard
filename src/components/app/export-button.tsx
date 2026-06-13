import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  onExport: () => void | Promise<void>;
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  size?: "default" | "sm";
  className?: string;
}

/** Shared "Export Excel" button used across every list/report screen. */
export function ExportButton({ onExport, label, loading, disabled, size = "default", className }: Props) {
  const { t } = useTranslation();
  return (
    <Button variant="outline" size={size} loading={loading} disabled={disabled} className={cn(className)} onClick={() => void onExport()}>
      <Download className="size-4" />
      {label ?? t("common.export", "Export Excel")}
    </Button>
  );
}
