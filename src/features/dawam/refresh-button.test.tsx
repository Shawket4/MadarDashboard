/**
 * The Refresh button in a Dawam page header: it fetches again what the page
 * shows — its mounted `/staff/...` queries, nothing another page left in the
 * cache, nothing outside Dawam — and spins while any of them is fetching.
 */
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const i18n = (await import("@/i18n")).default;
const { DawamRefreshButton } = await import("./refresh-button");

type Fn = () => Promise<unknown>;

function Page({ fns, prefixes }: { fns: Record<string, Fn>; prefixes?: string[] }) {
  useQuery({ queryKey: ["/staff/team/presence", { branch_id: "b1" }], queryFn: fns.presence });
  useQuery({ queryKey: ["/staff/flags", { branch_id: "b1" }], queryFn: fns.flags });
  useQuery({ queryKey: ["/staff/roster"], queryFn: fns.off, enabled: false });
  useQuery({ queryKey: ["/staff-pool/today"], queryFn: fns.pool });
  useQuery({ queryKey: ["/branches", { org_id: "o" }], queryFn: fns.branches });
  useQuery({ queryKey: ["/orders"], queryFn: fns.orders });
  return <DawamRefreshButton prefixes={prefixes} />;
}

const counting = () => ({
  presence: vi.fn<Fn>(async () => ({ present: 3 })),
  flags: vi.fn<Fn>(async () => []),
  off: vi.fn<Fn>(async () => ({})),
  pool: vi.fn<Fn>(async () => ({})),
  branches: vi.fn<Fn>(async () => []),
  orders: vi.fn<Fn>(async () => []),
  elsewhere: vi.fn<Fn>(async () => ({})),
});

async function setup(prefixes?: string[]) {
  const fns = counting();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30_000 } } });
  // What another Dawam page left in the cache: not on screen, so not refetched.
  await client.prefetchQuery({ queryKey: ["/staff/payroll/current"], queryFn: fns.elsewhere });
  render(
    <QueryClientProvider client={client}>
      <Page fns={fns} prefixes={prefixes} />
    </QueryClientProvider>,
  );
  const button = screen.getByRole("button"); // the only one: named "Refresh" in English, "تحديث" in Arabic
  // The first load spins it too; wait until the page is idle.
  await waitFor(() => expect(button).toHaveAttribute("aria-busy", "false"));
  return { fns, button };
}

beforeEach(async () => {
  await i18n.changeLanguage("en");
});
afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("DawamRefreshButton", () => {
  it("refetches the page's Dawam queries and nothing else", async () => {
    const { fns, button } = await setup();
    for (const f of [fns.presence, fns.flags, fns.pool, fns.branches, fns.orders, fns.elsewhere]) {
      expect(f).toHaveBeenCalledTimes(1);
    }

    await userEvent.click(button);

    await waitFor(() => {
      expect(fns.presence).toHaveBeenCalledTimes(2);
      expect(fns.flags).toHaveBeenCalledTimes(2);
    });
    expect(fns.off).not.toHaveBeenCalled(); // disabled stays disabled
    expect(fns.pool).toHaveBeenCalledTimes(1); // /staff-pool is the POS, not Dawam
    expect(fns.branches).toHaveBeenCalledTimes(1);
    expect(fns.orders).toHaveBeenCalledTimes(1);
    expect(fns.elsewhere).toHaveBeenCalledTimes(1); // another page's, not on screen
  });

  it("spins, and says so, while any of them is fetching", async () => {
    const { fns, button } = await setup();
    const icon = button.querySelector("svg")!;
    expect(button).toHaveAccessibleName("Refresh");
    expect(icon).not.toHaveClass("animate-spin");

    let finish!: () => void;
    fns.flags.mockImplementationOnce(() => new Promise((resolve) => (finish = () => resolve([]))));
    await userEvent.click(button);

    await waitFor(() => expect(button).toHaveAttribute("aria-busy", "true"));
    expect(button).toHaveAccessibleName("Refreshing…");
    expect(icon).toHaveClass("animate-spin");
    // presence came back already; the page is still fetching flags.
    await waitFor(() => expect(fns.presence).toHaveBeenCalledTimes(2));
    expect(icon).toHaveClass("animate-spin");

    finish();
    await waitFor(() => expect(button).toHaveAttribute("aria-busy", "false"));
    expect(icon).not.toHaveClass("animate-spin");
    expect(button).toHaveAccessibleName("Refresh");
  });

  it("a second click while fetching joins the running fetch", async () => {
    const { fns, button } = await setup();
    let finish!: () => void;
    fns.presence.mockImplementationOnce(() => new Promise((resolve) => (finish = () => resolve({ present: 4 }))));
    await userEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute("aria-busy", "true"));
    await userEvent.click(button);
    finish();
    await waitFor(() => expect(button).toHaveAttribute("aria-busy", "false"));
    expect(fns.presence).toHaveBeenCalledTimes(2);
  });

  it("takes extra prefixes (Set-up also reads the branches)", async () => {
    const { fns, button } = await setup(["/staff", "/branches"]);
    await userEvent.click(button);
    await waitFor(() => expect(fns.branches).toHaveBeenCalledTimes(2));
    expect(fns.presence).toHaveBeenCalledTimes(2);
    expect(fns.orders).toHaveBeenCalledTimes(1);
  });

  it("is labelled in Arabic", async () => {
    await i18n.changeLanguage("ar");
    const { button } = await setup();
    expect(button).toHaveAccessibleName("تحديث");
  });
});
