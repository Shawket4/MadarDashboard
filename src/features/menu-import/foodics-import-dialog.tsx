import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { AxiosError } from "axios";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useBulkMenu, useGetOrg } from "@/data/api/generated/api";
import type {
  BulkMenuRequest,
  BulkMenuResponse,
} from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { invalidateCatalog } from "@/features/menu/util";
import { fmtMoney } from "@/lib/format";
import { menuRules } from "@/lib/rules/menu";
import type {
  BulkRefusal,
  FoodicsFile,
  FoodicsParsed,
  MenuRules,
} from "@/lib/rules/menu";
import { SwapPresence, recipes } from "@/lib/motion";

import {
  FOODICS_FILES,
  byCategory,
  fileLabel,
  isRefusal,
  readFoodicsFiles,
  refusalMessage,
  warningMessage,
  warningPlace,
  type ImportMode,
} from "./util";

interface Props {
  orgId: string;
  /** What the owner asked for: add into an empty menu, or replace the menu. */
  mode: ImportMode;
  /** May the person replace a menu (delete categories and items)? */
  canReplace: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** After a real import: the onboarding checklist re-reads. */
  onImported: () => void;
}

/** State colours as TEXT need the AA mix (CLAUDE.md, "Colour and contrast"). */
const TEXT = {
  bad: "text-[color-mix(in_oklab,var(--color-destructive)_50%,var(--color-foreground))]",
  warn: "text-[color-mix(in_oklab,var(--color-warning)_50%,var(--color-foreground))]",
  good: "text-[color-mix(in_oklab,var(--color-success)_50%,var(--color-foreground))]",
};

/** A warning list this long is read in the export, not here. */
const WARNINGS_SHOWN = 50;

type Check =
  | { state: "idle" | "checking" }
  | { state: "ok"; answer: BulkMenuResponse }
  | { state: "refused"; message: string; notEmpty: boolean };

export function FoodicsImportDialog({
  orgId,
  mode: asked,
  canReplace,
  open,
  onOpenChange,
  onImported,
}: Props) {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<ImportMode>(asked);
  const [parsed, setParsed] = useState<FoodicsParsed | null>(null);
  const [names, setNames] = useState<Map<FoodicsFile, string>>(new Map());
  const [readError, setReadError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [check, setCheck] = useState<Check>({ state: "idle" });
  // The reader's own wasm package, fetched when the dialog first opens.
  const [menu, setMenu] = useState<MenuRules | null>(null);
  const orgName =
    useGetOrg(orgId, { query: { enabled: open && !!orgId } }).data?.name ?? "";

  useEffect(() => {
    if (open) {
      setMode(asked);
      setParsed(null);
      setReadError(null);
      setCheck({ state: "idle" });
      // Warm it up; a failure is said when the files are picked.
      menuRules().then(setMenu, () => {});
    }
  }, [open, asked]);

  // The server's own checks before the owner commits (the same rules run here).
  const verdict = useMemo(
    () => (parsed && menu ? menu.bulk_validate(parsed.menu) : null),
    [parsed, menu],
  );
  const refusal: BulkRefusal | null =
    verdict && isRefusal(verdict) ? verdict : null;

  const body = (confirm?: string): BulkMenuRequest => ({
    menu: parsed!.menu as BulkMenuRequest["menu"],
    mode,
    ...(confirm ? { confirm } : {}),
  });

  const dryRun = useBulkMenu({
    mutation: {
      onSuccess: (answer) => setCheck({ state: "ok", answer }),
      onError: (e) =>
        setCheck({
          state: "refused",
          message: serverMessage(e),
          notEmpty: codeOf(e) === "MENU_NOT_EMPTY",
        }),
    },
  });
  const write = useBulkMenu({
    mutation: {
      onSuccess: (answer) => {
        toast.success(
          t("menuImport.done", {
            count: answer.summary.items,
            defaultValue: `${answer.summary.items} items imported.`,
          }),
        );
        void invalidateCatalog();
        onImported();
        onOpenChange(false);
      },
      onError: (e) => toast.error(serverMessage(e)),
    },
  });

  // A refusal the shared checks name reads in the person's language.
  const serverMessage = (e: unknown): string => {
    const vars =
      e instanceof AxiosError
        ? (e.response?.data as { vars?: unknown } | undefined)?.vars
        : undefined;
    if (
      codeOf(e)?.startsWith("BULK_MENU_") &&
      vars &&
      typeof vars === "object" &&
      "refusal" in vars
    )
      return refusalMessage(vars as BulkRefusal, t);
    return getErrorMessage(e);
  };

  // Ask the server once the files read clean, and again when the mode changes.
  useEffect(() => {
    if (!parsed || !menu || refusal) return;
    setCheck({ state: "checking" });
    dryRun.mutate({ data: body(), params: { dry_run: true } });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-check on new files or a new mode only
  }, [parsed, menu, refusal, mode]);

  const pick = async (list: FileList | null) => {
    if (!list?.length) return;
    setReading(true);
    setReadError(null);
    let loaded: MenuRules;
    try {
      loaded = await menuRules();
    } catch {
      setReading(false);
      setParsed(null);
      setReadError(
        t(
          "menuImport.errors.loadFailed",
          "The import could not load. Check the connection and try again.",
        ),
      );
      return;
    }
    setMenu(loaded);
    const result = await readFoodicsFiles(Array.from(list), loaded, t);
    setReading(false);
    if (result.ok) {
      setParsed(result.parsed);
      setNames(result.names);
    } else {
      setParsed(null);
      setReadError(result.message);
    }
  };

  const schema = useMemo(
    () =>
      z.object({
        sentence: z
          .string()
          .refine(
            (v) => !!menu && menu.confirms_replace(orgName, v),
            t(
              "menuImport.replace.mismatch",
              "Type the sentence exactly as shown.",
            ),
          ),
      }),
    [orgName, t, menu],
  );
  type Values = z.infer<typeof schema>;
  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { sentence: "" },
  });
  useEffect(() => {
    if (open) form.reset({ sentence: "" });
  }, [open, form]);

  const sentence = menu
    ? menu.replace_sentence(orgName, i18n.language === "ar" ? "ar" : "en")
    : "";
  const ready = check.state === "ok" && !refusal && !write.isPending;
  const submit = (v?: Values) => write.mutate({ data: body(v?.sentence) });

  const stage = parsed ? "preview" : "pick";

  // Right under the server's verdict: on a phone the menu below runs long.
  const confirm =
    mode === "replace" && check.state === "ok" ? (
      <Form {...form}>
        <form
          id="foodics-replace"
          onSubmit={form.handleSubmit(submit)}
          className="scroll-mb-28 space-y-2 rounded-xl border border-destructive/30 p-4"
        >
          <p className="text-sm">
            {t("menuImport.replace.warn", {
              categories: check.answer.archived?.categories ?? 0,
              items: check.answer.archived?.items ?? 0,
              defaultValue:
                "This puts away the menu there is now. Past orders and reports keep it.",
            })}
          </p>
          <FormField
            control={form.control}
            name="sentence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("menuImport.replace.type", "To confirm, type:")}{" "}
                  <span
                    className="font-semibold"
                    data-testid="replace-sentence"
                  >
                    {sentence}
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    autoComplete="off"
                    className="scroll-mb-28"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "replace"
              ? t(
                  "menuImport.replaceTitle",
                  "Replace your menu with a Foodics export",
                )
              : t("menuImport.title", "Import your menu from Foodics")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "menuImport.hint",
              "Your files are read on this device. Nothing is saved until you confirm, and only the menu is sent to Madar.",
            )}
          </DialogDescription>
        </DialogHeader>

        <SwapPresence
          swapKey={stage}
          recipe={recipes.rise("brand")}
          initial={false}
        >
          {stage === "pick" ? (
            <div className="space-y-5">
              <div className="space-y-2 text-sm">
                <p className="font-medium">
                  {t("menuImport.howTitle", "In the Foodics console")}
                </p>
                <ol className="list-decimal space-y-1 ps-5 text-muted-foreground">
                  <li>
                    {t(
                      "menuImport.how1",
                      "Sign in as a user who can manage the menu (the owner can).",
                    )}
                  </li>
                  <li>
                    {t(
                      "menuImport.how2",
                      "Open Menu, then each list below, then Import/Export, then Export.",
                    )}
                  </li>
                  <li>
                    {t(
                      "menuImport.how3",
                      "Choose all the downloaded files here at once.",
                    )}
                  </li>
                </ol>
                <ul
                  className="flex flex-wrap gap-2 pt-1"
                  aria-label={t("menuImport.filesLabel", "The exports")}
                >
                  {FOODICS_FILES.map((f) => (
                    <li
                      key={f}
                      className="rounded-full border border-border px-3 py-1 text-xs"
                    >
                      {fileLabel(f, t)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1">
                <Label htmlFor="foodics-files">
                  {t("menuImport.choose", "Foodics export files (.csv)")}
                </Label>
                <Input
                  id="foodics-files"
                  type="file"
                  multiple
                  accept=".csv,text/csv"
                  disabled={reading}
                  onChange={(e) => void pick(e.target.files)}
                />
              </div>
              {readError ? (
                <p
                  role="alert"
                  className={`flex items-start gap-2 rounded-md border border-destructive/40 px-3 py-2 text-sm ${TEXT.bad}`}
                >
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  {readError}
                </p>
              ) : null}
            </div>
          ) : (
            <Preview
              parsed={parsed!}
              names={names}
              refusal={refusal}
              check={check}
              mode={mode}
              canReplace={canReplace}
              onReplace={() => setMode("replace")}
              onOther={write.isPending ? undefined : () => setParsed(null)}
              confirm={confirm}
            />
          )}
        </SwapPresence>

        {/* Stays in view while a long preview scrolls under it; -bottom-6 sits it on the edge, past the dialog padding sticky offsets are measured inside. */}
        <DialogFooter className="sticky -bottom-6 -mx-6 -mb-6 flex-row justify-end border-t border-border bg-background px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          {stage === "preview" ? (
            mode === "replace" ? (
              <Button
                type="submit"
                form="foodics-replace"
                variant="destructive"
                disabled={!ready || !form.formState.isValid}
                loading={write.isPending}
              >
                {t("menuImport.replace.run", "Replace the menu")}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => submit()}
                disabled={!ready}
                loading={write.isPending}
              >
                <Upload className="size-4" />
                {t("menuImport.run", "Import the menu")}
              </Button>
            )
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function codeOf(e: unknown): string | undefined {
  const code =
    e instanceof AxiosError
      ? (e.response?.data as { code?: unknown } | undefined)?.code
      : undefined;
  return typeof code === "string" ? code : undefined;
}

function Preview({
  parsed,
  names,
  refusal,
  check,
  mode,
  canReplace,
  onReplace,
  onOther,
  confirm,
}: {
  parsed: FoodicsParsed;
  names: Map<FoodicsFile, string>;
  refusal: BulkRefusal | null;
  check: Check;
  mode: ImportMode;
  canReplace: boolean;
  onReplace: () => void;
  /** Back to choosing files; absent while the import runs. */
  onOther?: () => void;
  /** The replace confirmation, shown under the verdict. */
  confirm: ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const arabic = i18n.language === "ar";
  const { menu, warnings } = parsed;
  // The reader fills every list; the type allows them out (the server's JSON may).
  const items = menu.items ?? [];
  const groups = menu.groups ?? [];
  const sizes = items.reduce((n, i) => n + (i.sizes?.length ?? 0), 0);
  const options = groups.reduce((n, g) => n + g.options.length, 0);
  const counts: [string, number][] = [
    [
      t("menuImport.count.categories", "Categories"),
      menu.categories?.length ?? 0,
    ],
    [t("menuImport.count.items", "Items"), items.length],
    [t("menuImport.count.sizes", "Sizes"), sizes],
    [t("menuImport.count.groups", "Choice groups"), groups.length],
    [t("menuImport.count.options", "Choices"), options],
  ];

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
        {counts.map(([label, n]) => (
          <div
            key={label}
            className="rounded-lg border border-border px-3 py-2"
          >
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-lg font-semibold tabular-nums">{n}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <ul
          className="min-w-0 space-y-1 text-sm"
          aria-label={t("menuImport.filesRead", "Files read")}
        >
          {[...names.entries()].map(([kind, name]) => (
            <li key={kind} className="flex items-center gap-2">
              <FileSpreadsheet
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="font-medium">{fileLabel(kind, t)}</span>
              <span className="truncate text-muted-foreground" dir="ltr">
                {name}
              </span>
            </li>
          ))}
        </ul>
        {onOther ? (
          <Button type="button" size="sm" variant="ghost" onClick={onOther}>
            {t("menuImport.other", "Choose other files")}
          </Button>
        ) : null}
      </div>

      {refusal ? (
        <p
          role="alert"
          className={`rounded-md border border-destructive/40 px-3 py-2 text-sm ${TEXT.bad}`}
        >
          {refusalMessage(refusal, t)}
        </p>
      ) : (
        <>
          <Verdict
            check={check}
            mode={mode}
            canReplace={canReplace}
            onReplace={onReplace}
          />
          {confirm}
        </>
      )}

      {warnings.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-sm font-medium">
            {t("menuImport.warnings", {
              count: warnings.length,
              defaultValue: `${warnings.length} things to check`,
            })}
          </h3>
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-3 text-sm">
            {warnings.slice(0, WARNINGS_SHOWN).map((w, i) => {
              const place = warningPlace(w, t);
              return (
                <li key={i} className="flex gap-2">
                  <AlertTriangle
                    className={`mt-0.5 size-4 shrink-0 ${TEXT.warn}`}
                    aria-hidden="true"
                  />
                  <span>
                    {warningMessage(w, t)}
                    {place ? (
                      <span className="text-muted-foreground"> · {place}</span>
                    ) : null}
                  </span>
                </li>
              );
            })}
            {warnings.length > WARNINGS_SHOWN ? (
              <li className="text-muted-foreground">
                {t("menuImport.moreWarnings", {
                  count: warnings.length - WARNINGS_SHOWN,
                  defaultValue: "and more",
                })}
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <section className="space-y-2">
        <h3 className="text-sm font-medium">
          {t("menuImport.preview", "Your menu")}
        </h3>
        <div className="max-h-72 space-y-4 overflow-y-auto rounded-md border border-border p-3 text-sm">
          {byCategory(menu).map((c) => (
            <div key={c.name}>
              <p className="mb-1 font-semibold">{c.name}</p>
              <ul className="space-y-1">
                {c.items.map((item) => (
                  <li
                    key={item.name}
                    className="flex flex-wrap items-baseline justify-between gap-x-3"
                  >
                    <span
                      className={
                        item.is_active
                          ? undefined
                          : "text-muted-foreground line-through"
                      }
                    >
                      {arabic && item.name_ar ? item.name_ar : item.name}
                      {item.name_ar ? (
                        <span className="text-muted-foreground">
                          {" "}
                          · {arabic ? item.name : item.name_ar}
                        </span>
                      ) : null}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {item.sizes?.length
                        ? item.sizes
                            .map((s) => `${s.label} ${fmtMoney(s.price)}`)
                            .join(" · ")
                        : fmtMoney(item.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Verdict({
  check,
  mode,
  canReplace,
  onReplace,
}: {
  check: Check;
  mode: ImportMode;
  canReplace: boolean;
  onReplace: () => void;
}) {
  const { t } = useTranslation();
  if (check.state === "checking" || check.state === "idle")
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {t("menuImport.checking", "Checking with Madar…")}
      </p>
    );
  if (check.state === "refused")
    return (
      <div
        role="alert"
        className={`space-y-2 rounded-md border border-destructive/40 px-3 py-2 text-sm ${TEXT.bad}`}
      >
        <p>{check.message}</p>
        {check.notEmpty && mode === "add" && canReplace ? (
          <Button size="sm" variant="outline" onClick={onReplace}>
            {t("menuImport.switchToReplace", "Replace the menu instead")}
          </Button>
        ) : null}
      </div>
    );
  return (
    <p role="status" className={`flex items-center gap-2 text-sm ${TEXT.good}`}>
      <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
      {t("menuImport.ready", "Madar checked this menu: it is ready to import.")}
    </p>
  );
}
