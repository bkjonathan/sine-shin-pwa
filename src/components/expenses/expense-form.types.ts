import type { Expense } from "@/types/database";

export interface ExpenseFormState {
  expense_id: string;
  title: string;
  amount: string;
  category: string;
  payment_method: string;
  notes: string;
  expense_date: string;
}

export const emptyExpenseForm: ExpenseFormState = {
  expense_id: "",
  title: "",
  amount: "",
  category: "",
  payment_method: "",
  notes: "",
  expense_date: "",
};

export const toNullableString = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export const toNullableIsoDate = (value: string): string | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  return new Date(`${trimmed}T00:00:00`).toISOString();
};

export const toInputDate = (value: string | null): string => {
  if (!value) {
    return "";
  }
  return value.slice(0, 10);
};

export const mapExpenseToForm = (expense: Expense): ExpenseFormState => ({
  expense_id: expense.expense_id ?? "",
  title: expense.title,
  amount: expense.amount.toString(),
  category: expense.category ?? "",
  payment_method: expense.payment_method ?? "",
  notes: expense.notes ?? "",
  expense_date: toInputDate(expense.expense_date),
});
