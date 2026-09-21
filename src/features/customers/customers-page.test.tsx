/**
 * The page around the list: the add button only for creators, the restricted
 * page without customers.view, and a customer just added opens in the sheet.
 * (The list itself: `customers-list.test.tsx`.)
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

let held: string[] = ["customers.view"];

vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return { ...real, useAuthz: () => real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held, ask_manager: [], limits: {} }) };
});
vi.mock("./customers-list", () => ({
  CustomersList: ({ membersOnly, openId }: { membersOnly?: boolean; openId: string | null }) => (
    <div data-testid="people-list" data-members-only={String(!!membersOnly)} data-open={openId ?? ""} />
  ),
}));
vi.mock("./customer-dialog", () => ({
  CustomerDialog: ({ open, onSaved }: { open: boolean; onSaved: (d: { customer: { id: string } }) => void }) =>
    open ? <button onClick={() => onSaved({ customer: { id: "c-9" } })}>save</button> : null,
}));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { CustomersPage } = await import("./customers-page");

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CustomersPage />
    </QueryClientProvider>,
  );

describe("CustomersPage", () => {
  it("draws the list over everybody, without Add for someone who may not create", () => {
    held = ["customers.view"];
    renderPage();
    expect(screen.getByTestId("people-list")).toHaveAttribute("data-members-only", "false");
    expect(screen.queryByRole("button", { name: /Add customer/ })).not.toBeInTheDocument();
  });

  it("offers Add customer with customers.create, and opens whoever was added", async () => {
    held = ["customers.view", "customers.create"];
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: /Add customer/ }));
    await userEvent.click(screen.getByRole("button", { name: "save" }));
    expect(screen.getByTestId("people-list")).toHaveAttribute("data-open", "c-9");
  });

  it("shows the restricted page without customers.view", () => {
    held = ["loyalty.members.list"];
    renderPage();
    expect(screen.queryByTestId("people-list")).not.toBeInTheDocument();
    expect(screen.getByText(/Only people who can see customers/)).toBeInTheDocument();
  });
});
