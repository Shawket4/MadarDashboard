import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TillSpotView } from "./api";

let held: string[] = [];
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return { ...real, useCan: (cap: string) => held.includes(cap) };
});
const listSpy = vi.fn();
vi.mock("./api", async () => {
  const real = await vi.importActual<typeof import("./api")>("./api");
  return { ...real, useTillSpotViews: (...a: unknown[]) => listSpy(...a) };
});

await import("@/i18n");
const { SpotViewList, TillSpotViews } = await import("./till-spot-views");

const view = (over: Partial<TillSpotView> = {}): TillSpotView => ({
  id: "sv1",
  till_id: "t1",
  branch_id: "b1",
  viewed_by: "u1",
  viewed_by_name: "Mona Adel",
  printed: true,
  printed_at: "2026-09-13T10:01:00Z",
  approved_by: "u2",
  approved_by_name: "Karim Saleh",
  approval_id: "a1",
  device_id: null,
  viewed_at: "2026-09-13T10:00:00Z",
  created_at: "2026-09-13T10:00:00Z",
  ...over,
});

beforeEach(() => {
  held = [];
  listSpy.mockReset();
});

describe("till spot views", () => {
  it("renders a row per view with viewer, unlocked-by and printed badge, and the count", () => {
    render(
      <SpotViewList
        views={[
          view(),
          view({ id: "sv2", viewed_by_name: "Omar Nabil", printed: false, printed_at: null, approved_by: null, approved_by_name: null, approval_id: null }),
        ]}
      />,
    );
    const rows = screen.getAllByTestId("spot-view-row");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("Mona Adel")).toBeInTheDocument();
    expect(within(rows[0]).getByTestId("spot-view-unlocked")).toHaveTextContent(/Karim Saleh/);
    expect(within(rows[0]).getByTestId("spot-view-printed")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Omar Nabil")).toBeInTheDocument();
    expect(within(rows[1]).queryByTestId("spot-view-unlocked")).toBeNull();
    expect(within(rows[1]).queryByTestId("spot-view-printed")).toBeNull();
    expect(within(screen.getByTestId("till-spot-views")).getByRole("heading")).toHaveTextContent("2");
  });

  it("shows an empty state", () => {
    render(<SpotViewList views={[]} />);
    expect(screen.getByTestId("spot-views-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("spot-view-row")).toBeNull();
  });

  it("is hidden without the till read capability", () => {
    listSpy.mockReturnValue({ isLoading: false, isError: false, data: [view()] });
    const { container, rerender } = render(<TillSpotViews tillId="t1" enabled />);
    expect(container).toBeEmptyDOMElement();
    expect(listSpy).not.toHaveBeenCalled();
    held = ["till.read"];
    rerender(<TillSpotViews tillId="t1" enabled />);
    expect(screen.getAllByTestId("spot-view-row")).toHaveLength(1);
  });
});
