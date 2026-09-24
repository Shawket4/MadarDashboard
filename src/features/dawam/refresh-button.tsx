/**
 * The Refresh button in every Dawam page header: fetches again what the page
 * shows (its mounted `/staff/...` queries, see `live.ts`) and spins while any
 * of them is fetching — a click, a focus refetch, or the Team board's poll.
 */
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DAWAM_KEY_PREFIX, dawamFilters } from "./live";

const DAWAM_ONLY = [DAWAM_KEY_PREFIX] as const;

export function DawamRefreshButton({
  prefixes = DAWAM_ONLY,
  className,
}: {
  /** Key prefixes the page reads. Default: Dawam's `/staff`; Set-up adds `/branches`. */
  prefixes?: readonly string[];
  className?: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const filters = dawamFilters(prefixes);
  const busy = useIsFetching(filters) > 0;
  const label = busy ? t("common.refreshing", "Refreshing…") : t("common.refresh", "Refresh");

  // `cancelRefetch: false`: a click while a fetch is already running joins it
  // rather than throwing it away and starting over.
  const refresh = () => void queryClient.refetchQueries(filters, { cancelRefetch: false });

  return (
    // Its own provider: a page rendered outside the app shell (a test, a story)
    // still gets the tooltip rather than a Radix "must be inside" error.
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={label}
            aria-busy={busy}
            data-busy={busy || undefined}
            onClick={refresh}
            className={className}
          >
            <RefreshCw
              aria-hidden
              className={cn("size-4", busy && "animate-spin motion-reduce:animate-none motion-reduce:opacity-50")}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
