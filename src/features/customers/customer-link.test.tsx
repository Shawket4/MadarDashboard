/**
 * A customer's name is a link only when there is a customer to open AND the
 * viewer may see customers; otherwise it is the text it always was. The
 * "ordered by X for Y" note names who the driver calls.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { ContactOverrideNote, CustomerLink } = await import("./customer-link");

describe("CustomerLink", () => {
  it("opens the customer for someone who may see customers, without triggering the row under it", async () => {
    const open = vi.fn();
    const rowClick = vi.fn();
    render(
      <div onClick={rowClick}>
        <CustomerLink name="Sara" customerId="c-1" control={{ canOpen: true, open }} />
      </div>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Sara" }));
    expect(open).toHaveBeenCalledWith("c-1");
    expect(rowClick).not.toHaveBeenCalled();
  });

  it("is plain text without customers.view", () => {
    render(<CustomerLink name="Sara" customerId="c-1" control={{ canOpen: false, open: vi.fn() }} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Sara")).toBeInTheDocument();
  });

  it("is plain text when the row has no customer (a walk-in, an old order)", () => {
    render(<CustomerLink name="Sara" customerId={null} control={{ canOpen: true, open: vi.fn() }} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("ContactOverrideNote", () => {
  it("ordered by the customer, for the snapshot name and number", () => {
    render(<ContactOverrideNote customerName="Sara" snapshotName="Omar" snapshotPhone="201000000002" />);
    const note = screen.getByRole("note");
    expect(note).toHaveTextContent("Ordered by Sara for Omar · +20 100 000 0002");
  });

  it("without the customer's name (no customers.view) it still says the order is for someone else", () => {
    render(<ContactOverrideNote snapshotName="Omar" snapshotPhone="201000000002" />);
    expect(screen.getByRole("note")).toHaveTextContent("Ordered for someone else: Omar");
  });
});
