import { act, fireEvent, render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryHistory, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { Tabs } from "@/components/ui/tabs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { SegmentedControl } from "@/components/app/segmented-control";
import { NavPrefetchProvider, type WarmRoute } from "@/lib/prefetch/nav-context";
import { HOVER_DELAY_MS, resetIntent } from "@/lib/prefetch/intent";
import { Link } from "./link";

async function renderIn(ui: () => React.ReactNode, warm: WarmRoute) {
  const root = createRootRoute({ component: () => <NavPrefetchProvider warm={warm}>{ui()}</NavPrefetchProvider> });
  const page = createRoute({ getParentRoute: () => root, path: "/" });
  const other = createRoute({ getParentRoute: () => root, path: "/orders" });
  const router = createRouter({ routeTree: root.addChildren([page, other]), history: createMemoryHistory({ initialEntries: ["/"] }) });
  await act(async () => {
    render(<RouterProvider router={router} />);
    await router.load();
  });
}

beforeEach(() => resetIntent());

describe("intent adoption", () => {
  it("<Link> warms its own destination on pointerdown, and leaves the code preload to the router", async () => {
    const warm = vi.fn();
    const keep = (p: Record<string, unknown>) => p;
    await renderIn(() => <Link to="/orders" search={keep as never}>Orders</Link>, warm);
    fireEvent.pointerDown(screen.getByText("Orders"), { pointerType: "touch" });
    expect(warm).toHaveBeenCalledTimes(1);
    expect(warm.mock.calls[0][0]).toMatchObject({ to: "/orders", search: keep });
    expect(warm.mock.calls[0][1]).toEqual({ code: false });
  });

  it("<Link preload={false}> warms nothing", async () => {
    const warm = vi.fn();
    await renderIn(() => <Link to="/orders" preload={false}>Orders</Link>, warm);
    fireEvent.pointerDown(screen.getByText("Orders"), { pointerType: "touch" });
    expect(warm).not.toHaveBeenCalled();
  });

  it("a URL tab bar warms the tab's view (its search param on this page) after a hover pause", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const warm = vi.fn();
    await renderIn(
      () => (
        <Tabs value="a">
          <PageTabsList prefetch="tab">
            <PageTabsTrigger value="a">A</PageTabsTrigger>
            <PageTabsTrigger value="b">B</PageTabsTrigger>
          </PageTabsList>
        </Tabs>
      ),
      warm,
    );
    fireEvent.pointerEnter(screen.getByText("B"), { pointerType: "mouse" });
    expect(warm).not.toHaveBeenCalled();
    act(() => void vi.advanceTimersByTime(HOVER_DELAY_MS));
    expect(warm).toHaveBeenCalledTimes(1);
    const target = warm.mock.calls[0][0];
    expect(target.to).toBe(".");
    expect(target.stays).toBe(true);
    expect(target.search({ branchId: "b1", tab: "a" })).toEqual({ branchId: "b1", tab: "b" });
    vi.useRealTimers();
  });

  it("a segmented control warms the other segments, not the one showing", async () => {
    const warm = vi.fn();
    await renderIn(
      () => <SegmentedControl value="x" onChange={() => {}} options={[{ value: "x", label: "X" }, { value: "y", label: "Y" }]} prefetch="view" />,
      warm,
    );
    fireEvent.pointerDown(screen.getByText("X"), { pointerType: "touch" });
    expect(warm).not.toHaveBeenCalled();
    fireEvent.pointerDown(screen.getByText("Y"), { pointerType: "touch" });
    expect(warm.mock.calls[0][0].search({})).toEqual({ view: "y" });
  });
});
