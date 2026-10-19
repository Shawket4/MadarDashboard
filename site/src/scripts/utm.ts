// Carries the visit's campaign tags (utm_*, and Meta's and Google's click ids) onto
// the signup links, so the signup page's pageview in Umami keeps the campaign that
// brought the visitor even after they browse a few pages first.
import { DASHBOARD_URL } from "@/lib/site";

const KEY = "madar-utm";
const TAG = /^(utm_\w+|fbclid|gclid)$/;
const here = new URLSearchParams([...new URLSearchParams(location.search)].filter(([k]) => TAG.test(k))).toString();
let carry = here;
try {
  if (here) sessionStorage.setItem(KEY, here);
  else carry = sessionStorage.getItem(KEY) ?? "";
} catch {} // storage blocked: this page's own tags only

if (carry) {
  for (const a of document.querySelectorAll<HTMLAnchorElement>(`a[href^="${DASHBOARD_URL}/signup"]`)) {
    const u = new URL(a.href);
    for (const [k, v] of new URLSearchParams(carry)) u.searchParams.set(k, v);
    a.href = u.toString();
  }
}
