import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { till } from "./fixtures.test-util";

await import("@/i18n");
const { TillsTable, TillFilters, validateTillsSearch } = await import("./tills-page");

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
