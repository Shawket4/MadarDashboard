/**
 * The app-wide confirmation (ConfirmProvider) renders its alert dialog outside
 * any other dialog's React tree, so Radix counts a press on "Delete" or
 * "Cancel" in it as a press outside the dialog that asked, and closes that
 * dialog too (E2E D-059: confirming a department delete closed Departments).
 * A press inside an alert dialog is never "outside" for the dialog under it.
 */
export function keepOpenForConfirm(e: { target: EventTarget | null; preventDefault: () => void }): void {
  const t = e.target as Element | null;
  if (t && typeof t.closest === "function" && t.closest('[role="alertdialog"]')) e.preventDefault();
}
