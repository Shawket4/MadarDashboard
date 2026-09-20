/**
 * The item dialog must show a picture from either source (asset `image`
 * or legacy `image_url`), remove must still clear the legacy field only
 * (which clears the asset too, server-side), and an upload's `{status:
 * "processing", asset_job_id}` response must be handed straight to the
 * uploader so it polls the job and, once done, refetches the item.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/recipes/recipe-builder", () => ({ RecipeBuilder: () => null }));
vi.mock("@/features/recipes/util", () => ({ invalidateRecipes: vi.fn() }));
vi.mock("./category-dialog", () => ({ CategoryDialog: () => null }));

const invalidateCatalog = vi.fn();
vi.mock("./util", () => ({
  ONE_SIZE: "one_size",
  arOf: () => "",
  invalidateCatalog: () => invalidateCatalog(),
}));

const updateMenuItem = vi.fn().mockResolvedValue({});
const uploadMenuItemImage = vi.fn();
vi.mock("@/data/api/generated/api", () => ({
  useGetOrg: () => ({ data: undefined }),
  createMenuItem: vi.fn(),
  putModifierGroups: vi.fn(),
  putSizeRecipe: vi.fn(),
  putSizes: vi.fn(),
  updateMenuItem: (...args: unknown[]) => updateMenuItem(...args),
  uploadMenuItemImage: (...args: unknown[]) => uploadMenuItemImage(...args),
  useGetMenuItem: () => ({ data: undefined }),
  useListAddonItems: () => ({ data: [] }),
  useListCatalog: () => ({ data: [] }),
  useListGroups: () => ({ data: [] }),
}));

// ImageUploader's own job poll goes through the raw axios instance.
const fetchJob = vi.fn();
vi.mock("@/data/api/custom-instance", () => ({ customInstance: () => fetchJob() }));

await import("@/i18n");
const { MenuItemDialog } = await import("./menu-item-dialog");

function wrap(item: Parameters<typeof MenuItemDialog>[0]["item"]) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MenuItemDialog orgId="org-1" categories={[]} item={item} open onOpenChange={() => {}} />
    </QueryClientProvider>,
  );
}

const baseItem = {
  id: "m-1",
  name: "Latte",
  name_translations: null,
  description: null,
  description_translations: null,
  base_price: 1000,
  category_id: null,
  is_active: true,
};

describe("MenuItemDialog image", () => {
  it("shows an asset-pipeline image (image set, image_url null)", () => {
    wrap({ ...baseItem, image_url: null, image: { group_id: "g", variants: { thumb: null, tile: { url: "https://a/tile.webp", width: 512, height: 512, bytes: 1, content_hash: "h" }, full: null, original: null } } } as never);
    expect(document.querySelector("img")).toHaveAttribute("src", "https://a/tile.webp");
  });

  it("still shows a legacy-only image", () => {
    wrap({ ...baseItem, image_url: "https://old/legacy.jpg", image: null } as never);
    expect(document.querySelector("img")).toHaveAttribute("src", "https://old/legacy.jpg");
  });

  it("remove sends image_url: null, clearing the asset too", async () => {
    wrap({ ...baseItem, image_url: "https://old/legacy.jpg", image: null } as never);
    const img = document.querySelector("img") as HTMLImageElement;
    await userEvent.hover(img);
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(updateMenuItem).toHaveBeenCalledWith("m-1", { image_url: null }));
    expect(invalidateCatalog).toHaveBeenCalled();
  });

  it("an upload polls the asset job, then refetches once it is done", async () => {
    let finishJob: (v: unknown) => void = () => {};
    fetchJob.mockReturnValue(new Promise((r) => (finishJob = r)));
    uploadMenuItemImage.mockResolvedValue({ status: "processing", asset_job_id: "job-1", image_url: null });

    wrap({ ...baseItem, image_url: null, image: null } as never);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, new File(["x"], "a.png", { type: "image/png" }));

    // Uploaded, but the invalidation from the upload response alone must not
    // be mistaken for "done" — the job is still processing.
    await waitFor(() => expect(uploadMenuItemImage).toHaveBeenCalled());
    expect(screen.getByRole("status")).toBeInTheDocument();
    invalidateCatalog.mockClear();

    const tile = { url: "https://a/tile.webp", width: 512, height: 512, bytes: 1, content_hash: "h" };
    finishJob({ id: "job-1", status: "done", result: { group_id: "g", variants: { tile } }, error: null });

    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(invalidateCatalog).toHaveBeenCalled();
  });
});
