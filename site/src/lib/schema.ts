/**
 * JSON-LD for the site, in one place so every page describes Madar the same way.
 * Pages pass extra blocks to BaseLayout (`jsonLd`); BaseLayout always adds the
 * Organization. Blocks link to each other by `@id`.
 */
import { t, pageLabel } from "@/i18n";
import {
  type Lang, type PageKey, SITE_URL, absoluteUrl, pageHref,
  EMAIL, PHONE_E164, INSTAGRAM, FACEBOOK, STORE_URLS,
} from "@/lib/site";
import { REWARDS, REWARDS_URL, REWARDS_PRICES, REWARDS_TERMS } from "@/lib/rewards";

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
    sameAs: [INSTAGRAM, FACEBOOK, ...STORE_URLS],
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

/** The Free plan: Madar POS at 0 EGP a month, for good (the Free page). */
export function freeApplication(lang: Lang) {
  const c = t(lang);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Madar Free",
    alternateName: "مدار المجاني",
    applicationCategory: "BusinessApplication",
    operatingSystem: "iPadOS, Android, Web",
    url: absoluteUrl(pageHref(lang, "free")),
    inLanguage: lang,
    description: c.meta.free.description,
    isAccessibleForFree: true,
    publisher: { "@id": ORG_ID },
    offers: {
      "@type": "Offer",
      name: "Madar Free",
      price: 0,
      priceCurrency: "EGP",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(pageHref(lang, "free")),
    },
  };
}

/**
 * Rewards by Madar: the wallet stamp card, a web app (lib/rewards.ts), with one Offer per
 * billing term (the add-on to Madar Free, per shop). On the Rewards and Pricing pages.
 */
export function rewardsApplication(lang: Lang) {
  const c = t(lang);
  const other = lang === "en" ? "ar" : "en";
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: REWARDS.name[lang],
    alternateName: REWARDS.name[other],
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: absoluteUrl(pageHref(lang, "rewards")),
    installUrl: REWARDS_URL,
    inLanguage: lang,
    publisher: { "@id": ORG_ID },
    offers: REWARDS_TERMS.map((term) => ({
      "@type": "Offer",
      name: `${REWARDS.name[lang]} · ${c.pricing.terms[term]}`,
      price: REWARDS_PRICES[term],
      priceCurrency: "EGP",
      description: `${c.pricing.termTotal[term]}, ${c.pricing.rewards.perShop}`,
      url: absoluteUrl(pageHref(lang, "pricing", "rewards")),
    })),
  };
}

/** A FAQPage of the questions a page shows (FaqList.astro), in the page's language. */
export function faqPage(lang: Lang, items: readonly { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang,
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
}

/**
 * The home page's "Coming from Foodics?" steps (home/Foodics.astro) as a HowTo, in the
 * page's language: each step as the page shows it, linked to its own place on the page.
 */
export function foodicsHowTo(lang: Lang) {
  const f = t(lang).foodics;
  const url = absoluteUrl(pageHref(lang, "home"));
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${url}#foodics`,
    name: f.howTo,
    description: f.lead,
    url: `${url}#foodics`,
    inLanguage: lang,
    step: f.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.t,
      text: s.b,
      url: `${url}#foodics-${i + 1}`,
    })),
  };
}

/** Home → this page, in the page's language. */
export function breadcrumbs(lang: Lang, page: Exclude<PageKey, "home">) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: pageLabel(lang, "home"), item: absoluteUrl(pageHref(lang, "home")) },
      { "@type": "ListItem", position: 2, name: pageLabel(lang, page), item: absoluteUrl(pageHref(lang, page)) },
    ],
  };
}
