import type { FormEvent } from "react";
import { ArrowLeft, CirclePlus, PencilLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ExpenseFormState } from "@/components/expenses/expense-form.types";

interface ExpenseFormProps {
  form: ExpenseFormState;
  isSaving: boolean;
  isEditMode: boolean;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: <K extends keyof ExpenseFormState>(
    field: K,
    value: ExpenseFormState[K],
  ) => void;
}

export const ExpenseForm = ({
  form,
  isSaving,
  isEditMode,
  onCancel,
  onSubmit,
  onFieldChange,
}: ExpenseFormProps) => {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="expense-id">Expense Code</Label>
          <Input
            id="expense-id"
            value={form.expense_id}
            onChange={(event) => onFieldChange("expense_id", event.target.value)}
            placeholder="EXP-0001"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expense-title">Title</Label>
          <Input
            id="expense-title"
            value={form.title}
            onChange={(event) => onFieldChange("title", event.target.value)}
            placeholder="Office rent"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="expense-amount">Amount</Label>
          <Input
            id="expense-amount"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(event) => onFieldChange("amount", event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expense-date">Expense Date</Label>
          <Input
            id="expense-date"
            type="date"
            value={form.expense_date}
            onChange={(event) => onFieldChange("expense_date", event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="expense-category">Category</Label>
          <Input
            id="expense-category"
            value={form.category}
            onChange={(event) => onFieldChange("category", event.target.value)}
            placeholder="Logistics"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expense-payment-method">Payment Method</Label>
          <Input
            id="expense-payment-method"
            value={form.payment_method}
            onChange={(event) => onFieldChange("payment_method", event.target.value)}
            placeholder="Bank transfer"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expense-notes">Notes</Label>
        <Textarea
          id="expense-notes"
          value={form.notes}
          onChange={(event) => onFieldChange("notes", event.target.value)}
          className="border-white/60 bg-white/48 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.75)] backdrop-blur-xl"
          placeholder="Optional details about this expense"
        />
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" disabled={isSaving}>
          {isEditMode ? <PencilLine className="size-4" /> : <CirclePlus className="size-4" />}
          {isSaving ? "Saving..." : isEditMode ? "Save Changes" : "Create Expense"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          <ArrowLeft className="size-4" />
          Back to Expenses
        </Button>
      </div>
    </form>
  );
};
