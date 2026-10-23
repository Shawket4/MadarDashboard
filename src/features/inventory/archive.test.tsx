/**
 * Archiving an ingredient (2026-10-18): the confirmation lists what still uses
 * it and the stock it holds, archives with `confirm: true`, and pickers stop
 * offering it while a saved line keeps its name.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it, vi } from "vitest";

const archiveCatalogItem = vi.fn().mockResolvedValue({});
const unarchiveCatalogItem = vi.fn().mockResolvedValue({});
const invalidateInventory = vi.fn().mockResolvedValue(undefined);
let usage: unknown = null;

vi.mock("@/data/api/generated/api", () => ({
  useGetCatalogItemUsage: () => ({ data: usage, isLoading: false, error: null, refetch: vi.fn() }),
  useListCatalog: () => ({ data: [] }),
  archiveCatalogItem: (...a: unknown[]) => archiveCatalogItem(...a),
  unarchiveCatalogItem: (...a: unknown[]) => unarchiveCatalogItem(...a),
}));
vi.mock("./lib", async () => ({
  ...(await vi.importActual<typeof import("./lib")>("./lib")),
  invalidateInventory: () => invalidateInventory(),
}));

const i18n = (await import("@/i18n")).default;
const { ArchiveIngredientDialog, archivedNameHolder, isPickable, pickableOrChosen, unarchiveIngredient } = await import("./archive");

const beans = { id: "beans", name: "Beans", unit: "g" };

describe("ArchiveIngredientDialog", () => {
  it("lists the usages and the stock, then archives with confirm", async () => {
    await i18n.changeLanguage("en");
    usage = {
      ingredient_id: "beans", name: "Beans", unit: "g", archived_at: null,
      usages: [
        { kind: "recipe", id: "m1", name: "Espresso", detail: "Large" },
        { kind: "swap", id: "o1", name: "Oat swap", detail: "Milk" },
      ],
      stock: [{ branch_id: "b1", branch_name: "Zamalek", on_hand: 1200 }],
      needs_confirmation: true,
      never_used: false,
    };
    const onOpenChange = vi.fn();
    render(<ArchiveIngredientDialog orgId="org-1" item={beans} open onOpenChange={onOpenChange} />);

    expect(screen.getByText("Archive Beans?")).toBeInTheDocument();
    expect(screen.getByText("Still used in")).toBeInTheDocument();
    expect(screen.getByText("Espresso")).toBeInTheDocument();
    expect(screen.getByText("Menu recipes · 1")).toBeInTheDocument();
    expect(screen.getByText("Swaps · 1")).toBeInTheDocument();
    expect(screen.getByText("Zamalek")).toBeInTheDocument();
    expect(screen.getByText(/1,200/)).toBeInTheDocument();
    expect(screen.getByText(/Archiving doesn't change stock/)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("archive-confirm"));
    await waitFor(() => expect(archiveCatalogItem).toHaveBeenCalledWith("org-1", "beans", { confirm: true }));
    expect(invalidateInventory).toHaveBeenCalled();
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("says when nothing uses it", async () => {
    await i18n.changeLanguage("en");
    usage = { ingredient_id: "x", name: "X", unit: "g", archived_at: null, usages: [], stock: [], needs_confirmation: false, never_used: true };
    render(<ArchiveIngredientDialog orgId="org-1" item={{ id: "x", name: "X", unit: "g" }} open onOpenChange={vi.fn()} />);
    expect(screen.getByText("Nothing uses it and no branch holds any.")).toBeInTheDocument();
    expect(screen.queryByTestId("archive-usages")).toBeNull();
  });

  it("reads in Arabic", async () => {
    await i18n.changeLanguage("ar");
    usage = { ingredient_id: "beans", name: "Beans", unit: "g", archived_at: null, usages: [], stock: [{ branch_id: "b1", branch_name: "الزمالك", on_hand: 5 }], needs_confirmation: true, never_used: false };
    render(<ArchiveIngredientDialog orgId="org-1" item={beans} open onOpenChange={vi.fn()} />);
    expect(screen.getByText("أرشفة Beans؟")).toBeInTheDocument();
    expect(screen.getByText("المخزون المتوفر")).toBeInTheDocument();
    await i18n.changeLanguage("en");
  });
});

describe("pickers and helpers", () => {
  const rows = [
    { id: "a", is_active: true, archived_at: null },
    { id: "b", is_active: true, archived_at: "2026-10-18T09:00:00Z" },
    { id: "c", is_active: false, archived_at: null },
  ];

  it("offers only active, unarchived ingredients, keeping a chosen one", () => {
    expect(rows.filter(isPickable).map((r) => r.id)).toEqual(["a"]);
    expect(pickableOrChosen(rows, ["b"]).map((r) => r.id)).toEqual(["a", "b"]);
    expect(pickableOrChosen(rows).map((r) => r.id)).toEqual(["a"]);
  });

  it("finds the archived holder of a name in a 409", () => {
    const err = new AxiosError("409", "ERR", undefined, undefined, {
      status: 409, statusText: "Conflict", headers: {}, config: { headers: new AxiosHeaders() },
      data: { code: "INGREDIENT_NAME_ARCHIVED", vars: { ingredient_id: "old", name: "Syrup" } },
    });
    expect(archivedNameHolder(err)).toBe("old");
    expect(archivedNameHolder(new Error("x"))).toBeNull();
  });

  it("unarchives and refreshes", async () => {
    await i18n.changeLanguage("en");
    const ok = await unarchiveIngredient("org-1", { id: "old", name: "Syrup" }, i18n.t.bind(i18n) as never);
    expect(ok).toBe(true);
    expect(unarchiveCatalogItem).toHaveBeenCalledWith("org-1", "old");
  });
});
