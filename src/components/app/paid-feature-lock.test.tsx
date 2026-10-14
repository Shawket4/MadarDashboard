import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { useAuthStore } = await import("@/data/stores/auth.store");
const { PaidFeatureLock } = await import("./paid-feature-lock");

afterEach(async () => {
  useAuthStore.setState({ plan: null });
  await i18n.changeLanguage("en");
});

describe("PaidFeatureLock", () => {
  it("renders the real thing on a plan with the feature, and never the lock", () => {
    for (const plan of ["paid", null]) {
      useAuthStore.setState({ plan });
      const { unmount } = render(
        <PaidFeatureLock feature="inventory" preview={<p>preview</p>}><p>the real thing</p></PaidFeatureLock>,
      );
      expect(screen.getByText("the real thing")).toBeInTheDocument();
      expect(screen.queryByText("preview")).toBeNull();
      expect(document.querySelector("[data-paid-lock]")).toBeNull();
      unmount();
    }
  });

  it("on Free shows the lock, the note and a WhatsApp action, and mounts nothing real", () => {
    useAuthStore.setState({ plan: "free" });
    const Real = vi.fn(() => <p>the real thing</p>);
    render(
      <PaidFeatureLock feature="inventory" title="Recipe steps" preview={<button>demo</button>}><Real /></PaidFeatureLock>,
    );
    expect(Real).not.toHaveBeenCalled();
    expect(screen.queryByText("the real thing")).toBeNull();
    expect(screen.getByText("Paid plan")).toBeInTheDocument();
    expect(screen.getByText("On the paid plan — contact Madar")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Contact Madar/ });
    expect(link).toHaveAttribute("href", expect.stringContaining("wa.me/201211116899"));
    expect(decodeURIComponent(link.getAttribute("href") ?? "")).toMatch(/Inventory/);
    // The preview is a picture: inert and hidden from assistive technology, so nothing in it can act.
    const preview = screen.getByText("demo").closest("[inert]");
    expect(preview).not.toBeNull();
    expect(preview).toHaveAttribute("aria-hidden", "true");
  });

  it("reads in Arabic, and the inline layout is one quiet line", async () => {
    await i18n.changeLanguage("ar");
    useAuthStore.setState({ plan: "free" });
    render(<PaidFeatureLock feature="inventory" layout="inline" />);
    expect(screen.getByText("ضمن الباقة المدفوعة — تواصل مع مدار")).toBeInTheDocument();
    expect(document.querySelector("[data-paid-lock]")?.tagName).toBe("DIV");
  });
});
