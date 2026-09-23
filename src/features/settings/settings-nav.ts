/**
 * What lives under Settings, and in what order.
 *
 * The rule for being here: it is **configuration** — a rule the business sets
 * once and the system then follows. Users, organisations, branches, permissions
 * and staff are deliberately NOT here: those are entities you create, edit and
 * delete all day, and they keep their own top-level pages.
 *
 * Each entry is a real route, so every pane is deep-linkable and the browser's
 * back button works the way an admin expects.
 */
import type { LucideIcon } from "lucide-react";
import {
  ChefHat,
  CupSoda,
  Image as ImageIcon,
  CreditCard,
  Languages,
  Layers,
  MessageCircle,
  Palette,
  Plug,
  QrCode,
  Star,
  Truck,
  Utensils,
} from "lucide-react";
import type { OrgModule } from "@/config/nav";
import type { Authz } from "@/data/authz/use-authz";
import { Cap, type Capability } from "@/generated/capabilities";

export interface SettingsLeaf {
  to: string;
  labelKey: string;
  fallback: string;
  descKey: string;
  desc: string;
  icon: LucideIcon;
  /** Visible when ANY is held. Omitted = everyone. Never a role. */
  caps?: Capability[];
  superAdminOnly?: boolean;
  /** The org module this pane configures (PS-3). Omitted = every org. */
  module?: OrgModule;
}

export interface SettingsGroup {
  labelKey: string;
  fallback: string;
  items: SettingsLeaf[];
}

export const SETTINGS_NAV: SettingsGroup[] = [
  {
    labelKey: "settings.groupThisApp",
    fallback: "This app",
    items: [
      {
        to: "/settings",
        labelKey: "settings.appearance",
        fallback: "Appearance",
        descKey: "settings.appearanceDesc",
        desc: "Theme and language for this device.",
        icon: Palette,
      },
      {
        // A manager owns their own mark and their own links; everything else
        // about an organisation stays super-admin territory.
        to: "/settings/brand",
        module: "pos",
        labelKey: "settings.brand",
        fallback: "Brand",
        descKey: "settings.brandDesc",
        desc: "Your mark and your links, on receipts and on your customers' loyalty cards.",
        icon: ImageIcon,
      },
    ],
  },
  {
    labelKey: "settings.groupChannels",
    fallback: "Ways to sell",
    items: [
      {
        to: "/settings/delivery",
        module: "pos",
        caps: [Cap.deliverySettingsRead],
        labelKey: "nav.delivery",
        fallback: "Delivery",
        descKey: "settings.deliveryDesc",
        desc: "Hours, fees, channels and zone rings.",
        icon: Truck,
      },
      {
        to: "/settings/bookings",
        module: "pos",
        caps: [Cap.bookingsEdit],
        labelKey: "nav.bookings",
        fallback: "Bookings",
        descKey: "settings.bookingsDesc",
        desc: "Slots, party sizes, holds and the phone code.",
        icon: Utensils,
      },
      {
        to: "/settings/loyalty",
        module: "pos",
        caps: [Cap.loyaltyUse, Cap.loyaltyMembersList],
        labelKey: "nav.loyalty",
        fallback: "Loyalty",
        descKey: "settings.loyaltyDesc",
        desc: "Points or stamps, the rewards they buy, and who has joined.",
        icon: Star,
      },
      {
        to: "/settings/qr",
        module: "pos",
        labelKey: "nav.qr",
        fallback: "QR codes",
        descKey: "settings.qrDesc",
        desc: "The codes on your tables, counters and receipts.",
        icon: QrCode,
      },
    ],
  },
  {
    labelKey: "settings.groupTakingMoney",
    fallback: "Taking money",
    items: [
      {
        to: "/settings/payment-methods",
        module: "pos",
        labelKey: "nav.paymentMethods",
        fallback: "Payment methods",
        descKey: "settings.paymentMethodsDesc",
        desc: "What a till may accept, and which of them is cash.",
        icon: CreditCard,
        caps: [Cap.paymentMethodsEdit],
      },
      {
        // Money given away rather than taken, which is why it sits here: a
        // staff drink is stock off the shelf with no sale against it.
        to: "/settings/staff-pool",
        module: "pos",
        labelKey: "nav.staffPool",
        fallback: "Staff drinks",
        descKey: "settings.staffPoolDesc",
        desc: "How many drinks a branch may give its own people in a day, and which items count.",
        icon: CupSoda,
        caps: [Cap.orgSettingsRead, Cap.orgSettingsEdit],
      },
    ],
  },
  {
    labelKey: "settings.groupKitchen",
    fallback: "Kitchen",
    items: [
      {
        to: "/settings/kitchen-stations",
        module: "pos",
        caps: [Cap.kitchenStationsEdit],
        labelKey: "nav.kitchenStations",
        fallback: "Stations",
        descKey: "settings.stationsDesc",
        desc: "The screens a ticket can be routed to.",
        icon: ChefHat,
      },
      {
        to: "/settings/kitchen-routing",
        module: "pos",
        caps: [Cap.kitchenStationsEdit],
        labelKey: "nav.kitchenRouting",
        fallback: "Order routing",
        descKey: "settings.routingDesc",
        desc: "Which items print or show where.",
        icon: Layers,
      },
    ],
  },
  {
    labelKey: "settings.groupSystem",
    fallback: "System",
    items: [
      {
        to: "/settings/integrations",
        module: "pos",
        labelKey: "nav.integrations",
        fallback: "Integrations",
        descKey: "settings.integrationsDesc",
        desc: "Services Madar talks to on your behalf.",
        icon: Plug,
        caps: [Cap.integrationsRead],
      },
      {
        to: "/settings/whatsapp",
        labelKey: "nav.whatsapp",
        fallback: "WhatsApp",
        descKey: "settings.whatsappDesc",
        desc: "The number that sends codes and order updates.",
        icon: MessageCircle,
        superAdminOnly: true,
      },
    ],
  },
];

/**
 * The entries this person may see, in an org with these modules on. A pane
 * of a switched-off module is gone (a Dawam-only org has no delivery, till
 * or kitchen to configure); until the modules are known, none shows.
 */
export const visibleSettings = (authz: Authz, modules: readonly string[]): SettingsGroup[] =>
  SETTINGS_NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => {
      if (i.module && !modules.includes(i.module)) return false;
      if (i.superAdminOnly) return authz.platform;
      if (i.caps) return authz.canAny(...i.caps);
      return true;
    }),
  })).filter((g) => g.items.length > 0);

/** Kept for the language pane, which is the one non-route entry. */
export const LANGUAGE_ICON = Languages;
