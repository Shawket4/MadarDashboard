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
