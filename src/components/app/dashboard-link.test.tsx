import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { setProduct } from "@/lib/product";
import { DashboardLink } from "./dashboard-link";

vi.mock("@/components/app/link", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a data-router-link href={to}>{children}</a>,
}));
vi.mock("@/data/config/env", () => ({ env: { VITE_API_URL: "/api", VITE_DASHBOARD_URL: "https://madar-pos.cloud" } }));

describe("DashboardLink", () => {
  afterEach(() => setProduct("dashboard"));

  it("is a router link in the dashboard", () => {
    render(<DashboardLink to="/reports/loyalty">Report</DashboardLink>);
    expect(screen.getByText("Report").closest("a")).toHaveAttribute("data-router-link");
  });

  it("opens the dashboard's page in a new tab from Rewards", () => {
    setProduct("rewards");
    render(
      <DashboardLink to="/customers" search={{ q: "+20100" }}>
        Customer
      </DashboardLink>,
    );
    const a = screen.getByText("Customer").closest("a")!;
    expect(a).not.toHaveAttribute("data-router-link");
    expect(a.href).toBe("https://madar-pos.cloud/customers?q=%2B20100");
    expect(a).toHaveAttribute("target", "_blank");
  });
});
