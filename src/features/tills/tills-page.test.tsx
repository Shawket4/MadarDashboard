import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { till } from "./fixtures.test-util";

await import("@/i18n");
const { TillsTable, TillFilters, OpenBillsLine, validateTillsSearch } = await import("./tills-page");

describe("TillsTable", () => {
  it("shows the flag badge and links to the other till", async () => {
    const onOpen = vi.fn();
    render(
      <TillsTable
        tills={[till({ id: "t2", opened_while_another_open: true, other_till_id: "t1" })]}
        onOpenReport={onOpen}
      />,
    );
    const flag = screen.getByTestId("flag-badge");
    await userEvent.click(within(flag).getByRole("button"));
    expect(onOpen).toHaveBeenCalledWith("t1");
  });

  it("badges unverified tills and reconciliation disagreements, not verified clean ones", () => {
    render(
      <TillsTable
        tills={[
          till({ id: "a", verification: "unverified", reconciliation_status: "disagreed", disagreement_count: 2 }),
          till({ id: "b" }),
        ]}
        onOpenReport={() => {}}
      />,
    );
    expect(screen.getAllByTestId("verification-badge")).toHaveLength(1);
    expect(screen.getByTestId("disagreement-badge")).toHaveTextContent(/2/);
    expect(screen.queryAllByTestId("flag-badge")).toHaveLength(0);
    expect(screen.getAllByText("36B").length).toBeGreaterThan(0);
  });
});

describe("TillFilters", () => {
  it("toggles the flagged filter", async () => {
    const onChange = vi.fn();
    render(<TillFilters search={{}} tellers={[]} devices={[]} onChange={onChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: /Flagged only|المعلّمة فقط/ }));
    expect(onChange).toHaveBeenCalledWith({ flagged: true });
  });

  it("reads filters from the URL", () => {
    expect(validateTillsSearch({ flagged: "true", status: "open", teller: "u1", bogus: 1 })).toEqual({
      report: undefined,
      status: "open",
      teller: "u1",
      device: undefined,
      flagged: true,
      today: undefined,
    });
    expect(validateTillsSearch({ status: "nope" }).status).toBeUndefined();
  });
});

describe("OpenBillsLine", () => {
  const notice = { open_bills_count: 4, open_bills_amount: 125_00, old_bills_count: 0, old_bill_hours: 3, seated_tables_count: 1, since: "2026-09-13T08:00:00Z" };

  it("counts bills left open and flags only old ones", () => {
    const { rerender } = render(<OpenBillsLine notice={notice} />);
    expect(screen.getByTestId("open-bills-notice")).toHaveTextContent(/4/);
    expect(screen.queryByTestId("old-bills")).toBeNull();
    rerender(<OpenBillsLine notice={{ ...notice, old_bills_count: 2 }} />);
    expect(screen.getByTestId("old-bills")).toHaveTextContent(/2.*3/);
  });
});
