import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Plus, Rocket } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploader } from "@/components/app/image-uploader";
import { cn } from "@/lib/utils";
import { getTranslatedName } from "@/lib/translation";
import {
  updateOrg,
  uploadOrgLogo,
  useGetOrg,
  useListCategories,
  useListMenuItems,
} from "@/data/api/generated/api";
import type { MenuItem, OnboardingStep } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useAppStore } from "@/data/stores/app.store";

import { BranchDialog } from "@/features/branches/branch-dialog";
import { PaymentMethodDialog } from "@/features/payment-methods/payment-method-dialog";
import { CategoryDialog } from "@/features/menu/category-dialog";
import { AddonDialog } from "@/features/menu/addon-dialog";
import { MenuItemDialog } from "@/features/menu/menu-item-dialog";
import { CreateIngredientDialog } from "@/features/recipes/create-ingredient-dialog";
import { UserDialog } from "@/features/users/user-dialog";

import type { StepKey } from "./config";

const CURRENCIES = ["EGP", "USD", "SAR", "AED", "GBP", "EUR"];

interface Props {
  orgId: string;
  activeKey: StepKey;
  byKey: Map<string, OnboardingStep>;
  canComplete: boolean;
  refresh: () => void;
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  onFinish: () => void;
  finishing: boolean;
}

export function StepPanel(props: Props) {
  const { t } = useTranslation();
  const { activeKey, isFirst, onPrev, onNext } = props;
  const isFinale = activeKey === "go_live";

  return (
    <div className="flex min-h-[28rem] flex-col">
      <header className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">{t(`onboarding.steps.${activeKey}.title`, activeKey)}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t(`onboarding.steps.${activeKey}.desc`, "")}</p>
      </header>

      <div className="flex-1">
        <StepBody {...props} />
      </div>

      {!isFinale ? (
        <footer className="mt-8 flex items-center justify-between border-t border-border pt-5">
          <Button variant="ghost" onClick={onPrev} disabled={isFirst}>
            <ArrowLeft className="size-4 rtl:rotate-180" /> {t("onboarding.back", "Back")}
          </Button>
          <Button variant="outline" onClick={onNext}>
            {t("onboarding.continue", "Continue")} <ArrowRight className="size-4 rtl:rotate-180" />
          </Button>
        </footer>
      ) : null}
    </div>
  );
}

function StepBody(props: Props) {
  const { orgId, activeKey, byKey, refresh } = props;
  const count = (key: string) => byKey.get(key)?.count ?? 0;

  switch (activeKey) {
    case "org_profile":
      return <OrgIdentityBody orgId={orgId} refresh={refresh} onNext={props.onNext} />;
    case "branch":
      return (
        <AddViaDialog count={count("branch")} stepKey="branch" refresh={refresh}>
          {(open, set) => <BranchDialog orgId={orgId} branch={null} open={open} onOpenChange={set} />}
        </AddViaDialog>
      );
    case "payment_methods":
      return (
        <AddViaDialog count={count("payment_methods")} stepKey="payment_methods" refresh={refresh}>
          {(open, set) => <PaymentMethodDialog method={null} open={open} onOpenChange={set} />}
        </AddViaDialog>
      );
    case "ingredients":
      return (
        <AddViaDialog count={count("ingredients")} stepKey="ingredients" refresh={refresh}>
          {(open, set) => <CreateIngredientDialog orgId={orgId} open={open} onOpenChange={set} onCreated={() => {}} />}
        </AddViaDialog>
      );
    case "categories":
      return (
        <AddViaDialog count={count("categories")} stepKey="categories" refresh={refresh}>
          {(open, set) => <CategoryDialog orgId={orgId} category={null} open={open} onOpenChange={set} />}
        </AddViaDialog>
      );
    case "menu_items":
      return <MenuItemsBody orgId={orgId} count={count("menu_items")} refresh={refresh} />;
    case "addons":
      return (
        <AddViaDialog count={count("addons")} stepKey="addons" refresh={refresh}>
          {(open, set) => <AddonDialog orgId={orgId} addon={null} open={open} onOpenChange={set} />}
        </AddViaDialog>
      );
    case "recipes":
      return <RecipesBody orgId={orgId} refresh={refresh} />;
    case "team":
      return (
        <AddViaDialog count={count("team")} stepKey="team" refresh={refresh}>
          {(open, set) => <UserDialog orgId={orgId} user={null} open={open} onOpenChange={set} />}
        </AddViaDialog>
      );
    case "go_live":
      return <GoLiveBody canComplete={props.canComplete} onFinish={props.onFinish} finishing={props.finishing} />;
    default:
      return null;
  }
}

/* ── Generic "create via the real dialog" body ──────────────────────────────── */

function AddViaDialog({
  count,
  stepKey,
  refresh,
  children,
}: {
  count: number;
  stepKey: StepKey;
  refresh: () => void;
  children: (open: boolean, setOpen: (o: boolean) => void) => ReactNode;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) refresh(); // a create likely happened — refresh the mirror
  };

  return (
    <div className="space-y-5">
      {count > 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
          <Check className="size-4 shrink-0" aria-hidden="true" />
          {t(`onboarding.steps.${stepKey}.added`, { count, defaultValue: `${count} added — nicely done.` })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          {t(`onboarding.steps.${stepKey}.empty`, "Nothing here yet — add your first one to see it appear in your café.")}
        </p>
      )}

      <Button size="lg" onClick={() => setOpen(true)} variant={count > 0 ? "outline" : "default"}>
        <Plus className="size-4" />
        {count > 0
          ? t(`onboarding.steps.${stepKey}.addAnother`, "Add another")
          : t(`onboarding.steps.${stepKey}.cta`, "Add")}
      </Button>

      {children(open, onOpenChange)}
    </div>
  );
}

/* ── Café identity (no existing dialog — small inline form) ──────────────────── */

function OrgIdentityBody({ orgId, refresh, onNext }: { orgId: string; refresh: () => void; onNext: () => void }) {
  const { t } = useTranslation();
  const orgQ = useGetOrg(orgId, { query: { enabled: !!orgId } });
  const [name, setName] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const org = orgQ.data;
  const nameValue = name ?? org?.name ?? "";
  const currencyValue = currency ?? org?.currency_code ?? "EGP";
  const logoValue = org?.logo_url ?? null;

  const save = async () => {
    setBusy(true);
    try {
      await updateOrg(orgId, { name: nameValue.trim() || undefined, currency_code: currencyValue });
      await orgQ.refetch();
      refresh();
      toast.success(t("onboarding.steps.org_profile.saved", "Café details saved."));
      onNext();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <ImageUploader
          value={logoValue}
          square
          hint={t("onboarding.steps.org_profile.logoHint", "PNG, JPG or WebP")}
          onUpload={async (file) => {
            const updated = await uploadOrgLogo(orgId, { logo: file });
            if (updated.logo_url) useAppStore.getState().setSelectedOrg(orgId, updated.logo_url);
            await orgQ.refetch();
            refresh();
            return updated.logo_url ?? "";
          }}
        />
        <div className="text-sm text-muted-foreground">
          {t("onboarding.steps.org_profile.logoCopy", "Add your logo — it shows up across the dashboard, receipts and your customers' menu.")}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="onb-org-name">{t("onboarding.steps.org_profile.name", "Café name")}</Label>
          <Input
            id="onb-org-name"
            value={nameValue}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("onboarding.steps.org_profile.namePh", "e.g. Madar Coffee")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="onb-org-currency">{t("onboarding.steps.org_profile.currency", "Currency")}</Label>
          <Select value={currencyValue} onValueChange={setCurrency}>
            <SelectTrigger id="onb-org-currency"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button size="lg" onClick={save} loading={busy}>{t("onboarding.steps.org_profile.save", "Save & continue")}</Button>
    </div>
  );
}

/* ── Menu items (needs categories for the item dialog) ───────────────────────── */

function MenuItemsBody({ orgId, count, refresh }: { orgId: string; count: number; refresh: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const categoriesQ = useListCategories({ org_id: orgId }, { query: { enabled: !!orgId } });
  const categories = categoriesQ.data ?? [];

  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) refresh();
  };

  return (
    <div className="space-y-5">
      {categories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
          {t("onboarding.steps.menu_items.needCategory", "Add a category first — every item lives in one.")}
        </p>
      ) : count > 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">
          <Check className="size-4 shrink-0" aria-hidden="true" />
          {t("onboarding.steps.menu_items.added", { count, defaultValue: `${count} on the menu board.` })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          {t("onboarding.steps.menu_items.empty", "Build your first item — set its price, sizes, recipe and add-ons in one go.")}
        </p>
      )}

      <Button size="lg" disabled={categories.length === 0} onClick={() => setOpen(true)} variant={count > 0 ? "outline" : "default"}>
        <Plus className="size-4" /> {count > 0 ? t("onboarding.steps.menu_items.addAnother", "Add another item") : t("onboarding.steps.menu_items.cta", "Add a menu item")}
      </Button>

      <MenuItemDialog orgId={orgId} categories={categories} item={null} open={open} onOpenChange={onOpenChange} />
    </div>
  );
}

/* ── Recipes (reuse the item dialog, which carries the recipe builder) ───────── */

function RecipesBody({ orgId, refresh }: { orgId: string; refresh: () => void }) {
  const { t, i18n } = useTranslation();
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const itemsQ = useListMenuItems({ org_id: orgId }, { query: { enabled: !!orgId } });
  const categoriesQ = useListCategories({ org_id: orgId }, { query: { enabled: !!orgId } });
  const items = itemsQ.data ?? [];
  const categories = categoriesQ.data ?? [];

  const onOpenChange = (o: boolean) => {
    if (!o) {
      setEditing(null);
      refresh();
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        {t("onboarding.steps.recipes.intro", "Open an item and add its recipe — Madar then knows the cost and margin of everything you sell.")}
      </p>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          {t("onboarding.steps.recipes.noItems", "Add a menu item first, then come back to give it a recipe.")}
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {items.slice(0, 8).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="truncate text-sm">{getTranslatedName(item, i18n.language)}</span>
              <Button size="sm" variant="outline" onClick={() => setEditing(item)}>
                {t("onboarding.steps.recipes.addFor", "Add recipe")}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <MenuItemDialog orgId={orgId} categories={categories} item={editing} open={!!editing} onOpenChange={onOpenChange} />
      ) : null}
    </div>
  );
}

/* ── Go live (finale) ───────────────────────────────────────────────────────── */

function GoLiveBody({ canComplete, onFinish, finishing }: { canComplete: boolean; onFinish: () => void; finishing: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-muted/20 px-6 py-12 text-center">
      <span className={cn("grid size-16 place-items-center rounded-2xl", canComplete ? "bg-brand/10 text-brand" : "bg-secondary text-muted-foreground")}>
        <Rocket className="size-8" aria-hidden="true" />
      </span>
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold">{t("onboarding.steps.go_live.heading", "Ready to open your café")}</h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {canComplete
            ? t("onboarding.steps.go_live.ready", "The essentials are in place. Open your café and start taking orders — you can keep refining anytime.")
            : t("onboarding.steps.go_live.notReady", "Finish the required steps (branch, payments, a category and a menu item) to open your café.")}
        </p>
      </div>
      <Button size="lg" disabled={!canComplete || finishing} loading={finishing} onClick={onFinish}>
        <Icon as={Rocket} /> {t("onboarding.steps.go_live.cta", "Open my café")}
      </Button>
    </div>
  );
}

function Icon({ as: As }: { as: LucideIcon }) {
  return <As className="size-4" aria-hidden="true" />;
}
