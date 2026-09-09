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
import type { UserRole } from "@/data/api/generated/models";

export interface SettingsLeaf {
  to: string;
  labelKey: string;
  fallback: string;
  descKey: string;
  desc: string;
  icon: LucideIcon;
  roles?: UserRole[];
  superAdminOnly?: boolean;
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
        labelKey: "nav.delivery",
        fallback: "Delivery",
        descKey: "settings.deliveryDesc",
        desc: "Hours, fees, channels and zone rings.",
        icon: Truck,
      },
      {
        to: "/settings/bookings",
        labelKey: "nav.bookings",
        fallback: "Bookings",
        descKey: "settings.bookingsDesc",
        desc: "Slots, party sizes, holds and the phone code.",
        icon: Utensils,
      },
      {
        to: "/settings/loyalty",
        labelKey: "nav.loyalty",
        fallback: "Loyalty",
        descKey: "settings.loyaltyDesc",
        desc: "Points or stamps, the rewards they buy, and who has joined.",
        icon: Star,
      },
      {
        to: "/settings/qr",
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
        labelKey: "nav.paymentMethods",
        fallback: "Payment methods",
        descKey: "settings.paymentMethodsDesc",
        desc: "What a till may accept, and which of them is cash.",
        icon: CreditCard,
        roles: ["org_admin", "super_admin"],
      },
    ],
  },
  {
    labelKey: "settings.groupKitchen",
    fallback: "Kitchen",
    items: [
      {
        to: "/settings/kitchen-stations",
        labelKey: "nav.kitchenStations",
        fallback: "Stations",
        descKey: "settings.stationsDesc",
        desc: "The screens a ticket can be routed to.",
        icon: ChefHat,
      },
      {
        to: "/settings/kitchen-routing",
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
        labelKey: "nav.integrations",
        fallback: "Integrations",
        descKey: "settings.integrationsDesc",
        desc: "Services Madar talks to on your behalf.",
        icon: Plug,
        roles: ["org_admin", "super_admin"],
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

/** The entries a role may see. */
export const visibleSettings = (
  role: UserRole | undefined,
): SettingsGroup[] =>
  SETTINGS_NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => {
      if (i.superAdminOnly) return role === "super_admin";
      if (i.roles) return role !== undefined && i.roles.includes(role);
      return true;
    }),
  })).filter((g) => g.items.length > 0);

/** Kept for the language pane, which is the one non-route entry. */
export const LANGUAGE_ICON = Languages;
