import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { till } from "./fixtures.test-util";

vi.mock("@tanstack/react-router", () => ({ Link: (p: { children: React.ReactNode }) => <a>{p.children}</a> }));
await import("@/i18n");
const { OpenTillsList } = await import("./open-tills-card");

describe("OpenTillsList", () => {
  it("lists open tills with device code and flag", () => {
    render(<OpenTillsList tills={[till({ status: "open" }), till({ id: "t2", status: "open", opened_while_another_open: true, other_till_id: "t1" })]} />);
    expect(screen.getAllByTestId("open-till")).toHaveLength(2);
    expect(screen.getAllByTestId("flag-badge")).toHaveLength(1);
  });
  it("says so when nothing is open", () => {
    render(<OpenTillsList tills={[]} />);
    expect(screen.getByText(/No open till|لا توجد وردية مفتوحة/)).toBeInTheDocument();
  });
});
