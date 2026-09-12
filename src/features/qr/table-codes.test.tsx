/**
 * The table-codes sheet: one code per table, made together and printed
 * together, each one identifiable once it is off the printer.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useListTables = vi.fn();
const tableQr = vi.fn();

vi.mock("@/data/api/generated/api", () => ({
  useListTables: (id: string, opts?: unknown) => useListTables(id, opts),
  tableQr: (branch: string, table: string, params?: unknown) => tableQr(branch, table, params),
}));

// The real i18n instance, so these assertions read the strings a shop will
// actually see rather than the inline English defaults. Without it `t` comes
// from an uninitialised instance and hands back the key's default with its
// placeholders unsubstituted — which is also how a missing key would look, so
// the test would pass on a string that never interpolates.
await import("@/i18n");
const { TableCodes } = await import("./table-codes");

function wrap(node: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}

const TABLES = [
  { id: "t-1", label: "1" },
  { id: "t-2", label: "2" },
  { id: "t-3", label: "T12" },
];

beforeEach(() => {
  useListTables.mockReturnValue({ data: TABLES, isPending: false });
  tableQr.mockImplementation((_b: string, t: string) =>
    Promise.resolve({
      kind: "table_order",
      long_url: `https://rue.madar-pos.cloud/order/?table=${t}`,
      short_url: `https://s.madar/${t}`,
      short_code: t,
      qr_data_url: "data:image/png;base64,AAA",
    }),
  );
});

describe("TableCodes", () => {
  it("asks for a branch before it can show any tables", () => {
    wrap(<TableCodes branchId={null} />);
    expect(screen.getByText(/Choose a branch/)).toBeInTheDocument();
  });

  it("says how many codes it is about to make", () => {
    wrap(<TableCodes branchId="b-1" />);
    expect(screen.getByRole("button", { name: /Make 3 codes/ })).toBeInTheDocument();
  });

  it("makes one code per table and labels each with its own table", async () => {
    wrap(<TableCodes branchId="b-1" />);
    await userEvent.click(screen.getByRole("button", { name: /Make 3 codes/ }));

    await waitFor(() => expect(tableQr).toHaveBeenCalledTimes(3));
    // The label is what makes a sheet of identical squares sortable.
    for (const label of ["1", "2", "T12"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    // Every code names its own table, never the branch's generic menu.
    expect(tableQr).toHaveBeenCalledWith("b-1", "t-1", { caption: "1" });
    expect(tableQr).toHaveBeenCalledWith("b-1", "t-3", { caption: "T12" });
  });

  it("offers the print sheet only once there is something to print", async () => {
    wrap(<TableCodes branchId="b-1" />);
    expect(screen.queryByRole("button", { name: /Print sheet/ })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /Make 3 codes/ }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Print sheet/ })).toBeInTheDocument(),
    );
  });

  it("a branch with no tables says where to add them", () => {
    useListTables.mockReturnValue({ data: [], isPending: false });
    wrap(<TableCodes branchId="b-1" />);
    expect(screen.getByText(/no tables yet/)).toBeInTheDocument();
  });

  it("drops one branch's codes when the scope moves to another", async () => {
    const { rerender } = wrap(<TableCodes branchId="b-1" />);
    await userEvent.click(screen.getByRole("button", { name: /Make 3 codes/ }));
    await waitFor(() => expect(screen.getByText("T12")).toBeInTheDocument());

    // Another branch's room is not this one's, and a sheet left on screen
    // would be printed and stuck to the wrong tables.
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    rerender(
      <QueryClientProvider client={qc}>
        <TableCodes branchId="b-2" />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.queryByText("T12")).toBeNull());
  });
});
