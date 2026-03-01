import { supabase } from "@/lib/supabase";
import type { Expense } from "@/types/database";

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
