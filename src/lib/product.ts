/**
 * Which product this page is: the Madar dashboard, or Rewards by Madar
 * (src/rewards-app sets it at boot). Pages both products share ask it where
 * they differ, such as a link to a dashboard-only page (`DashboardLink`).
 */
export type Product = "dashboard" | "rewards";

let product: Product = "dashboard";

export function setProduct(p: Product): void {
  product = p;
}

export function currentProduct(): Product {
  return product;
}
