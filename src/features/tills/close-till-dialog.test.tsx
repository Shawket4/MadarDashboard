import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { CloseTillPreview } from "./api";
import { till } from "./fixtures.test-util";

await import("@/i18n");
const { CloseTillFormView } = await import("./close-till-dialog");

const preview: CloseTillPreview = {
  till: till({ status: "open" }),
  expected_cash: 50_000,
  methods: [
    { method: "cash", payment_method_id: null, is_cash: true, system_total: 50_000, order_count: 4 },
    { method: "CIB counter", payment_method_id: "pm1", is_cash: false, system_total: 30_000, order_count: 2 },
  ],
  last_till_warning: null,
};

const renderForm = (onSubmit = vi.fn()) => {
  render(
    <Dialog open>
      <DialogContent>
        <DialogTitle>x</DialogTitle>
        <CloseTillFormView preview={preview} onCancel={() => {}} onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>,
  );
  return onSubmit;
};

describe("CloseTillFormView", () => {
  it("lists only non-cash methods for checking and submits checked", async () => {
    const onSubmit = renderForm();
    expect(screen.getAllByTestId("reconcile-row")).toHaveLength(1);
    await userEvent.type(screen.getByLabelText(/Cash counted|النقد المعدود/), "500");
    await userEvent.click(screen.getByRole("button", { name: /Close till|إغلاق الوردية/ }));
    expect(onSubmit).toHaveBeenCalled();
    expect(onSubmit.mock.calls[0][0].rows).toEqual([{ method: "CIB counter", status: "checked", declared: "", note: "" }]);
  });

  it("requires an amount and a note when a method doesn't match", async () => {
    const onSubmit = renderForm();
    await userEvent.type(screen.getByLabelText(/Cash counted|النقد المعدود/), "500");
    await userEvent.click(screen.getByRole("button", { name: /Doesn't match|غير مطابق/ }));
    await userEvent.click(screen.getByRole("button", { name: /Close till|إغلاق الوردية/ }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
