/**
 * The shape of a data page's copy (src/i18n/pages/<key>.ts): its meta, its name, its hero
 * and its sections, each section one of the kit's pieces. kit/Page.astro renders a page
 * from this alone, so a new page is its copy in both languages and a two-line page file
 * (`npm run new:page -- <key>`). A page that needs more (scenes, a price list) is built by
 * hand from the same kit instead.
 */
import type { PageKey } from "@/lib/pages";

/** Where a link goes, in either language (kit/Page.astro makes the address). */
export type Href =
  | { page: PageKey; hash?: string }
  | { to: "whatsapp" | "signup" | "phone" | "email" }
  | { url: string };
export interface Action {
  label: string;
  href: Href;
}

/** A crew member by pose (kit/CrewMoment.astro). */
export type Pose = "wave" | "joy" | "count" | "cup" | "pot" | "slice" | "slice-joy";

/** A section's head (kit/Section.astro). */
interface Head {
  id?: string;
  tone?: "paper" | "surface" | "ink";
  kicker?: string;
  title?: string;
  lead?: string;
}
type Item = { title: string; body: string };

/** One section, by the kit piece it shows. */
export type SectionData =
  /** A head on its own: kicker, heading, lead. */
  | (Head & { kind: "text" })
  /** FeatureGrid: short items over hairlines, or in cards. */
  | (Head & { kind: "grid"; items: Item[]; columns?: 2 | 3 | 4; numbered?: boolean; cards?: boolean })
  /** StepList: numbered steps. */
  | (Head & { kind: "steps"; items: Item[] })
  /** CheckList beside the head, with an optional button under it. */
  | (Head & { kind: "checks"; items: string[]; action?: Action })
  /** FaqList (and its FAQPage JSON-LD). */
  | (Head & { kind: "faq"; items: { q: string; a: string }[] })
  /** DataTable: a plain table that scrolls in its box on a phone. */
  | (Head & { kind: "table"; label: string; columns: string[]; rows: string[][] })
  /** CtaBand: the dark strip with one button, the crew on its edge. */
  | { kind: "band"; kicker?: string; title: string; body?: string; action: Action; more?: Action; crew?: Pose[] };

export interface PageCopy {
  meta: { title: string; description: string };
  /** Its name in the header, the footer and the breadcrumbs. */
  label: string;
  hero: { kicker?: string; title: string; lead?: string; tone?: "paper" | "ink"; action?: Action };
  sections: SectionData[];
}

/** A data page's copy module: both languages, the same shape. */
export interface PageModule {
  en: PageCopy;
  ar: PageCopy;
}
