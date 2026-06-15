import { createFileRoute } from "@tanstack/react-router";
import { ChannelOverridesPage } from "@/features/delivery/channel-overrides-page";

export const Route = createFileRoute("/_app/delivery/channels")({
  component: ChannelOverridesPage,
});
