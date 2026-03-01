import { useCallback, useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CirclePlus, PencilLine } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import {
  emptyExpenseForm,
  mapExpenseToForm,
  toNullableIsoDate,
  toNullableString,
  type ExpenseFormState,
} from "@/components/expenses/expense-form.types";
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
import { expensesService } from "@/services/expenses.service";

export const ExpenseFormPage = () => {
  const navigate = useNavigate();
  const { expenseId } = useParams<{ expenseId: string }>();
  const hasExpenseIdParam = typeof expenseId === "string";
  const parsedExpenseId = hasExpenseIdParam ? Number.parseInt(expenseId, 10) : null;
  const isEditMode = hasExpenseIdParam;

  const [form, setForm] = useState<ExpenseFormState>(emptyExpenseForm);
  const [isLoadingExpense, setIsLoadingExpense] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExpense = useCallback(async () => {
    if (!isEditMode) {
      setForm(emptyExpenseForm);
      setIsLoadingExpense(false);
      return;
    }

    if (Number.isNaN(parsedExpenseId as number)) {
      setError("Invalid expense id.");
      setIsLoadingExpense(false);
      return;
    }

    setIsLoadingExpense(true);
    setError(null);

    try {
      const expense = await expensesService.getExpenseById(parsedExpenseId as number);
      if (!expense) {
        setError("Expense record was not found.");
        return;
      }
      setForm(mapExpenseToForm(expense));
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load expense.";
      setError(message);
    } finally {
      setIsLoadingExpense(false);
    }
  }, [isEditMode, parsedExpenseId]);

  useEffect(() => {
    void loadExpense();
  }, [loadExpense]);

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

    if (isEditMode && Number.isNaN(parsedExpenseId as number)) {
      setError("Invalid expense id.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        expense_id: toNullableString(form.expense_id),
        title,
        amount,
        category: toNullableString(form.category),
        payment_method: toNullableString(form.payment_method),
        notes: toNullableString(form.notes),
        expense_date: toNullableIsoDate(form.expense_date),
      };

      if (isEditMode) {
        await expensesService.updateExpense(parsedExpenseId as number, payload);
      } else {
        await expensesService.createExpense({
          ...payload,
          synced_from_device_at: null,
        });
      }

      navigate("/expenses");
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save expense.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = <K extends keyof ExpenseFormState>(
    field: K,
    value: ExpenseFormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-4xl space-y-6 pb-8"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
            Expense Management
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {isEditMode ? "Edit Expense" : "Create Expense"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEditMode
              ? "Update expense details and save your changes."
              : "Create a new expense record in a dedicated workflow."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="glass-pill text-xs">
            {isEditMode ? "Editing Mode" : "Creation Mode"}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link to="/expenses">
              <ArrowLeft className="size-4" />
              Back to Directory
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="glass-panel-strong border-white/65">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            {isEditMode ? <PencilLine className="size-4" /> : <CirclePlus className="size-4" />}
            {isEditMode ? "Expense Update" : "New Expense"}
          </CardTitle>
          <CardDescription>
            Required fields are validated before submission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingExpense ? (
            <div className="text-muted-foreground py-6 text-sm">Loading expense record...</div>
          ) : (
            <ExpenseForm
              form={form}
              isSaving={isSaving}
              isEditMode={isEditMode}
              onSubmit={handleSubmit}
              onCancel={() => navigate("/expenses")}
              onFieldChange={handleFieldChange}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
