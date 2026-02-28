import { useCallback, useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCcw, Trash2, UserPen } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { expensesService } from "@/services/expenses.service";
import type { Expense } from "@/types/database";

interface ExpenseFormState {
  expense_id: string;
  title: string;
  amount: string;
  category: string;
  payment_method: string;
  notes: string;
  expense_date: string;
}

const emptyExpenseForm: ExpenseFormState = {
  expense_id: "",
  title: "",
  amount: "",
  category: "",
  payment_method: "",
  notes: "",
  expense_date: "",
};

const toNullableString = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const toNullableIsoDate = (value: string): string | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return new Date(`${trimmed}T00:00:00`).toISOString();
};

const toInputDate = (value: string | null): string => {
  if (!value) {
    return "";
  }
  return value.slice(0, 10);
};

export const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState<ExpenseFormState>(emptyExpenseForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = useCallback(async () => {
    try {
      setError(null);
      const data = await expensesService.getExpenses();
      setExpenses(data);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load expenses.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyExpenseForm);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    const amount = Number(form.amount);

    if (!title) {
      setError("Expense title is required.");
      return;
    }

    if (Number.isNaN(amount) || amount < 0) {
      setError("Amount must be a valid non-negative number.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      if (editingId === null) {
        await expensesService.createExpense({
          expense_id: toNullableString(form.expense_id),
          title,
          amount,
          category: toNullableString(form.category),
          payment_method: toNullableString(form.payment_method),
          notes: toNullableString(form.notes),
          expense_date: toNullableIsoDate(form.expense_date),
          synced_from_device_at: null,
        });
      } else {
        await expensesService.updateExpense(editingId, {
          expense_id: toNullableString(form.expense_id),
          title,
          amount,
          category: toNullableString(form.category),
          payment_method: toNullableString(form.payment_method),
          notes: toNullableString(form.notes),
          expense_date: toNullableIsoDate(form.expense_date),
        });
      }

      await loadExpenses();
      resetForm();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to save expense.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setForm({
      expense_id: expense.expense_id ?? "",
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category ?? "",
      payment_method: expense.payment_method ?? "",
      notes: expense.notes ?? "",
      expense_date: toInputDate(expense.expense_date),
    });
    setError(null);
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Delete this expense?");
    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await expensesService.deleteExpense(id);
      if (editingId === id) {
        resetForm();
      }
      await loadExpenses();
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete expense.";
      setError(message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-6xl space-y-6"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground text-sm">
            Track and maintain operational spending records.
          </p>
        </div>
        <Badge variant="outline" className="glass-pill w-fit text-xs">
          {expenses.length} expenses
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="glass-panel border-white/60">
          <CardHeader>
            <CardTitle>
              {editingId === null ? "Create Expense" : "Edit Expense"}
            </CardTitle>
            <CardDescription>
              {editingId === null
                ? "Create a new expense transaction."
                : "Update selected expense details."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="expense-id">Expense ID</Label>
                <Input
                  id="expense-id"
                  value={form.expense_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      expense_id: event.target.value,
                    }))
                  }
                  placeholder="EXP-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-title">Title</Label>
                <Input
                  id="expense-title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  required
                />
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
                    onChange={(event) =>
                      setForm((current) => ({ ...current, amount: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expense-date">Date</Label>
                  <Input
                    id="expense-date"
                    type="date"
                    value={form.expense_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        expense_date: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expense-category">Category</Label>
                  <Input
                    id="expense-category"
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expense-payment">Payment Method</Label>
                  <Input
                    id="expense-payment"
                    value={form.payment_method}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        payment_method: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-notes">Notes</Label>
                <Textarea
                  id="expense-notes"
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isSaving}>
                  <UserPen className="size-4" />
                  {isSaving
                    ? "Saving..."
                    : editingId === null
                      ? "Create Expense"
                      : "Update Expense"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSaving}
                >
                  <Plus className="size-4" />
                  New
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/60">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-xl">Expense Records</CardTitle>
              <CardDescription>Read, update, and remove expenses.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadExpenses()}>
              <RefreshCcw className="size-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/40 hover:bg-transparent">
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-4 text-center">
                      Loading expenses...
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && expenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-4 text-center">
                      No expenses found.
                    </TableCell>
                  </TableRow>
                )}

                {expenses.map((expense) => (
                  <TableRow key={expense.id} className="border-white/35 hover:bg-white/30">
                    <TableCell>{expense.expense_id || `#${expense.id}`}</TableCell>
                    <TableCell className="font-medium">{expense.title}</TableCell>
                    <TableCell>${expense.amount.toLocaleString()}</TableCell>
                    <TableCell>{expense.category || "-"}</TableCell>
                    <TableCell>
                      {expense.expense_date
                        ? new Date(expense.expense_date).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(expense)}
                        >
                          <UserPen className="size-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void handleDelete(expense.id)}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
