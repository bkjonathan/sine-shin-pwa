import { supabase } from "@/lib/supabase";
import type { Expense } from "@/types/database";

interface GetExpensesPageParams {
  page: number;
  pageSize: number;
  searchQuery?: string;
  categoryFilter?: string;
}

interface ExpensesPageResult {
  data: Expense[];
  count: number;
}

interface ExpenseFilterOptions {
  categories: string[];
}

const buildSearchFilter = (searchQuery?: string): string | null => {
  const trimmed = searchQuery?.trim();
  if (!trimmed) {
    return null;
  }

  const sanitized = trimmed
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_")
    .replaceAll(",", " ");
  return [
    `expense_id.ilike.%${sanitized}%`,
    `title.ilike.%${sanitized}%`,
    `category.ilike.%${sanitized}%`,
    `payment_method.ilike.%${sanitized}%`,
    `notes.ilike.%${sanitized}%`,
  ].join(",");
};

export const expensesService = {
  async getExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .is("deleted_at", null)
      .order("expense_date", { ascending: false });

    if (error) {
      console.error("Error fetching expenses:", error);
      throw error;
    }
    return data || [];
  },

  async getExpensesPage({
    page,
    pageSize,
    searchQuery,
    categoryFilter,
  }: GetExpensesPageParams): Promise<ExpensesPageResult> {
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, pageSize);
    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;
    const searchFilter = buildSearchFilter(searchQuery);

    let query = supabase
      .from("expenses")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (categoryFilter && categoryFilter !== "all") {
      query = query.eq("category", categoryFilter);
    }

    if (searchFilter) {
      query = query.or(searchFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching paginated expenses:", error);
      throw error;
    }

    return {
      data: data ?? [],
      count: count ?? 0,
    };
  },

  async getExpenseFilterOptions(): Promise<ExpenseFilterOptions> {
    const categoriesSet = new Set<string>();
    const batchSize = 1000;
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from("expenses")
        .select("category")
        .is("deleted_at", null)
        .range(from, from + batchSize - 1);

      if (error) {
        console.error("Error fetching expense filter options:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        break;
      }

      data.forEach((row) => {
        const category = row.category?.trim();
        if (category) {
          categoriesSet.add(category);
        }
      });

      if (data.length < batchSize) {
        break;
      }

      from += batchSize;
    }

    return {
      categories: Array.from(categoriesSet).sort((a, b) => a.localeCompare(b)),
    };
  },

  async getExpenseById(id: number): Promise<Expense | null> {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching expense by id:", error);
      throw error;
    }
    return data;
  },

  async createExpense(
    expense: Omit<Expense, "id" | "created_at" | "updated_at" | "deleted_at">,
  ): Promise<Expense> {
    const { data: insertedData, error } = await supabase
      .from("expenses")
      .insert(expense)
      .select();

    if (error) {
      console.error("Error creating expense:", error);
      throw error;
    }

    if (!insertedData || insertedData.length === 0) {
      throw new Error(
        "Expense was not created properly. Please check your permissions.",
      );
    }

    return insertedData[0];
  },

  async updateExpense(id: number, expense: Partial<Expense>): Promise<Expense> {
    const { data: updatedData, error } = await supabase
      .from("expenses")
      .update({ ...expense, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error updating expense:", error);
      throw error;
    }

    if (!updatedData || updatedData.length === 0) {
      throw new Error(
        "Expense was not updated. It may not exist or you lack UPDATE permissions.",
      );
    }

    return updatedData[0];
  },

  async deleteExpense(id: number): Promise<void> {
    const { error } = await supabase
      .from("expenses")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  },
};
