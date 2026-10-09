/**
 * JSON-LD for the site, in one place so every page describes Madar the same way.
 * Pages pass extra blocks to BaseLayout (`jsonLd`); BaseLayout always adds the
 * Organization. Blocks link to each other by `@id`.
 */
import { t } from "@/i18n";
import {
  type Lang, type PageKey, SITE_URL, absoluteUrl, pageHref,
  EMAIL, PHONE_E164, INSTAGRAM, FACEBOOK, APP_STORE_URL,
} from "@/lib/site";

const ROOT = `${SITE_URL}/`;
export const ORG_ID = `${ROOT}#organization`;
export const WEBSITE_ID = `${ROOT}#website`;

export function organization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: "Madar POS",
    alternateName: ["Madar", "مدار"],
    url: ROOT,
    logo: absoluteUrl("/icon-512.png"),
    email: EMAIL,
    address: { "@type": "PostalAddress", addressLocality: "Cairo", addressCountry: "EG" },
    contactPoint: [{
      "@type": "ContactPoint",
      telephone: PHONE_E164,
      email: EMAIL,
      contactType: "sales",
      areaServed: "EG",
      availableLanguage: ["en", "ar"],
    }],
    sameAs: [INSTAGRAM, FACEBOOK, APP_STORE_URL],
    founder: { "@type": "Person", name: "Shawket Ibrahim", alternateName: "شوكت إبراهيم" },
  };
}

export function website() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "Madar POS",
    alternateName: "مدار",
    url: ROOT,
    inLanguage: ["en", "ar"],
    publisher: { "@id": ORG_ID },
  };
}

/** The product with its monthly offers (the Pricing page's plans, per branch). */
export function softwareApplication(lang: Lang, page: PageKey) {
  const c = t(lang);
  const p = c.pricing;
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Madar POS",
    alternateName: "مدار",
    applicationCategory: "BusinessApplication",
    operatingSystem: "iPadOS, Android, Web",
    url: absoluteUrl(pageHref(lang, page)),
    inLanguage: lang,
    description: c.meta.home.description,
    publisher: { "@id": ORG_ID },
    offers: p.plans.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.prices.monthly,
      priceCurrency: "EGP",
      description: `${plan.name}: ${p.termTotal.monthly}, per branch`,
      url: absoluteUrl(pageHref(lang, "pricing")),
    })),
  };
}

/** Home → this page, in the page's language. */
export function breadcrumbs(lang: Lang, page: Exclude<PageKey, "home">) {
  const c = t(lang);
  const names: Record<Exclude<PageKey, "home">, string> = {
    features: c.nav.features,
    pricing: c.nav.pricing,
    faq: c.nav.faq,
    about: c.nav.about,
    contact: c.nav.contact,
    developers: c.footer.developers,
  };
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: c.nav.homeLabel, item: absoluteUrl(pageHref(lang, "home")) },
      { "@type": "ListItem", position: 2, name: names[page], item: absoluteUrl(pageHref(lang, page)) },
    ],
  };
}
