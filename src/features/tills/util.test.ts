import vectors from "@/lib/reconcile_vectors.json";
import { describe, expect, it } from "vitest";

import { closeTillSchema, reconcileRefusal } from "./util";

// madar-shared's reconcile_vectors.json (src/lib, pinned): the cases madar-till's live close check is
// tested against. The close dialog must refuse exactly when the server would, naming the same code and method.
describe("the close check matches madar-shared's vectors", () => {
  it.each(vectors)("$name", (v) => {
    expect(reconcileRefusal(v.totals, v.inputs)).toEqual("Err" in v.expected ? v.expected.Err : null);
  });

  // The cases the form can say: one row per non-cash method, checked or disagreed (no input reads as checked).
  const sayable = vectors.filter((v) =>
    v.inputs.every(
      (i, k) =>
        ["checked", "disagreed"].includes(i.status) &&
        v.totals.some((t) => !t.is_cash && t.method === i.method) &&
        v.inputs.findIndex((j) => j.method === i.method) === k,
    ),
  );
  it.each(sayable)("the form submits exactly when the server accepts: $name", (v) => {
    const rows = v.totals
      .filter((t) => !t.is_cash)
      .map((t) => {
        const i = v.inputs.find((x) => x.method === t.method);
        return {
          method: t.method,
          status: (i?.status ?? "checked") as "checked" | "disagreed",
          declared: i?.declared_amount == null ? "" : String(i.declared_amount / 100),
          note: i?.note ?? "",
        };
      });
    const form = { cash: String(v.closing_cash_declared / 100), cashNote: v.cash_note ?? "", rows };
    expect(closeTillSchema.safeParse(form).success).toBe("Ok" in v.expected);
  });

  it("covers the refusals the form can reach", () => {
    expect(sayable.filter((v) => "Err" in v.expected).map((v) => v.name)).toHaveLength(5);
  });
});
