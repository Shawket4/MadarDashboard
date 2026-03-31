#!/usr/bin/env bash
# =============================================================================
#  Rue POS — React dashboard patch
#  Adds: Discounts page (CRUD) + Orders page (with new fields)
#  Updates: App.tsx router + Sidebar.tsx nav
#  Run from the root of the React project (where package.json lives)
# =============================================================================
set -e

echo "=== Rue POS — React dashboard patch ==="

# ─────────────────────────────────────────────────────────────────────────────
# 1. Add Discount type to types/index.ts
# ─────────────────────────────────────────────────────────────────────────────
python3 - << 'PYEOF'
import pathlib

path = pathlib.Path("src/types/index.ts")
src  = path.read_text()

discount_type = '''
// ── Discounts ─────────────────────────────────────────────────────────────────
export interface Discount {
  id:         string;
  org_id:     string;
  name:       string;
  dtype:      "percentage" | "fixed";
  value:      number;
  is_active:  boolean;
  created_at: string;
  updated_at: string;
}
'''

if "Discount" not in src:
    # Insert before the last export
    src = src + "\n" + discount_type
    path.write_text(src)
    print("types/index.ts: Discount type added")
else:
    print("types/index.ts: Discount type already present, skipping")
PYEOF

echo "✓ types/index.ts"

# ─────────────────────────────────────────────────────────────────────────────
# 2. Add discounts API
# ─────────────────────────────────────────────────────────────────────────────
cat > src/api/discounts.ts << 'EOF'
import client from "@/lib/client";
import type { Discount } from "@/types";

export const getDiscounts    = (orgId: string) =>
  client.get<Discount[]>("/discounts", { params: { org_id: orgId } });

export const createDiscount  = (data: {
  org_id: string; name: string; dtype: string; value: number; is_active?: boolean;
}) => client.post<Discount>("/discounts", data);

export const updateDiscount  = (id: string, data: {
  name?: string; dtype?: string; value?: number; is_active?: boolean;
}) => client.patch<Discount>(`/discounts/${id}`, data);

export const deleteDiscount  = (id: string) =>
  client.delete(`/discounts/${id}`);
EOF

echo "✓ src/api/discounts.ts"

# ─────────────────────────────────────────────────────────────────────────────
# 3. Create Discounts page
# ─────────────────────────────────────────────────────────────────────────────
mkdir -p src/pages/discounts

cat > src/pages/discounts/Discounts.tsx << 'EOF'
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, Tag, Edit2, Trash2, CheckCircle, XCircle, Percent, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { PageShell, Card } from "@/components/ui/page-shell";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import * as discountsApi from "@/api/discounts";
import { getErrorMessage } from "@/lib/client";
import { useAuthStore } from "@/store/auth";
import { useAppStore } from "@/store/app";
import { egp } from "@/utils/format";
import type { Discount } from "@/types";

// ── Form dialog ───────────────────────────────────────────────────────────────
function DiscountFormDialog({
  open, onClose, orgId, editDiscount,
}: {
  open:          boolean;
  onClose:       () => void;
  orgId:         string;
  editDiscount?: Discount | null;
}) {
  const qc = useQueryClient();
  const [name,      setName]      = useState(editDiscount?.name  ?? "");
  const [dtype,     setDtype]     = useState<"percentage" | "fixed">(
    (editDiscount?.dtype as "percentage" | "fixed") ?? "percentage"
  );
  const [value,     setValue]     = useState(
    editDiscount ? String(editDiscount.dtype === "percentage"
      ? editDiscount.value
      : editDiscount.value / 100)
    : ""
  );
  const [isActive,  setIsActive]  = useState(editDiscount?.is_active ?? true);

  React.useEffect(() => {
    if (editDiscount) {
      setName(editDiscount.name);
      setDtype(editDiscount.dtype as "percentage" | "fixed");
      setValue(editDiscount.dtype === "percentage"
        ? String(editDiscount.value)
        : String(editDiscount.value / 100));
      setIsActive(editDiscount.is_active);
    } else {
      setName(""); setDtype("percentage"); setValue(""); setIsActive(true);
    }
  }, [editDiscount, open]);

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      // value stored as integer: % direct, fixed as piastres
      const intValue = dtype === "percentage"
        ? parseInt(value, 10)
        : Math.round(parseFloat(value) * 100);

      const payload = { org_id: orgId, name, dtype, value: intValue, is_active: isActive };
      return editDiscount
        ? discountsApi.updateDiscount(editDiscount.id, { name, dtype, value: intValue, is_active: isActive })
        : discountsApi.createDiscount(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discounts"] });
      toast.success(editDiscount ? "Discount updated" : "Discount created");
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const displayValue = dtype === "percentage"
    ? `${value}% off`
    : value ? `EGP ${parseFloat(value).toFixed(0)} off` : "";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editDiscount ? "Edit Discount" : "New Discount"}</DialogTitle>
          <DialogDescription>
            {editDiscount ? "Update this discount preset." : "Create a reusable discount for tellers to apply at checkout."}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-4 space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>Discount Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Staff Discount, Promo 10%"
            />
          </div>

          {/* Type + Value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={dtype} onValueChange={(v) => setDtype(v as "percentage" | "fixed")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">
                    <span className="flex items-center gap-2"><Percent size={13} /> Percentage</span>
                  </SelectItem>
                  <SelectItem value="fixed">
                    <span className="flex items-center gap-2"><DollarSign size={13} /> Fixed Amount</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{dtype === "percentage" ? "Percentage (%)" : "Amount (EGP)"}</Label>
              <Input
                type="number"
                step={dtype === "percentage" ? "1" : "0.5"}
                min="0"
                max={dtype === "percentage" ? "100" : undefined}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={dtype === "percentage" ? "e.g. 10" : "e.g. 5.00"}
              />
            </div>
          </div>

          {/* Preview */}
          {displayValue && (
            <div className="bg-accent rounded-xl px-4 py-3 flex items-center gap-3">
              <Tag size={15} className="text-accent-foreground flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">{name || "Discount"}</p>
                <p className="text-xs text-muted-foreground">{displayValue}</p>
              </div>
            </div>
          )}

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-xl bg-muted p-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">Inactive discounts won't appear in the POS app</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            loading={isPending}
            onClick={() => mutate()}
            disabled={!name || !value}
          >
            {editDiscount ? "Save Changes" : "Create Discount"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Discounts page ───────────────────────────────────────────────────────
export default function Discounts() {
  const [formOpen,      setFormOpen]      = useState(false);
  const [editDiscount,  setEditDiscount]  = useState<Discount | null>(null);

  const qc         = useQueryClient();
  const authUser   = useAuthStore((s) => s.user);
  const selectedOrg = useAppStore((s) => s.selectedOrgId);
  const orgId      = selectedOrg ?? authUser?.org_id ?? "";

  const { data: discounts = [], isLoading } = useQuery({
    queryKey: ["discounts", orgId],
    queryFn:  () => discountsApi.getDiscounts(orgId).then((r) => r.data),
    enabled:  !!orgId,
  });

  const { mutate: del } = useMutation({
    mutationFn: (id: string) => discountsApi.deleteDiscount(id),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ["discounts"] }); toast.success("Discount deleted"); },
    onError:    (e) => toast.error(getErrorMessage(e)),
  });

  const { mutate: toggleActive } = useMutation({
    mutationFn: (d: Discount) =>
      discountsApi.updateDiscount(d.id, { is_active: !d.is_active }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["discounts"] }),
    onError:    (e) => toast.error(getErrorMessage(e)),
  });

  const columns: ColumnDef<Discount>[] = [
    {
      accessorKey: "name",
      header:      "Discount",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            row.original.dtype === "percentage"
              ? "bg-violet-100 dark:bg-violet-950/50"
              : "bg-green-100 dark:bg-green-950/50"
          }`}>
            {row.original.dtype === "percentage"
              ? <Percent size={15} className="text-violet-600" />
              : <DollarSign size={15} className="text-green-600" />}
          </div>
          <div>
            <p className="font-semibold text-sm">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.dtype === "percentage"
                ? `${row.original.value}% off subtotal`
                : `${egp(row.original.value)} off subtotal`}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "dtype",
      header:      "Type",
      cell: ({ row }) => (
        <Badge variant={row.original.dtype === "percentage" ? "info" : "success"}>
          {row.original.dtype === "percentage" ? "Percentage" : "Fixed Amount"}
        </Badge>
      ),
    },
    {
      accessorKey: "value",
      header:      "Value",
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums text-sm">
          {row.original.dtype === "percentage"
            ? `${row.original.value}%`
            : egp(row.original.value)}
        </span>
      ),
    },
    {
      accessorKey: "is_active",
      header:      "Status",
      cell: ({ row }) => (
        <button onClick={(e) => { e.stopPropagation(); toggleActive(row.original); }}>
          {row.original.is_active
            ? <Badge variant="success"><CheckCircle size={11} /> Active</Badge>
            : <Badge variant="outline"><XCircle size={11} /> Inactive</Badge>}
        </button>
      ),
    },
    {
      id:     "actions",
      header: "",
      cell:   ({ row }) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost" size="icon-sm"
            onClick={() => { setEditDiscount(row.original); setFormOpen(true); }}
          >
            <Edit2 size={13} />
          </Button>
          <Button
            variant="ghost" size="icon-sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm(`Delete "${row.original.name}"?`)) del(row.original.id);
            }}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      ),
    },
  ];

  const active   = discounts.filter((d) => d.is_active).length;
  const inactive = discounts.filter((d) => !d.is_active).length;
  const pct      = discounts.filter((d) => d.dtype === "percentage").length;
  const fixed    = discounts.filter((d) => d.dtype === "fixed").length;

  return (
    <PageShell
      title="Discounts"
      description="Manage discount presets available to tellers at checkout"
      action={
        <Button onClick={() => { setEditDiscount(null); setFormOpen(true); }}>
          <Plus size={15} /> New Discount
        </Button>
      }
    >
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",       value: discounts.length, color: "text-primary"    },
          { label: "Active",      value: active,           color: "text-green-600"  },
          { label: "Percentage",  value: pct,              color: "text-violet-600" },
          { label: "Fixed",       value: fixed,            color: "text-amber-600"  },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-4">
            <p className={`text-2xl font-extrabold ${color}`}>{isLoading ? "—" : value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </Card>
        ))}
      </div>

      {discounts.length === 0 && !isLoading ? (
        <div className="rounded-2xl border bg-card p-12 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <Tag size={24} className="text-muted-foreground" />
          </div>
          <p className="font-semibold">No discounts yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Create discount presets that tellers can apply when placing orders from the POS app.
          </p>
          <Button onClick={() => setFormOpen(true)}>
            <Plus size={14} /> Create First Discount
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={discounts}
          isLoading={isLoading}
          searchKey="name"
          searchPlaceholder="Search discounts…"
        />
      )}

      <DiscountFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditDiscount(null); }}
        orgId={orgId}
        editDiscount={editDiscount}
      />
    </PageShell>
  );
}
EOF

echo "✓ src/pages/discounts/Discounts.tsx"

# ─────────────────────────────────────────────────────────────────────────────
# 4. Create Orders page
# ─────────────────────────────────────────────────────────────────────────────
mkdir -p src/pages/orders

cat > src/pages/orders/Orders.tsx << 'EOF'
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ShoppingBag, Receipt, XCircle, ChevronRight,
  DollarSign, CreditCard, Smartphone, Split,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";
import { useAppStore } from "@/store/app";
import * as ordersApi from "@/api/orders";
import * as shiftsApi from "@/api/shifts";
import * as branchesApi from "@/api/branches";
import * as discountsApi from "@/api/discounts";
import { getErrorMessage } from "@/lib/client";
import {
  egp, fmtDateTime, fmtPayment, fmtTime,
  PAYMENT_BG, PAYMENT_COLORS,
} from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Order, Shift, Branch, Discount } from "@/types";

// ── Payment method badge ──────────────────────────────────────────────────────
function PaymentBadge({ method }: { method: string }) {
  const label = fmtPayment(method);
  const bg    = PAYMENT_BG[method as keyof typeof PAYMENT_BG]
    ?? "bg-muted text-muted-foreground";
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bg}`}>
      {label}
    </span>
  );
}

// ── Order detail sheet ────────────────────────────────────────────────────────
function OrderDetailSheet({
  order, onClose, discounts,
}: {
  order:     Order;
  onClose:   () => void;
  discounts: Discount[];
}) {
  const qc = useQueryClient();
  const isVoided = order.status === "voided";
  const discount = discounts.find((d) => d.id === order.discount_id);

  const { mutate: doVoid, isPending: voiding } = useMutation({
    mutationFn: (reason: string) =>
      ordersApi.voidOrder(order.id, { reason, restore_inventory: true }),
    onSuccess: () => {
      toast.success("Order voided");
      qc.invalidateQueries({ queryKey: ["orders"] });
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const [voidReason, setVoidReason] = useState("customer_request");

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-bold text-lg">Order #{order.order_number}</h2>
            {isVoided && <Badge variant="destructive">Voided</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            {fmtDateTime(order.created_at)} · {order.teller_name}
          </p>
        </div>
        <PaymentBadge method={order.payment_method} />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-5">

          {/* Items */}
          <div className="rounded-xl border overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/40 border-b">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Items
              </p>
            </div>
            <div className="divide-y divide-border/50">
              {(order.items ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No item details available
                </p>
              ) : (
                (order.items ?? []).map((item) => (
                  <div key={item.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">
                          {item.quantity}× {item.item_name}
                          {item.size_label && (
                            <span className="text-muted-foreground font-normal"> · {item.size_label}</span>
                          )}
                        </p>
                        {(item.addons ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.addons.map((a) => (
                              <span key={a.id} className="text-[10px] bg-primary/8 text-primary px-2 py-0.5 rounded-full border border-primary/20 font-medium">
                                {a.addon_name}
                                {a.unit_price > 0 && ` +${egp(a.unit_price)}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="font-semibold tabular-nums text-sm flex-shrink-0">
                        {egp(item.line_total)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-xl border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{egp(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  Discount
                  {discount && (
                    <Badge variant="outline" className="text-[10px] h-4 ml-1">
                      {discount.name}
                    </Badge>
                  )}
                  {order.discount_type && !discount && (
                    <span className="text-[10px] text-muted-foreground ml-1">
                      ({order.discount_type === "percentage"
                        ? `${order.discount_value}%`
                        : egp(order.discount_value)})
                    </span>
                  )}
                </span>
                <span className="text-green-600 font-medium tabular-nums">
                  − {egp(order.discount_amount)}
                </span>
              </div>
            )}
            {order.tax_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="tabular-nums">{egp(order.tax_amount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className={`tabular-nums ${isVoided ? "line-through text-muted-foreground" : "text-primary"}`}>
                {egp(order.total_amount)}
              </span>
            </div>

            {/* Cash tendered / change */}
            {order.amount_tendered != null && (
              <>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cash Tendered</span>
                  <span className="tabular-nums">{egp(order.amount_tendered)}</span>
                </div>
                {order.change_given != null && order.change_given > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Change Given</span>
                    <span className="text-green-600 font-semibold tabular-nums">
                      {egp(order.change_given)}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Tip */}
            {order.tip_amount != null && order.tip_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tip</span>
                <span className="tabular-nums text-amber-600 font-medium">
                  {egp(order.tip_amount)}
                </span>
              </div>
            )}
          </div>

          {/* Void reason */}
          {isVoided && order.void_reason && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/8 border border-destructive/20 px-4 py-3">
              <AlertCircle size={14} className="text-destructive flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-destructive">Voided</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {order.void_reason.replace(/_/g, " ")}
                </p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="rounded-xl border p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <span>{order.customer_name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment</span>
              <PaymentBadge method={order.payment_method} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span>{fmtDateTime(order.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Teller</span>
              <span>{order.teller_name}</span>
            </div>
          </div>

          {/* Void controls */}
          {!isVoided && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
              <p className="text-sm font-semibold text-destructive flex items-center gap-2">
                <XCircle size={14} /> Void Order
              </p>
              <div className="space-y-2">
                <Label className="text-xs">Void Reason</Label>
                <Select value={voidReason} onValueChange={setVoidReason}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer_request">Customer Request</SelectItem>
                    <SelectItem value="wrong_order">Wrong Order</SelectItem>
                    <SelectItem value="quality_issue">Quality Issue</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="destructive"
                size="sm"
                loading={voiding}
                className="w-full"
                onClick={() => {
                  if (confirm("Void this order? This cannot be undone.")) {
                    doVoid(voidReason);
                  }
                }}
              >
                <XCircle size={13} /> Void Order
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── Main Orders page ──────────────────────────────────────────────────────────
export default function Orders() {
  const user     = useAuthStore((s) => s.user);
  const orgId    = useAppStore((s) => s.selectedOrgId) ?? user?.org_id ?? "";
  const branchId = useAppStore((s) => s.selectedBranchId) ?? "";

  const [selBranch, setSelBranch] = useState(branchId);
  const [selShift,  setSelShift]  = useState<string | null>(null);
  const [selOrder,  setSelOrder]  = useState<Order | null>(null);

  const { data: branches = [] } = useQuery({
    queryKey: ["branches", orgId],
    queryFn:  () => branchesApi.getBranches(orgId).then((r) => r.data),
    enabled:  !!orgId,
  });

  React.useEffect(() => {
    if (branches.length > 0 && !selBranch) setSelBranch(branches[0].id);
  }, [branches, selBranch]);

  const activeBranch = branches.find((b) => b.id === selBranch) ?? branches[0];

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ["shifts", activeBranch?.id],
    queryFn:  () => shiftsApi.getBranchShifts(activeBranch!.id).then((r) => r.data),
    enabled:  !!activeBranch?.id,
  });

  // Default to first shift
  React.useEffect(() => {
    if (shifts.length > 0 && !selShift) setSelShift(shifts[0].id);
  }, [shifts, selShift]);

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", selShift],
    queryFn:  () => ordersApi.getOrders({ shift_id: selShift }).then((r) => r.data),
    enabled:  !!selShift,
  });

  const { data: discounts = [] } = useQuery({
    queryKey: ["discounts", orgId],
    queryFn:  () => import("@/api/discounts").then((m) => m.getDiscounts(orgId).then((r) => r.data)),
    enabled:  !!orgId,
  });

  // Stats
  const active       = orders.filter((o) => o.status !== "voided");
  const voided       = orders.filter((o) => o.status === "voided");
  const totalRevenue = active.reduce((s, o) => s + o.total_amount, 0);
  const totalDisc    = active.reduce((s, o) => s + (o.discount_amount ?? 0), 0);

  const columns: ColumnDef<Order, any>[] = [
    {
      accessorKey: "order_number",
      header:      "#",
      cell: ({ row }) => (
        <span className={`font-bold text-sm tabular-nums ${row.original.status === "voided" ? "text-muted-foreground line-through" : ""}`}>
          #{row.original.order_number}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header:      "Time",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {fmtTime(row.original.created_at)}
        </span>
      ),
    },
    {
      accessorKey: "teller_name",
      header:      "Teller",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.teller_name}</span>
      ),
    },
    {
      accessorKey: "payment_method",
      header:      "Payment",
      cell: ({ row }) => <PaymentBadge method={row.original.payment_method} />,
    },
    {
      id:     "discount",
      header: "Discount",
      cell: ({ row }) => {
        const o   = row.original;
        const disc = discounts.find((d) => d.id === o.discount_id);
        if (!o.discount_amount) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <div>
            <span className="text-xs font-semibold text-green-600">−{egp(o.discount_amount)}</span>
            {disc && <p className="text-[10px] text-muted-foreground">{disc.name}</p>}
          </div>
        );
      },
    },
    {
      accessorKey: "total_amount",
      header:      "Total",
      cell: ({ row }) => (
        <span className={`font-bold text-sm tabular-nums ${row.original.status === "voided" ? "line-through text-muted-foreground" : ""}`}>
          {egp(row.original.total_amount)}
        </span>
      ),
    },
    {
      id:     "change",
      header: "Change",
      cell: ({ row }) => {
        const c = row.original.change_given;
        if (c == null || c === 0) return <span className="text-muted-foreground text-xs">—</span>;
        return <span className="text-xs text-green-600 font-semibold tabular-nums">{egp(c)}</span>;
      },
    },
    {
      accessorKey: "status",
      header:      "Status",
      cell: ({ row }) =>
        row.original.status === "voided"
          ? <Badge variant="destructive"><XCircle size={10} /> Voided</Badge>
          : <Badge variant="success">Completed</Badge>,
    },
    {
      id:     "arrow",
      header: "",
      cell:   () => <ChevronRight size={14} className="text-muted-foreground" />,
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Orders"
        sub="View and manage orders by shift"
      />

      {/* Filters row */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {branches.length > 1 && (
          <div className="space-y-1">
            <Label className="text-xs">Branch</Label>
            <Select value={selBranch} onValueChange={(v) => { setSelBranch(v); setSelShift(null); }}>
              <SelectTrigger className="w-48 h-9">
                <SelectValue placeholder="Branch…" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs">Shift</Label>
          <Select
            value={selShift ?? ""}
            onValueChange={setSelShift}
            disabled={shiftsLoading || shifts.length === 0}
          >
            <SelectTrigger className="w-64 h-9">
              <SelectValue placeholder={shiftsLoading ? "Loading…" : "Select shift…"} />
            </SelectTrigger>
            <SelectContent>
              {shifts.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.status === "open" ? "bg-green-500" : "bg-muted-foreground"}`} />
                    {s.teller_name} · {fmtDateTime(s.opened_at)}
                    {s.status === "open" && " (open)"}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary stats */}
      {orders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Completed Orders", value: active.length,      color: "text-primary"   },
            { label: "Total Revenue",    value: egp(totalRevenue),  color: "text-green-600" },
            { label: "Total Discounts",  value: egp(totalDisc),     color: "text-amber-600" },
            { label: "Voided Orders",    value: voided.length,      color: voided.length > 0 ? "text-red-500" : "text-muted-foreground" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border bg-card p-4">
              <p className={`text-2xl font-extrabold tabular-nums ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Orders table */}
      {!selShift ? (
        <EmptyState
          icon={Receipt}
          title="Select a shift"
          sub="Choose a branch and shift to view its orders"
        />
      ) : ordersLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders in this shift"
          sub="Orders placed during this shift will appear here"
        />
      ) : (
        <DataTable
          data={orders}
          columns={columns}
          searchPlaceholder="Search orders…"
          pageSize={25}
          onRowClick={(row) => setSelOrder(row)}
        />
      )}

      {/* Order detail drawer */}
      <Dialog open={!!selOrder} onOpenChange={(o) => !o && setSelOrder(null)}>
        <DialogContent sheet="right" showClose={false} className="p-0">
          {selOrder && (
            <OrderDetailSheet
              order={selOrder}
              onClose={() => setSelOrder(null)}
              discounts={discounts}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
EOF

echo "✓ src/pages/orders/Orders.tsx"

# ─────────────────────────────────────────────────────────────────────────────
# 5. Update App.tsx — add Discounts + Orders routes
# ─────────────────────────────────────────────────────────────────────────────
python3 - << 'PYEOF'
import pathlib

path = pathlib.Path("src/App.tsx")
src  = path.read_text()

# Add lazy imports
if "Discounts" not in src:
    src = src.replace(
        'const Permissions = lazy(() => import("@/pages/permissions/Permissions"));',
        'const Permissions = lazy(() => import("@/pages/permissions/Permissions"));\n'
        'const Discounts   = lazy(() => import("@/pages/discounts/Discounts"));\n'
        'const Orders      = lazy(() => import("@/pages/orders/Orders"));'
    )

# Add routes
if 'path="discounts"' not in src:
    src = src.replace(
        '<Route path="analytics"   element={<Analytics />} />',
        '<Route path="analytics"   element={<Analytics />} />\n'
        '            <Route path="discounts"  element={<Discounts />} />\n'
        '            <Route path="orders"     element={<Orders />} />'
    )

path.write_text(src)
print("App.tsx: routes added")
PYEOF

echo "✓ src/App.tsx"

# ─────────────────────────────────────────────────────────────────────────────
# 6. Update Sidebar.tsx — add Discounts + Orders nav items
# ─────────────────────────────────────────────────────────────────────────────
python3 - << 'PYEOF'
import pathlib, re

path = pathlib.Path("src/components/layout/Sidebar.tsx")
src  = path.read_text()

# Add Tag + ShoppingBag to lucide imports if missing
if "Tag," not in src:
    src = src.replace(
        "import {\n  Coffee,",
        "import {\n  Coffee,\n  Tag,\n  ShoppingBag,"
    )
elif "ShoppingBag," not in src:
    src = src.replace("  Tag,", "  Tag,\n  ShoppingBag,")

# Add nav items after analytics entry
if '"discounts"' not in src:
    old = '''      {
        to: "/analytics",
        icon: BarChart2,
        label: "Analytics",
        sub: "Reports & trends",
        roles: ["super_admin", "org_admin", "branch_manager"],
      },'''
    new = '''      {
        to: "/analytics",
        icon: BarChart2,
        label: "Analytics",
        sub: "Reports & trends",
        roles: ["super_admin", "org_admin", "branch_manager"],
      },
      {
        to: "/orders",
        icon: ShoppingBag,
        label: "Orders",
        sub: "Browse by shift",
        roles: ["super_admin", "org_admin", "branch_manager"],
      },
      {
        to: "/discounts",
        icon: Tag,
        label: "Discounts",
        sub: "Preset discounts",
        roles: ["super_admin", "org_admin", "branch_manager"],
      },'''
    src = src.replace(old, new)

path.write_text(src)
print("Sidebar.tsx: nav items added")
PYEOF

echo "✓ src/components/layout/Sidebar.tsx"

# ─────────────────────────────────────────────────────────────────────────────
# 7. Update CommandPalette.tsx — add Discounts + Orders
# ─────────────────────────────────────────────────────────────────────────────
python3 - << 'PYEOF'
import pathlib

path = pathlib.Path("src/components/layout/CommandPalette.tsx")
src  = path.read_text()

# Add Tag + ShoppingBag to import
if "Tag," not in src:
    src = src.replace(
        "  LayoutDashboard, Building2, Users, GitBranch, Coffee,",
        "  LayoutDashboard, Building2, Users, GitBranch, Coffee,\n  Tag, ShoppingBag,"
    )

# Add nav entries
if '"discounts"' not in src:
    src = src.replace(
        '  { label: "Permissions",   to: "/permissions/select",  icon: Shield,          roles: ["super_admin","org_admin"] },',
        '  { label: "Permissions",   to: "/permissions/select",  icon: Shield,          roles: ["super_admin","org_admin"] },\n'
        '  { label: "Orders",        to: "/orders",              icon: ShoppingBag,     roles: ["super_admin","org_admin","branch_manager"] },\n'
        '  { label: "Discounts",     to: "/discounts",           icon: Tag,             roles: ["super_admin","org_admin","branch_manager"] },'
    )

path.write_text(src)
print("CommandPalette.tsx: entries added")
PYEOF

echo "✓ src/components/layout/CommandPalette.tsx"

# ─────────────────────────────────────────────────────────────────────────────
# 8. Add discount_id + tip_amount + change_given + amount_tendered to Order type
# ─────────────────────────────────────────────────────────────────────────────
python3 - << 'PYEOF'
import pathlib

path = pathlib.Path("src/types/index.ts")
src  = path.read_text()

# Check if discount_id already added
if "discount_id" not in src:
    old = '''  voided_at:       string | null;
  void_reason:     string | null;
  voided_by:       string | null;
  created_at:      string;
  items?:          OrderItem[];'''
    new = '''  amount_tendered: number | null;
  change_given:    number | null;
  tip_amount:      number | null;
  discount_id:     string | null;
  voided_at:       string | null;
  void_reason:     string | null;
  voided_by:       string | null;
  created_at:      string;
  items?:          OrderItem[];'''
    src = src.replace(old, new)
    path.write_text(src)
    print("types/index.ts: Order fields added")
else:
    print("types/index.ts: Order fields already present")
PYEOF

echo "✓ types/index.ts: Order fields"

echo ""
echo "=== React dashboard patch complete ==="
echo ""
echo "New pages:"
echo "  /orders     — Browse orders by branch + shift, with discount/tendered/change display"
echo "  /discounts  — Full CRUD for discount presets"
echo ""
echo "Updated:"
echo "  src/App.tsx                         — new routes"
echo "  src/components/layout/Sidebar.tsx   — Orders + Discounts nav items"
echo "  src/components/layout/CommandPalette.tsx — ⌘K entries"
echo "  src/types/index.ts                  — Discount type + Order new fields"
echo ""
echo "Run: npm run build"