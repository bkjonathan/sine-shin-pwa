import { PencilLine, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Expense } from "@/types/database";

interface ExpensesTableProps {
  expenses: Expense[];
  totalExpenses: number;
  hasActiveFilters: boolean;
  isLoading: boolean;
  deletingId: number | null;
  onDelete: (id: number) => void;
}

const formatDate = (value: string | null): string => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatAmount = (value: number): string =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const ExpensesTable = ({
  expenses,
  totalExpenses,
  hasActiveFilters,
  isLoading,
  deletingId,
  onDelete,
}: ExpensesTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/40 hover:bg-transparent dark:border-white/20">
          <TableHead>Expense</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && (
          <TableRow>
            <TableCell colSpan={6} className="py-8 text-center">
              Loading expenses...
            </TableCell>
          </TableRow>
        )}

        {!isLoading && totalExpenses === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="py-8 text-center">
              {hasActiveFilters
                ? "No records match the current filters."
                : "No expenses available yet."}
            </TableCell>
          </TableRow>
        )}

        {expenses.map((expense) => (
          <TableRow
            key={expense.id}
            className="border-white/35 hover:bg-white/30 dark:border-white/15 dark:hover:bg-slate-900/45"
          >
            <TableCell className="whitespace-normal">
              <div className="space-y-0.5">
                <p className="font-medium">{expense.title}</p>
                <p className="text-muted-foreground text-xs">
                  {expense.expense_id || `#${expense.id}`}
                </p>
                {expense.notes ? (
                  <p className="text-muted-foreground line-clamp-2 text-xs">{expense.notes}</p>
                ) : null}
              </div>
            </TableCell>
            <TableCell>{formatAmount(expense.amount)}</TableCell>
            <TableCell>
              <Badge variant="secondary" className="rounded-full px-2 py-0.5">
                {expense.category || "N/A"}
              </Badge>
            </TableCell>
            <TableCell>{expense.payment_method || "-"}</TableCell>
            <TableCell>{formatDate(expense.expense_date)}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/expenses/${expense.id}/edit`}>
                    <PencilLine className="size-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deletingId === expense.id}
                  onClick={() => onDelete(expense.id)}
                >
                  <Trash2 className="size-4" />
                  {deletingId === expense.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
