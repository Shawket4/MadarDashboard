import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TillSpotCheck } from "./api";

let held: string[] = [];
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return {
    ...real,
    useCan: (cap: string) => held.includes(cap),
  };
});
const listSpy = vi.fn();
vi.mock("./api", async () => {
  const real = await vi.importActual<typeof import("./api")>("./api");
  return { ...real, useTillSpotChecks: (...a: unknown[]) => listSpy(...a) };
});

await import("@/i18n");
const { SpotCheckList, TillSpotChecks, differenceTone } = await import("./till-spot-checks");

const check = (over: Partial<TillSpotCheck> = {}): TillSpotCheck => ({
  id: "sc1",
  till_id: "t1",
  branch_id: "b1",
  counted_cash: 90_000,
  expected_cash: 100_000,
  cash_discrepancy: -10_000,
  methods: [
    { method: "cash", is_cash: true, expected: 100_000, counted: 90_000, discrepancy: -10_000 },
    { method: "card", is_cash: false, expected: 50_000, counted: null, discrepancy: null },
  ],
  note: "Missing a note",
  checked_by: "u1",
  checked_by_name: "Mona Adel",
  approved_by: "u2",
  approved_by_name: "Karim Saleh",
  approval_id: "a1",
  device_id: null,
  checked_at: "2026-09-13T10:00:00Z",
  created_at: "2026-09-13T10:00:00Z",
  ...over,
});

beforeEach(() => {
  held = [];
  listSpy.mockReset();
});

describe("till spot checks", () => {
  it("classifies the difference", () => {
    expect(differenceTone(0)).toBe("even");
    expect(differenceTone(500)).toBe("over");
    expect(differenceTone(-500)).toBe("short");
  });

  it("renders a row per check with tone, people, note and methods", async () => {
    render(
      <SpotCheckList
        checks={[
          check(),
          check({ id: "sc2", cash_discrepancy: 2_000, counted_cash: 102_000, approved_by_name: null, note: null, methods: [] }),
          check({ id: "sc3", cash_discrepancy: 0, counted_cash: 100_000, approved_by_name: null, note: null, methods: [] }),
        ]}
      />,
    );
    const rows = screen.getAllByTestId("spot-check-row");
    expect(rows).toHaveLength(3);
    const short = within(rows[0]).getAllByText(/Short|عجز/)[0].closest("[data-tone]");
    expect(short).toHaveAttribute("data-tone", "short");
    expect(within(rows[0]).getByText(/Mona Adel/)).toHaveTextContent(/Karim Saleh/);
    expect(within(rows[0]).getByText("Missing a note")).toBeInTheDocument();
    expect(within(rows[1]).getByText(/Over|زيادة/).closest("[data-tone]")).toHaveAttribute("data-tone", "over");
    expect(within(rows[1]).queryByText(/Karim Saleh/)).toBeNull();
    expect(within(rows[2]).getByText(/Even|مطابق/).closest("[data-tone]")).toHaveAttribute("data-tone", "even");

    await userEvent.click(within(rows[0]).getByRole("button"));
    const methods = within(rows[0]).getAllByTestId("spot-check-method");
    expect(methods).toHaveLength(2);
    expect(methods[1]).toHaveTextContent(/Not counted|لم يُعد/);
  });

  it("shows an empty state", () => {
    render(<SpotCheckList checks={[]} />);
    expect(screen.getByTestId("spot-checks-empty")).toBeInTheDocument();
  });

  it("is hidden without the till read capability", () => {
    listSpy.mockReturnValue({ isLoading: false, isError: false, data: [check()] });
    const { container, rerender } = render(<TillSpotChecks tillId="t1" enabled />);
    expect(container).toBeEmptyDOMElement();
    expect(listSpy).not.toHaveBeenCalled();
    held = ["till.read"];
    rerender(<TillSpotChecks tillId="t1" enabled />);
    expect(screen.getAllByTestId("spot-check-row")).toHaveLength(1);
  });
});
