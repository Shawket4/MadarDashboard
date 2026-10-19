import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import vectors from "@/lib/menu_import_vectors.json";

type Vars = {
  data: { menu: unknown; mode: string; confirm?: string };
  params?: { dry_run?: boolean };
};
type Opts = {
  mutation: { onSuccess: (a: unknown) => void; onError: (e: unknown) => void };
};

const bulk = vi.fn(async (_v: Vars): Promise<unknown> => ({}));
vi.mock("@/data/api/generated/api", () => ({
  useGetOrg: () => ({ data: { name: "Drops" } }),
  useBulkMenu: (o: Opts) => ({
    isPending: false,
    mutate: (v: Vars) =>
      void bulk(v).then(o.mutation.onSuccess, o.mutation.onError),
  }),
}));
vi.mock("@/features/menu/util", () => ({ invalidateCatalog: vi.fn() }));
let caps: string[] = [];
vi.mock("@/data/authz/use-authz", () => ({
  useAuthz: () => ({ can: (c: string) => caps.includes(c) }),
}));

const i18n = (await import("@/i18n")).default;
const { FoodicsImportDialog } = await import("./foodics-import-dialog");
const { FoodicsImportCard } = await import("./foodics-import-card");

const wrap = (node: ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      {node}
    </QueryClientProvider>,
  );
const answer = (dry: boolean, archived: unknown = null) => ({
  dry_run: dry,
  mode: archived ? "replace" : "add",
  summary: {
    categories: 2,
    items: 3,
    sizes: 0,
    groups: 2,
    options: 4,
    links: 4,
    optionals: 0,
  },
  archived,
  import_id: dry ? null : "imp-1",
});
const refusal = (status: number, data: unknown) =>
  new AxiosError(String(status), "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });
/** The by_name case's files: a café keyed by name, five exports. */
const files = () =>
  vectors.foodics
    .find((c) => c.name === "by_name")!
    .files.map(
      (text, i) => new File([text], `export-${i}.csv`, { type: "text/csv" }),
    );

const ADD = ["menu.categories.create", "menu.items.create", "menu.items.edit"];
const REPLACE = [...ADD, "menu.categories.delete", "menu.items.delete"];

beforeEach(async () => {
  await i18n.changeLanguage("en");
  bulk.mockReset().mockImplementation(async (v) => answer(!!v.params?.dry_run));
  caps = REPLACE;
});

describe("Import from Foodics", () => {
  it("reads the exports here, shows the menu and asks the server before importing", async () => {
    const user = userEvent.setup();
    const onImported = vi.fn();
    wrap(
      <FoodicsImportDialog
        orgId="o1"
        mode="add"
        canReplace
        open
        onOpenChange={vi.fn()}
        onImported={onImported}
      />,
    );
    await user.upload(
      screen.getByLabelText("Foodics export files (.csv)"),
      files(),
    );

    expect(await screen.findByText("Iced Latte")).toBeInTheDocument();
    expect(screen.getByText("Coffee")).toBeInTheDocument();
    expect(
      await screen.findByText(/it is ready to import/),
    ).toBeInTheDocument();
    // The dry run carried the menu the wasm built, nothing else.
    expect(bulk).toHaveBeenCalledTimes(1);
    const dry = bulk.mock.calls[0][0];
    expect(dry.params).toEqual({ dry_run: true });
    expect(dry.data.mode).toBe("add");
    expect((dry.data.menu as { items: unknown[] }).items).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "Import the menu" }));
    await waitFor(() => expect(onImported).toHaveBeenCalled());
    expect(bulk.mock.calls[1][0].params).toBeUndefined();
  });

  it("names a file that is not a menu export, and sends nothing", async () => {
    const user = userEvent.setup();
    wrap(
      <FoodicsImportDialog
        orgId="o1"
        mode="add"
        canReplace
        open
        onOpenChange={vi.fn()}
        onImported={vi.fn()}
      />,
    );
    await user.upload(
      screen.getByLabelText("Foodics export files (.csv)"),
      new File(["name,price\nx,1\n"], "people.csv", { type: "text/csv" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "people.csv is not a Foodics menu export.",
    );
    expect(bulk).not.toHaveBeenCalled();
  });

  it("replaces only after the sentence is typed, and sends it", async () => {
    const user = userEvent.setup();
    bulk.mockImplementation(async (v) =>
      answer(!!v.params?.dry_run, { categories: 4, items: 20, groups: 3 }),
    );
    wrap(
      <FoodicsImportDialog
        orgId="o1"
        mode="replace"
        canReplace
        open
        onOpenChange={vi.fn()}
        onImported={vi.fn()}
      />,
    );
    await user.upload(
      screen.getByLabelText("Foodics export files (.csv)"),
      files(),
    );

    expect(await screen.findByTestId("replace-sentence")).toHaveTextContent(
      "Replace the menu of Drops",
    );
    expect(screen.getByText(/categories 4, items 20/)).toBeInTheDocument();
    const run = screen.getByRole("button", { name: "Replace the menu" });
    expect(run).toBeDisabled();
    const box = screen.getByRole("textbox");
    await user.type(box, "Replace the menu of Drop");
    expect(run).toBeDisabled();
    await user.type(box, "s");
    await waitFor(() => expect(run).toBeEnabled());
    await user.click(run);
    await waitFor(() => expect(bulk).toHaveBeenCalledTimes(2));
    expect(bulk.mock.calls[1][0].data).toMatchObject({
      mode: "replace",
      confirm: "Replace the menu of Drops",
    });
  });

  it("shows the Arabic sentence to an Arabic reader", async () => {
    await i18n.changeLanguage("ar");
    const user = userEvent.setup();
    wrap(
      <FoodicsImportDialog
        orgId="o1"
        mode="replace"
        canReplace
        open
        onOpenChange={vi.fn()}
        onImported={vi.fn()}
      />,
    );
    await user.upload(
      screen.getByLabelText("ملفات تصدير Foodics بصيغة CSV"),
      files(),
    );
    expect(await screen.findByTestId("replace-sentence")).toHaveTextContent(
      "استبدل قائمة Drops",
    );
  });

  it("offers to replace when the server finds the menu is not empty", async () => {
    const user = userEvent.setup();
    bulk.mockImplementation(async (v) => {
      if (v.data.mode === "add")
        throw refusal(409, {
          error: "x",
          code: "MENU_NOT_EMPTY",
          vars: { categories: 1, items: 0, groups: 0 },
        });
      return answer(!!v.params?.dry_run, {
        categories: 1,
        items: 0,
        groups: 0,
      });
    });
    wrap(
      <FoodicsImportDialog
        orgId="o1"
        mode="add"
        canReplace
        open
        onOpenChange={vi.fn()}
        onImported={vi.fn()}
      />,
    );
    await user.upload(
      screen.getByLabelText("Foodics export files (.csv)"),
      files(),
    );
    expect(
      await screen.findByText(
        "The menu already has categories or items. Replace it instead.",
      ),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Replace the menu instead" }),
    );
    expect(await screen.findByTestId("replace-sentence")).toBeInTheDocument();
  });

  it("words a refusal from the shared checks in the reader's language", async () => {
    const user = userEvent.setup();
    bulk.mockRejectedValue(
      refusal(422, {
        error: "x",
        code: "BULK_MENU_INVALID",
        vars: { refusal: "no_active_size", item: "Latte" },
      }),
    );
    wrap(
      <FoodicsImportDialog
        orgId="o1"
        mode="add"
        canReplace
        open
        onOpenChange={vi.fn()}
        onImported={vi.fn()}
      />,
    );
    await user.upload(
      screen.getByLabelText("Foodics export files (.csv)"),
      files(),
    );
    expect(
      await screen.findByText(
        "“Latte” has sizes, but none of them is on sale.",
      ),
    ).toBeInTheDocument();
  });
});

describe("The onboarding card", () => {
  it("offers an import into an empty menu, a replace otherwise, to who holds them", () => {
    const { rerender } = wrap(
      <FoodicsImportCard
        orgId="o1"
        live={{ categories: 0, items: 0 }}
        refresh={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Import from Foodics" }),
    ).toBeInTheDocument();
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <FoodicsImportCard
          orgId="o1"
          live={{ categories: 2, items: 9 }}
          refresh={vi.fn()}
        />
      </QueryClientProvider>,
    );
    expect(
      screen.getByRole("button", { name: "Replace from Foodics" }),
    ).toBeInTheDocument();
  });

  it("is not offered to someone the server would refuse", () => {
    caps = ADD;
    wrap(
      <FoodicsImportCard
        orgId="o1"
        live={{ categories: 2, items: 9 }}
        refresh={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Replace from Foodics" }),
    ).toBeNull();
    caps = [];
    wrap(
      <FoodicsImportCard
        orgId="o1"
        live={{ categories: 0, items: 0 }}
        refresh={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Import from Foodics" }),
    ).toBeNull();
  });
});
