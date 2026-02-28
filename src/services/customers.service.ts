import { supabase } from "@/lib/supabase";
import type { Customer } from "@/types/database";

export const customersService = {
  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }
    return data || [];
  },

  async getCustomerById(id: number): Promise<Customer | null> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching customer by id:", error);
      throw error;
    }
    return data;
  },

  async createCustomer(
    customer: Omit<Customer, "id" | "created_at" | "updated_at" | "deleted_at">,
  ): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .insert(customer)
      .select()
      .single();

    if (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
    return data;
  },

  async updateCustomer(
    id: number,
    customer: Partial<Customer>,
  ): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .update({ ...customer, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
    return data;
  },

  async deleteCustomer(id: number): Promise<void> {
    const { error } = await supabase
      .from("customers")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  },
};
