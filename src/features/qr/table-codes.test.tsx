/**
 * The table-codes sheet: one code per table, made together and printed
 * together, each one identifiable on screen; on paper the label goes with the
 * branded card, and an unbranded sheet prints the codes alone.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const useListTables = vi.fn();
const tableQr = vi.fn();

vi.mock("@/data/api/generated/api", () => ({
  useListTables: (id: string, opts?: unknown) => useListTables(id, opts),
  tableQr: (branch: string, table: string, params?: unknown) => tableQr(branch, table, params),
}));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "o-1" }));
vi.mock("@/hooks/use-plan", () => ({ useHasFeature: () => true }));
vi.mock("@/components/app/link", () => ({ Link: ({ children }: { children: ReactNode }) => <a>{children}</a> }));

// The real i18n instance, so these assertions read the strings a shop will
// actually see rather than the inline English defaults. Without it `t` comes
// from an uninitialised instance and hands back the key's default with its
// placeholders unsubstituted — which is also how a missing key would look, so
// the test would pass on a string that never interpolates.
await import("@/i18n");
const { TableCodes } = await import("./table-codes");
const { qrOutputKey, resetQrOutputMemory } = await import("./output");
const { safeStorage } = await import("@/lib/safe-storage");

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
  safeStorage.removeItem(qrOutputKey("o-1"));
  resetQrOutputMemory();
  useListTables.mockReturnValue({ data: TABLES, isPending: false });
  tableQr.mockReset();
  tableQr.mockImplementation((_b: string, t: string, p?: { unbranded?: boolean }) =>
    Promise.resolve({
      kind: "table_order",
      long_url: `https://rue.madar-pos.cloud/order/?table=${t}`,
      short_url: `https://s.madar/${t}`,
      short_code: t,
      qr_data_url: p?.unbranded ? `data:image/png;base64,PLAIN${t}` : `data:image/png;base64,CARD${t}`,
      centre_logo: !p?.unbranded,
    }),
  );
});

afterEach(() => {
  document.getElementById("qr-print-root")?.remove();
  document.documentElement.classList.remove("qr-printing");
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
    // Branded mode sends what it always did: the A6 card, at 600 DPI.
    expect(tableQr).toHaveBeenCalledWith("b-1", "t-1", { card: true, dpi: 600, caption: "1" });
    expect(tableQr).toHaveBeenCalledWith("b-1", "t-3", { card: true, dpi: 600, caption: "T12" });
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

describe("TableCodes and the output switches", () => {
  const unbranded = (centreLogo = true) =>
    safeStorage.setItem(qrOutputKey("o-1"), JSON.stringify({ unbranded: true, centreLogo, card: true, dpi: 300 }));

  it("asks for the unbranded code when the shop chose it", async () => {
    unbranded(false);
    wrap(<TableCodes branchId="b-1" />);
    await userEvent.click(screen.getByRole("button", { name: /Make 3 codes/ }));
    await waitFor(() => expect(tableQr).toHaveBeenCalledTimes(3));
    expect(tableQr).toHaveBeenCalledWith("b-1", "t-1", {
      unbranded: true,
      centre_logo: false,
      dpi: 300,
      caption: "1",
    });
  });

  it("prints a branded sheet with each table's label and a cut line", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    wrap(<TableCodes branchId="b-1" />);
    await userEvent.click(screen.getByRole("button", { name: /Make 3 codes/ }));
    await userEvent.click(await screen.findByRole("button", { name: /Print sheet/ }));
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));

    const root = document.getElementById("qr-print-root")!;
    expect(root.dataset.shape).toBe("card");
    expect(Array.from(root.querySelectorAll("figcaption")).map((c) => c.textContent)).toEqual(["1", "2", "T12"]);
    expect(root.querySelectorAll("[data-cut]")).toHaveLength(3);
    print.mockRestore();
  });

  it("prints an unbranded sheet as the codes alone: no label, no cut line, nothing else", async () => {
    unbranded();
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    wrap(<TableCodes branchId="b-1" />);
    await userEvent.click(screen.getByRole("button", { name: /Make 3 codes/ }));
    await userEvent.click(await screen.findByRole("button", { name: /Print sheet/ }));
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1));

    const root = document.getElementById("qr-print-root")!;
    expect(root.dataset.shape).toBe("plain");
    // Three cells, each holding exactly one image — the server's code.
    const cells = Array.from(root.children);
    expect(cells).toHaveLength(3);
    for (const cell of cells) {
      expect(cell.children).toHaveLength(1);
      expect(cell.firstElementChild!.tagName).toBe("IMG");
      expect(cell.textContent).toBe("");
      expect(cell.hasAttribute("data-cut")).toBe(false);
    }
    expect(Array.from(root.querySelectorAll("img")).map((i) => i.getAttribute("src"))).toEqual([
      "data:image/png;base64,PLAINt-1",
      "data:image/png;base64,PLAINt-2",
      "data:image/png;base64,PLAINt-3",
    ]);
    // While printing, everything else on the page is hidden from the printer.
    expect(document.documentElement.classList.contains("qr-printing")).toBe(true);
    act(() => void window.dispatchEvent(new Event("afterprint")));
    expect(document.getElementById("qr-print-root")).toBeNull();
    expect(document.documentElement.classList.contains("qr-printing")).toBe(false);
    print.mockRestore();
  });
});
