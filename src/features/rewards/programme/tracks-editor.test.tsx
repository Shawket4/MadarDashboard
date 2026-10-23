/**
 * The stamp tracks editor: the crate's checks block a bad save and say why,
 * track 1's size is the programme's (read-only here), a good save sends the
 * whole list, a points programme has one track, and without
 * `loyalty.card.design` it is read-only.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TracksView } from "@/data/api/generated/models";

vi.mock("@/components/app/confirm-dialog", () => ({ useConfirm: () => vi.fn().mockResolvedValue(true) }));
vi.mock("@/hooks/use-org-id", () => ({ useOrgId: () => "o-1" }));

let held: string[] = ["loyalty.read", "loyalty.card.design"];
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return { ...real, useAuthz: () => real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held as never, ask_manager: [], limits: {} }) };
});

let view: TracksView;
const mutateAsync = vi.fn().mockResolvedValue({});
vi.mock("@/data/api/generated/api", () => ({
  useGetLoyaltyTracks: () => ({ data: view, isLoading: false, isError: false }),
  usePutLoyaltyTracks: () => ({ mutateAsync, isPending: false }),
  useListMenuItems: () => ({ data: [{ id: "i-1", name: "Croissant", is_active: true, deleted_at: null }] }),
}));

const i18n = (await import("@/i18n")).default;
const { TracksEditor } = await import("./tracks-editor");

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TracksEditor />
    </QueryClientProvider>,
  );

beforeEach(async () => {
  held = ["loyalty.read", "loyalty.card.design"];
  mutateAsync.mockClear();
  view = {
    mode: "visits",
    stamp_unit: "order",
  track_one_size: 8,
    tracks: [
      { position: 1, name_en: "Coffee", name_ar: "", size: null, items: [], per_item: true, cap: null, shape: null, colour: null },
      { position: 2, name_en: "Croissants", name_ar: "", size: 5, items: ["i-1"], per_item: true, cap: null, shape: "star", colour: "#AA3300" },
    ],
  };
  await i18n.changeLanguage("en");
});

const sizeOf = (n: number) => screen.getAllByLabelText("Stamps per card")[n];

describe("TracksEditor", () => {
  it("shows track 1's size as the programme's, read-only", () => {
    mount();
    // Only track 2 has a size field; track 1's is the programme's, shown as text.
    expect(screen.getAllByLabelText("Stamps per card")).toHaveLength(1);
    expect(screen.getByText("Set under Programme").parentElement).toHaveTextContent("8");
    expect(sizeOf(0)).toHaveValue(5);
    expect(screen.getByText("Croissant")).toBeInTheDocument();
  });

  it("refuses a size the crate refuses, and says why", async () => {
    mount();
    fireEvent.change(sizeOf(0), { target: { value: "60" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("A card fills with 1 to 50 stamps.")).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("a new track needs a name; a good save sends the whole list", async () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Add a track" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Give the track a name, in English or Arabic.")).toBeInTheDocument();
    fireEvent.change(screen.getAllByLabelText("Name")[2], { target: { value: "Juice" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce());
    const sent = mutateAsync.mock.calls[0][0].data.tracks;
    expect(sent).toHaveLength(3);
    expect(sent[0]).toMatchObject({ position: 1, size: null, items: [], cap: null });
    expect(sent[1]).toMatchObject({ position: 2, size: 5, items: ["i-1"], shape: "star" });
    expect(sent[2]).toMatchObject({ position: 3, name_en: "Juice", size: 8, items: [] });
  });

  it("a points programme has one track and no add", () => {
    view = { ...view, mode: "points" };
    mount();
    expect(screen.getAllByTestId("track-card")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Add a track" })).not.toBeInTheDocument();
    expect(screen.getByText(/so the card has one track/)).toBeInTheDocument();
  });

  it("is read-only without loyalty.card.design", () => {
    held = ["loyalty.read"];
    mount();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    expect(sizeOf(0)).toBeDisabled();
  });

  it("renders in Arabic", async () => {
    await i18n.changeLanguage("ar");
    mount();
    expect(screen.getByText("المسار 1: بطاقة البرنامج")).toBeInTheDocument();
  });
});
