import { createFileRoute } from "@tanstack/react-router";
import { DevicesPage, validateDevicesSearch } from "@/features/devices/devices-page";

/** ?view=clients shows client versions; ?days / ?all tune that view. */
export const Route = createFileRoute("/_app/devices")({
  validateSearch: validateDevicesSearch,
  component: DevicesPage,
});
