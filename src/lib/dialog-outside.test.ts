import { describe, expect, it, vi } from "vitest";

import { keepOpenForConfirm } from "./dialog-outside";

describe("keepOpenForConfirm (E2E D-059)", () => {
  it("keeps a dialog open when the press is inside a confirmation", () => {
    const alert = document.createElement("div");
    alert.setAttribute("role", "alertdialog");
    const button = document.createElement("button");
    alert.append(button);
    document.body.append(alert);
    const preventDefault = vi.fn();
    keepOpenForConfirm({ target: button, preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it("still lets a real outside press close it", () => {
    const outside = document.createElement("button");
    document.body.append(outside);
    const preventDefault = vi.fn();
    keepOpenForConfirm({ target: outside, preventDefault });
    keepOpenForConfirm({ target: null, preventDefault });
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
