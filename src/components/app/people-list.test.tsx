import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ColumnDef } from "@tanstack/react-table";
import { describe, expect, it, vi } from "vitest";

import { ListCount, PeopleList } from "./people-list";

interface Person { id: string; name: string }
const columns: ColumnDef<Person, unknown>[] = [{ accessorKey: "name", header: "Name", meta: { label: "Name" } }];
const data: Person[] = [{ id: "1", name: "Sara" }];

describe("PeopleList", () => {
  it("puts the search in the table's toolbar by default, and reports typing", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <PeopleList columns={columns} data={data} hideViewOptions search={{ value: "", onChange, placeholder: "Search people" }} />,
    );
    const table = container.querySelector('[data-slot="data-table"]') as HTMLElement;
    const box = within(table).getByRole("searchbox", { name: "Search people" });
    await userEvent.type(box, "s");
    expect(onChange).toHaveBeenCalledWith("s");
    expect(screen.getAllByText("Sara").length).toBeGreaterThan(0);
  });

  it("above: search and actions share a row over the table, the count sits under it", () => {
    const { container } = render(
      <PeopleList
        layout="above"
        columns={columns}
        data={data}
        search={{ value: "sa", onChange: () => {}, placeholder: "Search people" }}
        actions={<button type="button">Export</button>}
        footer={<ListCount>Showing 1 of 9</ListCount>}
      />,
    );
    const table = container.querySelector('[data-slot="data-table"]') as HTMLElement;
    expect(within(table).queryByRole("searchbox")).toBeNull();
    const box = screen.getByRole("searchbox", { name: "Search people" });
    expect(box).toHaveValue("sa");
    expect(box.closest("div.flex")).toContainElement(screen.getByRole("button", { name: "Export" }));
    expect(screen.getByText("Showing 1 of 9")).toBeInTheDocument();
  });
});
