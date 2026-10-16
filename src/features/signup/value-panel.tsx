/**
 * What the free plan is, said twice: in the brand panel beside the form on a
 * wide screen, and a compact card under it on a phone. Free = POS only (one branch,
 * one till, unlimited staff); the paid features are named as an upgrade, never
 * as a promise of the free plan.
 */
import { Check, Plus, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";


const list = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

function useValueCopy() {
  const { t } = useTranslation();
  return {
    free: list(t("signup.freeItems", { returnObjects: true })),
    upgrade: list(t("signup.upgradeItems", { returnObjects: true })),
    trust: list(t("signup.trust", { returnObjects: true })),
  };
}

/** The brand panel's middle on sign-up (AuthShell's `panel`): the free plan, then the upgrade. */
export function SignupPanelCopy() {
  const { t } = useTranslation();
  const { free, upgrade } = useValueCopy();
  return (
    <div className="max-w-xl space-y-7">
      <div className="space-y-4">
        <p className="inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-foreground/5 px-3 py-1 text-xs font-medium text-[var(--madar-teal-light)]">
          <span aria-hidden className="size-1.5 rounded-full bg-[var(--madar-teal-light)]" />
          {t("signup.valueEyebrow", "Madar POS · Free plan")}
        </p>
        <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-balance xl:text-5xl">
          {t("signup.valueTitle", "Your café's till, free for good.")}
        </h1>
        <p className="text-base leading-relaxed text-sidebar-muted text-pretty">
          {t("signup.valueSub", "No card, no contract and no trial clock. Sign up, add your menu and start selling today.")}
        </p>
      </div>

      <section aria-labelledby="signup-free-title" className="space-y-3.5">
        <h2 id="signup-free-title" className="text-sm font-semibold">{t("signup.freeTitle", "What you get, free")}</h2>
        <ul className="grid gap-x-6 gap-y-2.5 text-[15px] xl:grid-cols-2">
          {free.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span aria-hidden className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[var(--madar-teal-light)]/20 text-[var(--madar-teal-light)]">
                <Check className="size-3" strokeWidth={3} />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="signup-upgrade-title" className="space-y-3.5 border-t border-sidebar-border pt-6">
        <h2 id="signup-upgrade-title" className="text-sm font-semibold text-sidebar-muted">{t("signup.upgradeTitle", "Upgrade anytime for")}</h2>
        <ul className="flex flex-wrap gap-2">
          {upgrade.map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5 rounded-full border border-sidebar-border bg-sidebar-foreground/5 px-3 py-1.5 text-[13px] text-sidebar-foreground/90">
              <Plus aria-hidden className="size-3 text-sidebar-muted" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-[13px] text-sidebar-muted">{t("signup.upgradeNote", "Staying free is always fine. Nothing to rebuild when you upgrade.")}</p>
      </section>
    </div>
  );
}

/** Above the copyright at the foot of the panel: why it's safe to sign up. */
export function SignupPanelFooter() {
  const { t } = useTranslation();
  const { trust } = useValueCopy();
  return (
    <>
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px]">
        {trust.map((item) => (
          <li key={item} className="inline-flex items-center gap-1.5">
            <ShieldCheck aria-hidden className="size-4 text-[var(--madar-teal-light)]" />
            {item}
          </li>
        ))}
      </ul>
      <p>{t("signup.trustBuilt", "Built in Cairo for cafés and restaurants in Egypt")}</p>
    </>
  );
}

/** The phone's version: under the form card, short, with the upgrade list folded away. */
export function CompactValue() {
  const { t } = useTranslation();
  const { free, upgrade, trust } = useValueCopy();
  return (
    <section aria-labelledby="signup-compact-title" className="mt-6 rounded-2xl border border-border bg-muted/50 p-5 lg:hidden">
      <h2 id="signup-compact-title" className="text-sm font-semibold">{t("signup.compactTitle", "What the free plan includes")}</h2>
      <ul className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm min-[420px]:grid-cols-2">
        {free.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={2.5} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <details className="group mt-4 border-t border-border pt-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
          {t("signup.compactUpgrade", "Upgrade anytime for more")}
          <Plus aria-hidden className="size-4 text-muted-foreground transition-transform group-open:rotate-45 motion-reduce:transition-none" />
        </summary>
        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          {upgrade.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Plus aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </details>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
        {trust.map((item) => (
          <li key={item} className="inline-flex items-center gap-1.5">
            <ShieldCheck aria-hidden className="size-3.5 text-brand" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
