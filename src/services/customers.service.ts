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
    const { data: insertedData, error } = await supabase
      .from("customers")
      .insert(customer)
      .select();

    if (error) {
      console.error("Error creating customer:", error);
      throw error;
    }

    if (!insertedData || insertedData.length === 0) {
      throw new Error(
        "Customer was not created properly. Please check your permissions.",
      );
    }

    return insertedData[0];
  },

  async updateCustomer(
    id: number,
    customer: Partial<Customer>,
  ): Promise<Customer> {
    const { data: updatedData, error } = await supabase
      .from("customers")
      .update({ ...customer, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error updating customer:", error);
      throw error;
    }

    if (!updatedData || updatedData.length === 0) {
      throw new Error(
        "Customer was not updated. It may not exist or you lack UPDATE permissions.",
      );
    }

    return updatedData[0];
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
