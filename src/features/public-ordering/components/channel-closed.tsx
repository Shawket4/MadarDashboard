import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { Channel } from "../types";

/**
 * Apologetic state shown when a channel is reached but isn't open right now —
 * e.g. a direct link to a closed channel, or a channel that closed mid-order.
 */
export function ChannelClosed({
  channel,
  onChoose,
}: {
  channel: Channel;
  onChoose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/70 px-6 py-12 text-center">
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Clock className="size-6" />
      </span>
      <p className="font-serif text-lg leading-tight">
        {t("order.channel.closedTitle", "This isn't available right now")}
      </p>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
        {channel === "in_mall"
          ? t(
              "order.channel.closedBodyInMall",
              "Sorry — in-mall ordering is closed at the moment. Please try delivery, or check back a little later.",
            )
          : t(
              "order.channel.closedBodyOutside",
              "Sorry — delivery is closed at the moment. Please try in-mall ordering, or check back a little later.",
            )}
      </p>
      <Button variant="brand" className="mt-5" onClick={onChoose}>
        {t("order.channel.choose", "Choose another option")}
      </Button>
    </div>
  );
}
