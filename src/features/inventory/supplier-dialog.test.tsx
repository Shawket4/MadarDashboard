/**
 * B1 / W9 (inventory-purchasing): the backend now clears a supplier's contact
 * field on null or blank, so a field emptied in the dialog must reach the
 * PATCH as null, not be left out (absent means "leave as is").
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const customInstance = vi.fn().mockResolvedValue({});
vi.mock("@/data/api/custom-instance", () => ({ customInstance: (...a: unknown[]) => customInstance(...a) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("./lib", () => ({ invalidateInventory: vi.fn() }));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { SupplierDialog } = await import("./supplier-dialog");

const supplier = { id: "s1", org_id: "org-1", name: "Nile Dairy", contact_name: "Ali", email: "ali@nile.eg", phone: "0100", is_active: true } as never;

describe("SupplierDialog (W9, B1)", () => {
  it("sends a cleared contact, email and phone as null, and trims what is kept", async () => {
    render(<SupplierDialog orgId="org-1" open onOpenChange={vi.fn()} supplier={supplier} />);
    fireEvent.change(screen.getByDisplayValue("Nile Dairy"), { target: { value: "  Nile Dairy Co " } });
    fireEvent.change(screen.getByDisplayValue("Ali"), { target: { value: "" } });
    fireEvent.change(screen.getByDisplayValue("ali@nile.eg"), { target: { value: "   " } });
    fireEvent.change(screen.getByDisplayValue("0100"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(customInstance).toHaveBeenCalledOnce());
    expect(customInstance.mock.calls[0][0]).toMatchObject({
      url: "/purchasing/suppliers/s1",
      method: "PATCH",
      data: { name: "Nile Dairy Co", contact_name: null, email: null, phone: null, is_active: true },
    });
  });
});
