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

describe("TillsTable server paging", () => {
  it("shows the server's page count and asks for the next page instead of slicing rows", async () => {
    const onPage = vi.fn();
    // One server page of 2 rows out of 3 pages: the table must not page them itself.
    render(
      <TillsTable
        tills={[till({ id: "a" }), till({ id: "b" })]}
        onOpenReport={() => {}}
        paging={{ pageIndex: 0, pageCount: 3, onPageIndexChange: onPage }}
      />,
    );
    expect(screen.getByText(/1.*3/, { selector: "p" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Next|التالي/ }));
    expect(onPage).toHaveBeenCalledWith(1);
  });

  it("renders every row it is given on the current server page", () => {
    const rows = Array.from({ length: 20 }, (_, i) => till({ id: `t${i}` }));
    render(<TillsTable tills={rows} onOpenReport={() => {}} paging={{ pageIndex: 4, pageCount: 9, onPageIndexChange: () => {} }} />);
    expect(screen.getAllByText("Mona Adel").length).toBeGreaterThanOrEqual(20);
    expect(screen.getByText(/5.*9/, { selector: "p" })).toBeInTheDocument();
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
      page: undefined,
    });
    expect(validateTillsSearch({ status: "nope" }).status).toBeUndefined();
  });

  it("reads the server page from the URL; page 1 and junk are no page", () => {
    expect(validateTillsSearch({ page: "3" }).page).toBe(3);
    expect(validateTillsSearch({ page: 2 }).page).toBe(2);
    for (const page of ["1", "0", "-2", "x", "1.5", undefined]) expect(validateTillsSearch({ page }).page).toBeUndefined();
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
