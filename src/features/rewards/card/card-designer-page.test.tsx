/**
 * The card designer: template pick, keyboard move/resize on the grid, the
 * crate's problems shown, colours locked without custom branding, publish
 * behind a confirm, and the capability gates (read, design).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CardDesign, CardDesignView } from "@/data/api/generated/models";
import { cardRulesNow } from "@/lib/rules/card";

const put = vi.fn().mockResolvedValue({});
const publish = vi.fn().mockResolvedValue({});
const unpublish = vi.fn().mockResolvedValue({});
const confirm = vi.fn().mockResolvedValue(true);
let held: string[] = ["loyalty.read", "loyalty.card.design"];
let view: CardDesignView;

vi.mock("@/components/app/confirm-dialog", () => ({ useConfirm: () => confirm }));
vi.mock("@/components/app/link", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));
vi.mock("@/data/authz/use-authz", async () => {
  const real = await vi.importActual<typeof import("@/data/authz/use-authz")>("@/data/authz/use-authz");
  return {
    ...real,
    useAuthz: () =>
      real.authzFrom({ user_id: "u", epoch: 0, spec_version: 0, owner: false, platform: false, role_kinds: [], capabilities: held as never, ask_manager: [], limits: {} }),
  };
});
vi.mock("@/data/api/generated/api", () => ({
  getGetLoyaltyCardDesignQueryKey: () => ["/loyalty/card-design"],
  useGetLoyaltyCardDesign: () => ({ data: view, isLoading: false, isError: false, refetch: vi.fn() }),
  usePutLoyaltyCardDesign: () => ({ mutateAsync: put, isPending: false }),
  usePublishLoyaltyCardDesign: () => ({ mutateAsync: publish, isPending: false }),
  useUnpublishLoyaltyCardDesign: () => ({ mutateAsync: unpublish, isPending: false }),
  previewLoyaltyCardDesign: () => new Promise(() => {}),
}));

const i18n = (await import("@/i18n")).default;
const { CardDesignerPage } = await import("./card-designer-page");

const w = cardRulesNow()!;
const colours = { background: "#1F2A44", foreground: "#FFFFFF", label: "#C9D1E0" };
const ctx = { mode: "visits" as const, tracks: [{ position: 1, size: 8 }], has_photo: false };
const makeView = (over: Partial<CardDesignView> = {}): CardDesignView => {
  const d = w.card_default(colours, ctx, []) as CardDesign;
  return {
    colours,
    ctx,
    custom_branding: true,
    stamp_unit: "order",
    default_design: d,
    draft: null,
    published: null,
    published_at: null,
    revision: 0,
    tracks: [{ position: 1, name_en: "Coffee", name_ar: "قهوة" }],
    programme_name: "Bean Club",
    programme_name_ar: null,
    photo_url: null,
    logo_url: null,
    ...over,
  };
};

const mount = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CardDesignerPage />
    </QueryClientProvider>,
  );
const boxes = () => screen.getAllByTestId("grid-element");

beforeEach(async () => {
  held = ["loyalty.read", "loyalty.card.design"];
  view = makeView();
  put.mockClear();
  publish.mockClear();
  confirm.mockClear();
  await i18n.changeLanguage("en");
});

describe("CardDesignerPage", () => {
  it("renders the designer in English", () => {
    mount();
    expect(screen.getByRole("heading", { name: "Card design" })).toBeInTheDocument();
    expect(screen.getByTestId("apple-mock")).toHaveAttribute("dir", "ltr");
    expect(screen.getByRole("button", { name: /Classic/ })).toHaveAttribute("aria-pressed", "true");
    expect(boxes()).toHaveLength(1);
  });

  it("renders in Arabic, the card mirrored", async () => {
    await i18n.changeLanguage("ar");
    mount();
    expect(screen.getByRole("heading", { name: "تصميم البطاقة" })).toBeInTheDocument();
    expect(screen.getByTestId("apple-mock")).toHaveAttribute("dir", "rtl");
  });

  it("a template replaces the design", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: /^Bold$/ }));
    expect(screen.getByRole("button", { name: /^Bold$/ })).toHaveAttribute("aria-pressed", "true");
    expect(boxes()).toHaveLength(2);
    expect(boxes()[0]).toHaveAccessibleName(/^Count/);
  });

  it("arrows move the selected box and Shift + arrows resize it", () => {
    mount();
    const bar = boxes()[0];
    expect(bar).toHaveAccessibleName(/column 1, row 5, 12 by 1/);
    act(() => bar.focus());
    fireEvent.keyDown(bar, { key: "ArrowUp" });
    expect(boxes()[0]).toHaveAccessibleName(/column 1, row 4, 12 by 1/);
    fireEvent.keyDown(boxes()[0], { key: "ArrowLeft", shiftKey: true });
    expect(boxes()[0]).toHaveAccessibleName(/column 1, row 4, 11 by 1/);
    fireEvent.keyDown(boxes()[0], { key: "ArrowRight" });
    expect(boxes()[0]).toHaveAccessibleName(/column 2, row 4, 11 by 1/);
  });

  it("shows the crate's problems as they happen", () => {
    mount();
    fireEvent.keyDown(boxes()[0], { key: "ArrowDown" });
    const list = screen.getByTestId("problems");
    expect(within(list).getByText(/covers the “rewards by madar” footer/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
  });

  it("locks the colours without custom branding and says where the brand is set", () => {
    view = makeView({ custom_branding: false });
    mount();
    expect(screen.getByTestId("colours-locked")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings › Brand" })).toHaveAttribute("href", "/settings/brand");
    expect(screen.getByLabelText("Background", { selector: "input[type=color]" })).toBeDisabled();
  });

  it("publishes after the confirm, saving the draft first", async () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    await waitFor(() => expect(publish).toHaveBeenCalledOnce());
    expect(confirm.mock.calls[0][0].description).toMatch(/updates within minutes/);
    expect(put).toHaveBeenCalledWith({ data: { design: view.default_design } });
  });

  it("is read-only without loyalty.card.design", () => {
    held = ["loyalty.read"];
    mount();
    expect(screen.getByTestId("read-only")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save draft" })).not.toBeInTheDocument();
    expect(boxes()[0]).toHaveAttribute("tabindex", "-1");
  });

  it("is restricted without loyalty.read", () => {
    held = ["loyalty.members.list"];
    mount();
    expect(screen.getByText(/can't open the card design/)).toBeInTheDocument();
  });
});
