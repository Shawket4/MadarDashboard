import { businessDate } from "@/lib/format";

import type { PresetId } from "./types";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function buildFilename(args: {
  presetId: PresetId;
  branchSlug: string;
  from: string | null;
  to: string | null;
}): string {
  // The period's ends are instants (the scope's day bounds): their days are the
  // shop's (the active zone), not UTC's, which is still the day before from
  // midnight to 03:00 in Cairo.
  const dateRange =
    args.from && args.to ? `${businessDate(args.from)}_to_${businessDate(args.to)}` : businessDate();
  return `${slugify(args.presetId)}-${args.branchSlug}-${dateRange}`;
}
