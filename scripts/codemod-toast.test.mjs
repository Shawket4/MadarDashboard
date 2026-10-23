import { describe, expect, it } from "vitest";

import { transform } from "./codemod-toast.mjs";

describe("codemod-toast", () => {
  const before = [
    'import { toast } from "sonner";',
    'import { useErrorToast } from "@/features/public-shell/public-toaster";',
    'import { PublicToaster } from "../public-shell/public-toaster";',
    'const { toast: t2 } = await import("sonner");',
    'toast("hi");',
    "",
  ].join("\n");

  it("moves sonner and the old wrappers onto the toast module, in one import", () => {
    const out = transform(before);
    expect(out).not.toMatch(/sonner|public-toaster/);
    expect(out).toContain('import { toast, useErrorToast, Toaster } from "@/components/ui/toast";');
    expect(out).toContain('await import("@/components/ui/toast")');
    expect(out).toContain('toast.message("hi")');
  });

  it("is idempotent, and leaves migrated files alone", () => {
    const once = transform(before);
    expect(transform(once)).toBe(once);
    const clean = 'import { toast } from "@/components/ui/toast";\ntoast.success("ok");\n';
    expect(transform(clean)).toBe(clean);
  });
});
