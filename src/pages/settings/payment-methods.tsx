import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, Pencil, } from "lucide-react";
import { PageShell } from "@/shared/ui/page-shell";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { usePaymentMethods } from "@/shared/hooks/use-payment-methods";
import { DataTable } from "@/shared/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { OrgPaymentMethod } from "@/shared/api/generated/models";
import { 
  useCreatePaymentMethod, 
  useUpdatePaymentMethod,
  useActivatePaymentMethod,
  useDeactivatePaymentMethod
} from "@/shared/api/generated/api";
import { queryClient } from "@/shared/api/query";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/api/errors";


// Shared color options array using semantic tokens
const COLOR_OPTIONS = [
  { value: "slate", class: "bg-slate-500" },
  { value: "gray", class: "bg-gray-500" },
  { value: "zinc", class: "bg-zinc-500" },
  { value: "neutral", class: "bg-neutral-500" },
  { value: "stone", class: "bg-stone-500" },
  { value: "red", class: "bg-red-500" },
  { value: "orange", class: "bg-orange-500" },
  { value: "amber", class: "bg-amber-500" },
  { value: "yellow", class: "bg-yellow-500" },
  { value: "lime", class: "bg-lime-500" },
  { value: "green", class: "bg-green-500" },
  { value: "emerald", class: "bg-emerald-500" },
  { value: "teal", class: "bg-teal-500" },
  { value: "cyan", class: "bg-cyan-500" },
  { value: "sky", class: "bg-sky-500" },
  { value: "blue", class: "bg-blue-500" },
  { value: "indigo", class: "bg-indigo-500" },
  { value: "violet", class: "bg-violet-500" },
  { value: "purple", class: "bg-purple-500" },
  { value: "fuchsia", class: "bg-fuchsia-500" },
  { value: "pink", class: "bg-pink-500" },
  { value: "rose", class: "bg-rose-500" },
];

export default function PaymentMethodsPage() {
  const { t } = useTranslation();
  const { orgId } = useCurrentContext();
  const { methods, activeMethods, isLoading, getLabel, colorMap } = usePaymentMethods();
  
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<OrgPaymentMethod | null>(null);


  const activateMut = useActivatePaymentMethod({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/v1/payment-methods", orgId] }),
    },
  });

  const deactivateMut = useDeactivatePaymentMethod({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/v1/payment-methods", orgId] }),
    },
  });

  const toggleStatus = (id: string, current: boolean) => {
    if (current) {
      deactivateMut.mutate({ id });
    } else {
      activateMut.mutate({ id });
    }
  };

  const isSystemMethod = (pm: OrgPaymentMethod) => ["cash", "card", "digital_wallet", "mixed", "talabat_online", "talabat_cash"].includes(pm.name);

  const cols: ColumnDef<OrgPaymentMethod>[] = [
    {
      accessorKey: "name",
      header: t("common.name"),
      cell: ({ row }: { row: { original: OrgPaymentMethod } }) => {
        const pm = row.original;
        const color = colorMap[pm.name] || "#ccc";
        return (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="font-semibold text-sm">{getLabel(pm.name)}</span>
            {isSystemMethod(pm) && <Badge variant="outline" className="text-[10px] uppercase">System</Badge>}
          </div>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: t("common.status"),
      cell: ({ row }: { row: { original: OrgPaymentMethod } }) => (
        <Switch
          checked={row.original.is_active}
          onCheckedChange={() => toggleStatus(row.original.id, row.original.is_active)}
          disabled={activateMut.isPending || deactivateMut.isPending}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: { row: { original: OrgPaymentMethod } }) => (
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="iconSm" onClick={() => { setEditingMethod(row.original); setFormOpen(true); }}>
            <Pencil size={14} />
          </Button>
        </div>
      ),
    },
  ];

  const filtered = useMemo(() => {
    if (!search) return methods;
    const s = search.toLowerCase();
    return methods.filter((m) => getLabel(m.name).toLowerCase().includes(s) || m.name.toLowerCase().includes(s));
  }, [methods, search, getLabel]);

  return (
    <PageShell
      title={t("settings.paymentMethods")}
      description={t("settings.paymentMethodsHint")}
      action={
        <Button onClick={() => { setEditingMethod(null); setFormOpen(true); }}>
          <Plus /> {t("common.add")}
        </Button>
      }
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("common.search")}
                className="pl-8"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {activeMethods.length} {t("common.active")} / {methods.length} {t("common.total")}
            </div>
          </CardContent>
        </Card>

        <DataTable
          columns={cols}
          data={filtered}
          isLoading={isLoading}
          
        />
      </div>

      <PaymentMethodForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingMethod(null); }}
        method={editingMethod}
        orgId={orgId ?? ""}
      />
    </PageShell>
  );
}

function PaymentMethodForm({
  open,
  onClose,
  method,
  orgId,
}: {
  open: boolean;
  onClose: () => void;
  method: OrgPaymentMethod | null;
  orgId: string;
}) {
  const { t } = useTranslation();

  const [name, setName] = useState(method?.name || "");
  const [labelEn, setLabelEn] = useState("");
  const [labelAr, setLabelAr] = useState("");
  const [color, setColor] = useState(method?.color || "blue");
  
  // Update state when method changes
  useMemo(() => {
    if (open) {
      setName(method?.name || "");
      const trans = method?.label_translations as Record<string, string> | undefined;
      setLabelEn(trans?.en || "");
      setLabelAr(trans?.ar || "");
      setColor(method?.color || "blue");
    }
  }, [open, method]);

  const createMut = useCreatePaymentMethod();
  const updateMut = useUpdatePaymentMethod();

  const isPending = createMut.isPending || updateMut.isPending;
  const isSystem = method ? ["cash", "card", "digital_wallet", "mixed", "talabat_online", "talabat_cash"].includes(method.name) : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !labelEn) {
      toast.error(t("common.requiredField"));
      return;
    }

    const payload = {
      org_id: orgId,
      name,
      label_translations: { en: labelEn, ar: labelAr || labelEn },
      color,
      icon: method ? method.icon : "payments_outlined",
      is_cash: method ? method.is_cash : false,
      is_active: method ? method.is_active : true,
    };

    if (method) {
      updateMut.mutate({ id: method.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/v1/payment-methods", orgId] });
          toast.success(t("common.saved"));
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      });
    } else {
      createMut.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/v1/payment-methods", orgId] });
          toast.success(t("common.saved"));
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{method ? t("common.edit") : t("common.add")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold">{t("common.name")} (ID)</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
              placeholder="e.g. visa_card"
              disabled={!!isSystem}
              required
            />
            {isSystem && <p className="text-xs text-muted-foreground">System method IDs cannot be changed.</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Label (English)</label>
              <Input
                value={labelEn}
                onChange={(e) => setLabelEn(e.target.value)}
                placeholder="e.g. Visa Card"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Label (Arabic)</label>
              <Input
                value={labelAr}
                onChange={(e) => setLabelAr(e.target.value)}
                placeholder="e.g. فيزا"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Color Theme</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-6 h-6 rounded-full transition-all ${c.class} ${color === c.value ? "ring-2 ring-offset-1 ring-primary scale-110" : "hover:scale-110"}`}
                  aria-label={c.value}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isPending}>{t("common.save")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
