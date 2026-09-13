import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

const fetchJob = vi.fn();
vi.mock("@/data/api/custom-instance", () => ({ customInstance: () => fetchJob() }));

const { AssetImage } = await import("./asset-image");

const v = (w: number) => ({ url: `https://a/${w}.webp`, width: w, height: w, bytes: 1, content_hash: "h" });
const ready = { group_id: "g", variants: { thumb: v(128), tile: v(512), full: v(1600), original: null } };
const wrap = (ui: React.ReactNode) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

describe("AssetImage", () => {
  it("srcset_contains_three_variants", () => {
    wrap(<AssetImage asset={ready} alt="x" />);
    const img = screen.getByAltText("x");
    expect(img.getAttribute("srcset")).toBe("https://a/128.webp 128w, https://a/512.webp 512w, https://a/1600.webp 1600w");
    expect(img).toHaveAttribute("width", "512");
  });
  it("lazy_and_async_attributes", () => {
    wrap(<AssetImage asset={ready} alt="x" />);
    expect(screen.getByAltText("x")).toHaveAttribute("loading", "lazy");
    expect(screen.getByAltText("x")).toHaveAttribute("decoding", "async");
  });
  it("falls_back_to_legacy_url", () => {
    wrap(<AssetImage asset={null} legacyUrl="https://old/x.jpg" alt="x" />);
    expect(screen.getByAltText("x")).toHaveAttribute("src", "https://old/x.jpg");
  });
  it("processing_shows_skeleton_then_image", async () => {
    fetchJob.mockResolvedValue({ id: "j", status: "done", result: ready, error: null });
    wrap(<AssetImage asset={{ group_id: null, status: "processing", job_id: "j" }} alt="x" onReady={() => {}} />);
    expect(screen.getByTestId("asset-processing")).toBeInTheDocument();
    expect(await screen.findByAltText("x")).toHaveAttribute("srcset");
  });
});
