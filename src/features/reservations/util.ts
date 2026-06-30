import { queryClient } from "@/data/api/query";

/** Floor geometry (sections + tables) lives under `/floor/*` query keys. */
export const invalidateFloor = () =>
  queryClient.invalidateQueries({
    predicate: (q) =>
      typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/floor"),
  });

/** Bookings live under `/reservations` query keys. */
export const invalidateBookings = () =>
  queryClient.invalidateQueries({
    predicate: (q) =>
      typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/reservations"),
  });

/** Color tokens per live table status, reused by the editor + board. */
export const TABLE_STATUS_STYLE: Record<string, { fill: string; ring: string; label: string }> = {
  free: { fill: "var(--color-success)", ring: "var(--color-success)", label: "Free" },
  held: { fill: "var(--color-warning)", ring: "var(--color-warning)", label: "Held" },
  seated: { fill: "var(--color-primary)", ring: "var(--color-primary)", label: "Seated" },
  dirty: { fill: "var(--color-muted-foreground)", ring: "var(--color-muted-foreground)", label: "Dirty" },
};

/** Booking status → badge intent. */
export const BOOKING_STATUS_INTENT: Record<string, "success" | "warning" | "info" | "muted" | "destructive"> = {
  requested: "muted",
  confirmed: "info",
  notified: "warning",
  arrived: "warning",
  seated: "success",
  completed: "muted",
  no_show: "destructive",
  cancelled: "destructive",
};
