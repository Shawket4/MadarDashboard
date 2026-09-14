import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

const fetchJob = vi.fn();
vi.mock("@/data/api/custom-instance", () => ({ customInstance: () => fetchJob() }));

await import("@/i18n");
const { ImageUploader } = await import("./image-uploader");

describe("ImageUploader", () => {
  it("shows processing until the job is done, then the tile", async () => {
    let finish: (v: unknown) => void = () => {};
    fetchJob.mockReturnValue(new Promise((r) => (finish = r)));
    const onUpload = vi.fn().mockResolvedValue({ status: "processing", asset_job_id: "j" });
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <ImageUploader value={null} onUpload={onUpload} />
      </QueryClientProvider>,
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, new File(["x"], "a.png", { type: "image/png" }));
    expect(await screen.findByRole("status")).toBeInTheDocument();
    const tile = { url: "https://a/tile.webp", width: 512, height: 512, bytes: 1, content_hash: "h" };
    finish({ id: "j", status: "done", result: { group_id: "g", variants: { tile } }, error: null });
    await vi.waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://a/tile.webp");
  });
});
