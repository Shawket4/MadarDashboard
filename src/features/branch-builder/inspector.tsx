/**
 * The inspector: what is selected, and everything about it that can change.
 *
 * Docked beside the canvas like the floor's. It is also the way to do anything
 * the canvas does by dragging: every line can be made or removed here with a
 * checkbox or a select, so the builder works from a keyboard and a screen
 * reader (WCAG 2.2 "dragging movements").
 *
 * Nothing selected shows the branch itself: which of the four setups it is,
 * what still needs attention, and the categories no section claims.
 */
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CircleCheck, KeyRound, Loader2, Trash2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SegmentedControl } from "@/components/app/segmented-control";
import { getErrorMessage } from "@/data/api/errors";
import type { ActivationCode, PlanCategory } from "@/data/api/generated/models";
import { fmtStamp } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { cn } from "@/lib/utils";

import {
  addLink, parsePieceKey, pieceKey, removeLink, routeCategories, routeCategory, setDefaultSection, setupOf,
  unroutedCategories, type Connection, type PieceRef, type Plan, type PlanDevice, type PlanPrinter,
  type PlanSection, type Problem,
} from "./plan";
import { installKindFor, presenceOf, useSlotCode, type PlanRegisteredDevice } from "./api";
import {
  connectionLabel, deviceKindLabel, printerRoleLabel, problemText, setupLabel,
} from "./vocabulary";

export interface InspectorProps {
  branchId: string;
  plan: Plan;
  selection: Set<string>;
  editable: boolean;
  change: (edit: (plan: Plan) => Plan) => void;
  onSelect: (ref: PieceRef | null) => void;
  onRemove: (keys: Set<string>) => void;
  problems: Problem[];
  categories: PlanCategory[];
  registered: PlanRegisteredDevice[];
  /** Slots that exist on the server, i.e. that an activation code can name. */
  savedSlots: Set<string>;
  openItems: Map<string, number>;
  itemOverrides: Map<string, number>;
}

export function Inspector(props: InspectorProps) {
  const { plan, selection } = props;
  const keys = [...selection];
  if (keys.length === 0) return <BranchSummary {...props} />;
  if (keys.length > 1) return <ManySelected {...props} count={keys.length} />;
  const ref = parsePieceKey(keys[0]);
  if (ref.kind === "device") {
    const d = plan.devices.find((x) => x.id === ref.id);
    return d ? <DeviceInspector {...props} device={d} /> : null;
  }
  if (ref.kind === "printer") {
    const p = plan.printers.find((x) => x.id === ref.id);
    return p ? <PrinterInspector {...props} printer={p} /> : null;
  }
  const s = plan.sections.find((x) => x.id === ref.id);
  return s ? <SectionInspector {...props} section={s} /> : null;
}

// ── Building blocks ─────────────────────────────────────────────────────────

function Panel({ children }: { children: ReactNode }) {
  // Keep canvas shortcuts (arrows, Delete, ⌘Z) out of the fields in here.
  return (
    <div className="space-y-5 p-4" onKeyDown={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}

function Heading({ title, kind }: { title: string; kind: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground">{kind}</p>
      <h2 className="truncate text-base font-semibold">{title || "—"}</h2>
    </div>
  );
}

function Group({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</legend>
      {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
      {children}
    </fieldset>
  );
}

/** A text field that commits on blur or Enter, so one rename is one undo step. */
function CommitField({
  id, label, value, disabled, placeholder, inputMode, onCommit,
}: {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "decimal";
  onCommit: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commit = () => {
    if (draft !== value) onCommit(draft);
  };
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <Input
        id={id}
        value={draft}
        disabled={disabled}
        placeholder={placeholder}
        inputMode={inputMode}
        dir={inputMode ? "ltr" : undefined}
        className="h-9"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
        }}
      />
    </div>
  );
}

function CheckRow({
  id, checked, disabled, onChange, children, hint,
}: {
  id: string;
  checked: boolean | "indeterminate";
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-9 items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm",
        disabled ? "opacity-70" : "cursor-pointer hover:bg-accent",
      )}
    >
      <Checkbox id={id} checked={checked} disabled={disabled} onCheckedChange={(v) => onChange(v === true)} />
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint ? <span className="shrink-0 text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed px-3 py-2.5 text-xs text-muted-foreground">{children}</p>;
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button variant="outline" className="w-full gap-1.5 text-destructive hover:text-destructive" onClick={onClick}>
      <Trash2 className="size-4" />
      {label}
    </Button>
  );
}

const NONE = "__none__";

// ── Nothing selected: the branch ────────────────────────────────────────────

function BranchSummary({ plan, editable, change, onSelect, problems, categories }: InspectorProps) {
  const { t, i18n } = useTranslation();
  const setup = setupOf(plan);
  const unrouted = unroutedCategories(plan, categories.map((c) => c.id));
  const fallback = plan.sections.find((s) => s.is_default);

  return (
    <Panel>
      <Heading
        kind={t("builder.thisBranch", "This branch")}
        title={setup ? setupLabel(t, setup).title : t("builder.noSetup", "Nothing placed yet")}
      />
      {setup ? <p className="text-xs leading-relaxed text-muted-foreground">{setupLabel(t, setup).body}</p> : null}

      {plan.devices.some((d) => d.kind === "pos") ? (
        <Group label={t("builder.kitchenChits", "Kitchen chits")}>
          <label className="flex items-start gap-3 text-sm">
            <Switch
              checked={plan.till_prints_kitchen}
              disabled={!editable}
              onCheckedChange={(v) => change((p) => ({ ...p, till_prints_kitchen: v }))}
              aria-describedby="bb-till-chits-hint"
            />
            <span className="space-y-0.5">
              <span className="block font-medium">{t("builder.tillPrintsKitchen", "The till prints kitchen chits")}</span>
              <span id="bb-till-chits-hint" className="block text-xs text-muted-foreground">
                {plan.sections.length === 0
                  ? t("builder.tillPrintsKitchenHint", "Off: orders go nowhere but the receipt. On: each order also prints a chit for the kitchen on the till's printer.")
                  : t("builder.tillPrintsKitchenHintSections", "On: besides the kitchen's own screens and printers, the till prints a chit for each order too.")}
              </span>
            </span>
          </label>
        </Group>
      ) : null}

      <Group label={t("builder.checks", "Checks")}>
        {problems.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-[color-mix(in_oklab,var(--color-success)_60%,var(--color-foreground))]">
            <CircleCheck className="size-4" />
            {t("builder.allGood", "Every order has somewhere to go.")}
          </p>
        ) : (
          <ul className="space-y-1" aria-label={t("builder.checks", "Checks")}>
            {problems.map((p, i) => (
              <li key={`${p.code}:${p.piece?.id ?? i}`}>
                <button
                  type="button"
                  disabled={!p.piece}
                  onClick={() => onSelect(p.piece)}
                  className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-start text-sm hover:bg-accent disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <TriangleAlert
                    aria-hidden
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      p.blocking ? "text-destructive" : "text-[color-mix(in_oklab,var(--color-warning)_55%,var(--color-foreground))]",
                    )}
                  />
                  <span>
                    <span className="sr-only">
                      {p.blocking ? t("builder.mustFix", "Must fix before saving:") : t("builder.worthChecking", "Worth checking:")}{" "}
                    </span>
                    {problemText(t, plan, p)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Group>

      {plan.sections.length > 0 && unrouted.length > 0 ? (
        <Group
          label={t("builder.unrouted", "Categories in no section")}
          hint={t("builder.unroutedHint", "These go to {{name}}, the section that takes whatever no other section claims.", {
            name: fallback?.name ?? "—",
          })}
        >
          <ul className="flex flex-wrap gap-1.5">
            {unrouted.map((id) => {
              const c = categories.find((x) => x.id === id);
              return (
                <li key={id} className="rounded-full bg-secondary px-2.5 py-1 text-xs">
                  {getTranslatedName(c, i18n.language)}
                </li>
              );
            })}
          </ul>
        </Group>
      ) : null}

      {editable ? null : (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("builder.lockedHint", "Select a piece to see its details. Unlock to change the plan.")}
        </p>
      )}
    </Panel>
  );
}

function ManySelected({ count, editable, selection, onRemove }: InspectorProps & { count: number }) {
  const { t } = useTranslation();
  return (
    <Panel>
      <Heading kind={t("builder.selection", "Selection")} title={t("builder.piecesSelected", "{{count}} pieces", { count })} />
      <p className="text-xs text-muted-foreground">{t("builder.manyHint", "Drag any of them to move them together, or use the arrow keys.")}</p>
      {editable ? <RemoveButton label={t("builder.removePieces", "Remove from the plan")} onClick={() => onRemove(selection)} /> : null}
    </Panel>
  );
}

// ── A device ────────────────────────────────────────────────────────────────

function DeviceInspector({
  branchId, plan, device, editable, change, onRemove, registered, savedSlots,
}: InspectorProps & { device: PlanDevice }) {
  const { t } = useTranslation();
  const key = pieceKey({ kind: "device", id: device.id });
  const receiptPrinters = plan.printers.filter((p) => p.role === "receipt");
  const takenBy = new Map(plan.devices.filter((d) => d.device_id && d.id !== device.id).map((d) => [d.device_id!, d.name]));
  const compatible = registered.filter((r) => r.kind === installKindFor(device.kind));
  const registeredById = new Map(registered.map((r) => [r.id, r]));
  const { presence, seen } = presenceOf(device.device_id, registeredById, Date.now());

  return (
    <Panel>
      <Heading kind={deviceKindLabel(t, device.kind)} title={device.name} />
      <CommitField
        id="bb-device-name"
        label={t("builder.name", "Name")}
        value={device.name}
        disabled={!editable}
        onCommit={(name) => change((p) => ({ ...p, devices: p.devices.map((d) => (d.id === device.id ? { ...d, name } : d)) }))}
      />

      {device.kind === "pos" || device.kind === "waiter" ? (
        <Group label={t("builder.receipts", "Receipts print on")}>
          {receiptPrinters.length === 0 ? (
            <Empty>{t("builder.noReceiptPrinters", "No receipt printer in the plan yet. Add one from the toolbar.")}</Empty>
          ) : (
            <Select
              disabled={!editable}
              value={device.receipt_printer_id ?? NONE}
              onValueChange={(v) =>
                change((p) =>
                  v === NONE
                    ? { ...p, devices: p.devices.map((d) => (d.id === device.id ? { ...d, receipt_printer_id: null } : d)) }
                    : addLink(p, { kind: "device", id: device.id }, { kind: "printer", id: v }),
                )
              }
            >
              <SelectTrigger className="h-9 w-full" aria-label={t("builder.receipts", "Receipts print on")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("builder.noPrinter", "No printer")}</SelectItem>
                {receiptPrinters.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Group>
      ) : null}

      {device.kind === "kitchen" ? (
        <Group label={t("builder.showsSections", "Sections shown here")}>
          {plan.sections.length === 0 ? (
            <Empty>{t("builder.noSections", "No kitchen sections yet.")}</Empty>
          ) : (
            plan.sections.map((s) => (
              <CheckRow
                key={s.id}
                id={`bb-dev-${device.id}-${s.id}`}
                checked={s.screen_ids.includes(device.id)}
                disabled={!editable}
                onChange={(on) =>
                  change((p) =>
                    on
                      ? addLink(p, { kind: "section", id: s.id }, { kind: "device", id: device.id })
                      : removeLink(p, { kind: "shows", from: { kind: "section", id: s.id }, to: { kind: "device", id: device.id } }),
                  )
                }
              >
                {s.name}
              </CheckRow>
            ))
          )}
        </Group>
      ) : null}

      <Group
        label={t("builder.theDevice", "The device")}
        hint={t("builder.theDeviceHint", "The tablet or computer that fills this place. Give it a setup code, or pick one already registered here.")}
      >
        <p className="flex items-center gap-2 text-sm">
          <span
            aria-hidden
            className={cn(
              "size-2 rounded-full",
              presence === "online" && "bg-success",
              presence === "offline" && "bg-muted-foreground/60",
              presence === "unclaimed" && "border border-dashed border-muted-foreground",
            )}
          />
          {presence === "unclaimed"
            ? t("builder.notSetUp", "No device set up yet")
            : presence === "online"
              ? t("builder.onlineAs", "{{code}} · online", { code: seen?.label || seen?.code })
              : t("builder.lastSeen", "{{code}} · last seen {{when}}", { code: seen?.label || seen?.code, when: fmtStamp(seen?.last_seen_at) })}
        </p>
        {compatible.length > 0 ? (
          <Select
            disabled={!editable}
            value={device.device_id ?? NONE}
            onValueChange={(v) =>
              change((p) => ({
                ...p,
                devices: p.devices.map((d) => {
                  if (d.id === device.id) return { ...d, device_id: v === NONE ? null : v };
                  // One install fills one place: take it from wherever it was.
                  return v !== NONE && d.device_id === v ? { ...d, device_id: null } : d;
                }),
              }))
            }
          >
            <SelectTrigger className="h-9 w-full" aria-label={t("builder.assignDevice", "Registered device")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t("builder.noDevice", "None")}</SelectItem>
              {compatible.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label || r.code}
                  {takenBy.has(r.id) ? ` · ${t("builder.inPlace", "in {{name}}", { name: takenBy.get(r.id) })}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <SetupCode branchId={branchId} slotId={device.id} saved={savedSlots.has(device.id)} />
      </Group>

      {editable ? <RemoveButton label={t("builder.removePiece", "Remove from the plan")} onClick={() => onRemove(new Set([key]))} /> : null}
    </Panel>
  );
}

/** An 8-digit code the device types to take this place (BB-8). */
function SetupCode({ branchId, slotId, saved }: { branchId: string; slotId: string; saved: boolean }) {
  const { t } = useTranslation();
  const issue = useSlotCode();
  const [code, setCode] = useState<ActivationCode | null>(null);
  useEffect(() => setCode(null), [slotId]);

  if (!saved) {
    return <Empty>{t("builder.saveForCode", "Save the plan first; then this place can get a setup code.")}</Empty>;
  }
  if (code) {
    return (
      <div className="space-y-1 rounded-lg border bg-secondary/50 p-3">
        <p className="text-xs text-muted-foreground">{t("builder.codeFor", "On the device, enter")}</p>
        <p dir="ltr" className="font-mono text-2xl font-semibold tracking-[0.2em] tabular-nums" data-testid="slot-code">
          {code.code}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("builder.codeExpires", "Works once, until {{when}}.", { when: fmtStamp(code.expires_at) })}
        </p>
      </div>
    );
  }
  return (
    <Button
      variant="outline"
      className="w-full gap-1.5"
      disabled={issue.isPending}
      onClick={() =>
        issue.mutate(
          { data: { branch_id: branchId, slot_id: slotId } },
          { onSuccess: setCode, onError: (e) => toast.error(getErrorMessage(e)) },
        )
      }
    >
      {issue.isPending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
      {t("builder.getCode", "Get a setup code")}
    </Button>
  );
}

// ── A printer ───────────────────────────────────────────────────────────────

function PrinterInspector({ plan, printer, editable, change, onRemove }: InspectorProps & { printer: PlanPrinter }) {
  const { t } = useTranslation();
  const key = pieceKey({ kind: "printer", id: printer.id });
  const set = (patch: Partial<PlanPrinter>) =>
    change((p) => ({ ...p, printers: p.printers.map((x) => (x.id === printer.id ? { ...x, ...patch } : x)) }));
  const hosts = plan.devices;

  return (
    <Panel>
      <Heading kind={printerRoleLabel(t, printer.role)} title={printer.name} />
      <CommitField id="bb-printer-name" label={t("builder.name", "Name")} value={printer.name} disabled={!editable} onCommit={(name) => set({ name })} />

      <Group label={t("builder.connectsBy", "How it connects")}>
        <SegmentedControl<Connection>
          value={printer.connection}
          disabled={!editable}
          onChange={(connection) => set({ connection, port: connection === "network" ? printer.port ?? 9100 : null })}
          options={(["network", "usb", "bluetooth"] as const).map((c) => ({ value: c, label: connectionLabel(t, c) }))}
        />
        {printer.connection === "network" ? (
          <div className="grid grid-cols-[1fr_88px] gap-2">
            <CommitField
              id="bb-printer-ip"
              label={t("builder.ip", "IP address")}
              value={printer.ip ?? ""}
              placeholder="192.168.1.40"
              inputMode="decimal"
              disabled={!editable}
              onCommit={(ip) => set({ ip: ip.trim() || null })}
            />
            <CommitField
              id="bb-printer-port"
              label={t("builder.port", "Port")}
              value={String(printer.port ?? 9100)}
              inputMode="numeric"
              disabled={!editable}
              onCommit={(v) => {
                const n = Number.parseInt(v, 10);
                set({ port: Number.isFinite(n) && n >= 1 && n <= 65535 ? n : 9100 });
              }}
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t("builder.pluggedInto", "Plugged into")}</Label>
            <Select
              disabled={!editable}
              value={printer.host_device_id ?? NONE}
              onValueChange={(v) => set({ host_device_id: v === NONE ? null : v })}
            >
              <SelectTrigger className="h-9 w-full" aria-label={t("builder.pluggedInto", "Plugged into")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("builder.pickDevice", "Pick a device")}</SelectItem>
                {hosts.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </Group>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("builder.brand", "Brand")}</Label>
          <Select disabled={!editable} value={printer.brand ?? NONE} onValueChange={(v) => set({ brand: v === NONE ? null : v })}>
            <SelectTrigger className="h-9 w-full" aria-label={t("builder.brand", "Brand")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t("builder.brandOther", "Other")}</SelectItem>
              <SelectItem value="epson">Epson</SelectItem>
              <SelectItem value="star">Star</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("builder.paper", "Paper")}</Label>
          <SegmentedControl<"58" | "80">
            value={String(printer.paper_mm) as "58" | "80"}
            disabled={!editable}
            onChange={(v) => set({ paper_mm: Number(v) })}
            options={[
              { value: "58", label: t("builder.mm", "{{n}} mm", { n: 58 }) },
              { value: "80", label: t("builder.mm", "{{n}} mm", { n: 80 }) },
            ]}
          />
        </div>
      </div>

      {printer.role === "kitchen" ? (
        <Group label={t("builder.printsSections", "Sections printed here")}>
          {plan.sections.length === 0 ? (
            <Empty>{t("builder.noSections", "No kitchen sections yet.")}</Empty>
          ) : (
            plan.sections.map((s) => (
              <CheckRow
                key={s.id}
                id={`bb-prn-${printer.id}-${s.id}`}
                checked={s.printer_ids.includes(printer.id)}
                disabled={!editable}
                onChange={(on) =>
                  change((p) =>
                    on
                      ? addLink(p, { kind: "section", id: s.id }, { kind: "printer", id: printer.id })
                      : removeLink(p, { kind: "prints", from: { kind: "section", id: s.id }, to: { kind: "printer", id: printer.id } }),
                  )
                }
              >
                {s.name}
              </CheckRow>
            ))
          )}
        </Group>
      ) : (
        <Group label={t("builder.printsFor", "Prints receipts for")}>
          {plan.devices.filter((d) => d.kind === "pos" || d.kind === "waiter").map((d) => (
            <CheckRow
              key={d.id}
              id={`bb-rcpt-${printer.id}-${d.id}`}
              checked={d.receipt_printer_id === printer.id}
              disabled={!editable}
              onChange={(on) =>
                change((p) =>
                  on
                    ? addLink(p, { kind: "device", id: d.id }, { kind: "printer", id: printer.id })
                    : { ...p, devices: p.devices.map((x) => (x.id === d.id ? { ...x, receipt_printer_id: null } : x)) },
                )
              }
            >
              {d.name}
            </CheckRow>
          ))}
        </Group>
      )}

      {editable ? <RemoveButton label={t("builder.removePiece", "Remove from the plan")} onClick={() => onRemove(new Set([key]))} /> : null}
    </Panel>
  );
}

// ── A section ───────────────────────────────────────────────────────────────

function SectionInspector({
  plan, section, editable, change, onRemove, categories, openItems, itemOverrides,
}: InspectorProps & { section: PlanSection }) {
  const { t, i18n } = useTranslation();
  const key = pieceKey({ kind: "section", id: section.id });
  const screens = plan.devices.filter((d) => d.kind === "kitchen");
  const kitchenPrinters = plan.printers.filter((p) => p.role === "kitchen");
  const owner = new Map<string, string>();
  for (const s of plan.sections) for (const c of s.category_ids) owner.set(c, s.name);
  const cooking = openItems.get(section.id) ?? 0;
  const overrides = itemOverrides.get(section.id) ?? 0;

  return (
    <Panel>
      <Heading kind={t("builder.kind.section", "Kitchen section")} title={section.name} />
      <CommitField
        id="bb-section-name"
        label={t("builder.name", "Name")}
        value={section.name}
        disabled={!editable}
        onCommit={(name) => change((p) => ({ ...p, sections: p.sections.map((s) => (s.id === section.id ? { ...s, name } : s)) }))}
      />
      {cooking > 0 ? (
        <p className="flex items-start gap-2 rounded-lg bg-warning/14 px-3 py-2 text-xs text-[color-mix(in_oklab,var(--color-warning)_55%,var(--color-foreground))]">
          <TriangleAlert className="mt-px size-3.5 shrink-0" />
          {t("builder.cookingNow", "{{count}} items are cooking here now. The section can't be removed until they're done.", { count: cooking })}
        </p>
      ) : null}

      {/* Exactly one section is the catch-all, so this is a choice to MOVE the
          role here, never a switch that could turn it off everywhere. */}
      <div className="space-y-1.5 rounded-lg bg-secondary/60 px-3 py-2.5">
        {section.is_default ? (
          <p className="flex items-center gap-2 text-sm font-medium">
            <CircleCheck aria-hidden className="size-4 text-primary" />
            {t("builder.default", "Takes everything else")}
          </p>
        ) : editable ? (
          <Button size="sm" variant="outline" onClick={() => change((p) => setDefaultSection(p, section.id))}>
            {t("builder.makeDefault", "Make this the catch-all")}
          </Button>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {t("builder.defaultHint", "Items whose category is in no section come here. One section always does this.")}
        </p>
      </div>

      <Group label={t("builder.outputs", "Where its orders go")}>
        {screens.length === 0 && kitchenPrinters.length === 0 ? (
          <Empty>{t("builder.noOutputs", "Add a kitchen screen or a kitchen printer, then tick it here.")}</Empty>
        ) : null}
        {screens.map((d) => (
          <CheckRow
            key={d.id}
            id={`bb-sec-${section.id}-${d.id}`}
            checked={section.screen_ids.includes(d.id)}
            disabled={!editable}
            hint={t("builder.kind.kitchen", "Kitchen screen")}
            onChange={(on) =>
              change((p) =>
                on
                  ? addLink(p, { kind: "section", id: section.id }, { kind: "device", id: d.id })
                  : removeLink(p, { kind: "shows", from: { kind: "section", id: section.id }, to: { kind: "device", id: d.id } }),
              )
            }
          >
            {d.name}
          </CheckRow>
        ))}
        {kitchenPrinters.map((pr) => (
          <CheckRow
            key={pr.id}
            id={`bb-sec-${section.id}-${pr.id}`}
            checked={section.printer_ids.includes(pr.id)}
            disabled={!editable}
            hint={t("builder.kind.kitchenPrinter", "Kitchen printer")}
            onChange={(on) =>
              change((p) =>
                on
                  ? addLink(p, { kind: "section", id: section.id }, { kind: "printer", id: pr.id })
                  : removeLink(p, { kind: "prints", from: { kind: "section", id: section.id }, to: { kind: "printer", id: pr.id } }),
              )
            }
          >
            {pr.name}
          </CheckRow>
        ))}
      </Group>

      <Group
        label={t("builder.categories", "Categories cooked here")}
        hint={t("builder.categoriesHint", "A category belongs to one section. Ticking one here takes it from where it was.")}
      >
        {categories.length === 0 ? (
          <Empty>{t("builder.noCategories", "The menu has no categories yet.")}</Empty>
        ) : (
          <div className="max-h-72 space-y-0.5 overflow-y-auto">
            {(() => {
              const here = categories.filter((c) => section.category_ids.includes(c.id)).length;
              const all = here === categories.length;
              return (
                <div className="border-b pb-0.5">
                  <CheckRow
                    id={`bb-cat-${section.id}-all`}
                    checked={all ? true : here > 0 ? "indeterminate" : false}
                    disabled={!editable}
                    hint={t("builder.categoriesHere", "{{here}} of {{total}}", { here, total: categories.length })}
                    // Some or none ticked → take them all; all ticked → clear this section.
                    onChange={() =>
                      change((p) => routeCategories(p, categories.map((c) => c.id), all ? null : section.id))
                    }
                  >
                    <span className="font-medium">{t("builder.selectAll", "Select all")}</span>
                  </CheckRow>
                </div>
              );
            })()}
            {categories.map((c) => {
              const here = section.category_ids.includes(c.id);
              const elsewhere = !here ? owner.get(c.id) : undefined;
              return (
                <CheckRow
                  key={c.id}
                  id={`bb-cat-${section.id}-${c.id}`}
                  checked={here}
                  disabled={!editable}
                  hint={elsewhere ? t("builder.inSection", "in {{name}}", { name: elsewhere }) : undefined}
                  onChange={(on) => change((p) => routeCategory(p, c.id, on ? section.id : null))}
                >
                  {getTranslatedName(c, i18n.language)}
                </CheckRow>
              );
            })}
          </div>
        )}
        {overrides > 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("builder.itemOverrides", "{{count}} items are routed here one by one.", { count: overrides })}{" "}
            <Link to="/settings/kitchen-routing" className="font-medium text-foreground underline underline-offset-2">
              {t("builder.itemOverridesLink", "Item routing")}
            </Link>
          </p>
        ) : null}
      </Group>

      {editable ? <RemoveButton label={t("builder.removePiece", "Remove from the plan")} onClick={() => onRemove(new Set([key]))} /> : null}
    </Panel>
  );
}
