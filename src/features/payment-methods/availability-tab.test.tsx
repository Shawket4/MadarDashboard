/**
 * SET-PAY-039 (W5): the tellers and devices reads said "No tellers at this
 * branch" / "No devices at this branch yet" while loading and after a failed
 * read. Each section now shows a skeleton, then the failure with Retry.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type Q = { data?: unknown; isLoading: boolean; isFetching: boolean; error: unknown; refetch: ReturnType<typeof vi.fn> };
const q = (over: Partial<Q>): Q => ({ data: undefined, isLoading: false, isFetching: false, error: null, refetch: vi.fn(), ...over });
let users: Q;
let devices: Q;

vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "org-1" }));
vi.mock("@/data/scope/use-scope", () => ({ useScope: () => ({ branchId: "b1" }) }));
vi.mock("@/data/api/generated/api", () => ({
  useListPaymentMethods: () => q({ data: [{ id: "cash", code: "cash", label: "Cash", is_active: true }] }),
  useListUsers: () => users,
}));
vi.mock("@/features/devices/api", async () => ({
  ...(await vi.importActual<typeof import("@/features/devices/api")>("@/features/devices/api")),
  useAvailability: () => q({ data: { branch_id: "b1", branch: { restricted: false, payment_method_ids: [] }, users: [], devices: [] } }),
  useDevices: () => devices,
  usePutAvailability: () => ({ mutate: vi.fn(), isPending: false }),
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { AvailabilityTab } = await import("./availability-tab");

beforeEach(() => {
  users = q({ data: [] });
  devices = q({ data: [] });
});

const section = (title: string) => screen.getByRole("heading", { name: title }).closest("section")!;

describe("AvailabilityTab people reads (W5, SET-PAY-039)", () => {
  it("never says nobody is here while the reads load", () => {
    users = q({ isLoading: true });
    devices = q({ isLoading: true });
    const { container } = render(<AvailabilityTab />);
    expect(screen.queryByText("No tellers at this branch")).not.toBeInTheDocument();
    expect(screen.queryByText("No devices at this branch yet")).not.toBeInTheDocument();
    expect(container.querySelectorAll('section [data-slot="skeleton"]')).toHaveLength(2);
  });

  it("shows each failed read with its reason and a Retry of that read only", () => {
    users = q({ error: new Error("Forbidden") });
    devices = q({ error: new Error("Server down") });
    render(<AvailabilityTab />);
    expect(screen.queryByText("No tellers at this branch")).not.toBeInTheDocument();
    expect(screen.queryByText("No devices at this branch yet")).not.toBeInTheDocument();
    const tellers = section("Tellers");
    expect(within(tellers).getByRole("alert")).toHaveTextContent("Couldn't load this");
    expect(within(tellers).getByRole("alert")).toHaveTextContent("Forbidden");
    fireEvent.click(within(tellers).getByRole("button", { name: /Retry/ }));
    expect(users.refetch).toHaveBeenCalledOnce();
    expect(devices.refetch).not.toHaveBeenCalled();
    expect(within(section("Devices")).getByRole("alert")).toHaveTextContent("Server down");
  });

  it("says nobody is here only once the reads answered empty", () => {
    render(<AvailabilityTab />);
    expect(screen.getByText("No tellers at this branch")).toBeInTheDocument();
    expect(screen.getByText("No devices at this branch yet")).toBeInTheDocument();
  });
});
