import { describe, expect, it } from "vitest";

import { shiftsRedirect } from "./redirect";

describe("/shifts", () => {
  it("redirects to /tills keeping the search", () => {
    expect(shiftsRedirect({ report: "x" })).toEqual({ to: "/tills", search: { report: "x" }, replace: true });
  });
});
