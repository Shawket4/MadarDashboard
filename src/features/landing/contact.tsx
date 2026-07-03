import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Phone, type LucideIcon } from "lucide-react";

// lucide 1.x removed brand icons — the two social glyphs live inline.
type SocialIcon = LucideIcon | ((props: React.SVGProps<SVGSVGElement>) => React.JSX.Element);
const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);
const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/* Contact + social details for the marketing landing. */
const PHONE_DISPLAY = "+20 121 111 6899";
const PHONE_HREF = "tel:+201211116899";
const EMAIL = "shawket.4@icloud.com";
const EMAIL_HREF = "mailto:shawket.4@icloud.com";

const SOCIALS: { key: string; label: string; icon: SocialIcon; href: string }[] = [
  { key: "instagram", label: "Instagram", icon: Instagram, href: "https://www.instagram.com/madar.cloud/" },
  { key: "facebook", label: "Facebook", icon: Facebook, href: "https://www.facebook.com/profile.php?id=61591636403380" },
];

/** Instagram + Facebook icon links — reused in the footer and the contact dialog. */
export function SocialLinks({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {SOCIALS.map(({ key, label, icon: Icon, href }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-brand/40 hover:bg-brand/10 hover:text-brand focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Icon className="size-4" />
        </a>
      ))}
    </div>
  );
}

/** A tappable phone / email row inside the dialog. */
function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: SocialIcon;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand/40 hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-muted-foreground">{label}</span>
        <span className="block truncate font-medium text-foreground" dir="ltr">
          {value}
        </span>
      </span>
    </a>
  );
}

/**
 * Contact dialog — wraps any trigger button. Surfaces the founder's phone, email,
 * and socials so a prospective operator can reach out directly.
 */
export function ContactDialog({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl tracking-tight">
            {t("landing.contact.title", "Let's talk")}
          </DialogTitle>
          <DialogDescription className="text-pretty">
            {t(
              "landing.contact.subtitle",
              "Tell us about your shop and we'll get you set up. Reach out any time.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <ContactRow icon={Phone} label={t("landing.contact.phone", "Phone & WhatsApp")} value={PHONE_DISPLAY} href={PHONE_HREF} />
          <ContactRow icon={Mail} label={t("landing.contact.email", "Email")} value={EMAIL} href={EMAIL_HREF} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">{t("landing.contact.follow", "Follow Madar")}</span>
          <SocialLinks />
        </div>

        <DialogClose className="sr-only">{t("common.close", "Close")}</DialogClose>
      </DialogContent>
    </Dialog>
  );
}
