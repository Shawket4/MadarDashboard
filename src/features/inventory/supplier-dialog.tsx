import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Supplier } from "@/data/api/generated/models";
import { createSupplier, updateSupplier } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { invalidateInventory } from "./lib";

interface Props {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
}

export function SupplierDialog({ orgId, open, onOpenChange, supplier }: Props) {
  const { t } = useTranslation();
  const editing = !!supplier;
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(supplier?.name ?? "");
    setContact(supplier?.contact_name ?? "");
    setEmail(supplier?.email ?? "");
    setPhone(supplier?.phone ?? "");
    setActive(supplier?.is_active ?? true);
  }, [open, supplier]);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        contact_name: contact.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
      };
      if (editing && supplier) {
        await updateSupplier(supplier.id, { ...payload, is_active: active });
      } else {
        await createSupplier(orgId, payload);
      }
      await invalidateInventory();
      toast.success(t("common.savedChanges", "Changes saved"));
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? t("inventory.purchasing.editSupplier", "Edit supplier") : t("inventory.purchasing.newSupplier", "New supplier")}</DialogTitle>
          <DialogDescription>{t("inventory.purchasing.suppliers", "Suppliers")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("inventory.purchasing.supplier", "Supplier")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>{t("inventory.purchasing.contactName", "Contact name")}</Label>
            <Input value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("inventory.purchasing.email", "Email")}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("inventory.purchasing.phone", "Phone")}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          {editing ? (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>{t("inventory.purchasing.supplierActive", "Active")}</Label>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button loading={busy} disabled={!name.trim()} onClick={() => void submit()}>{t("common.save", "Save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
