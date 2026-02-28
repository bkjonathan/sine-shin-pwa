import { supabase } from "@/lib/supabase";
import type { User } from "@/types/database";

export const usersService = {
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
    return data || [];
  },

  async getUserById(id: number): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching user by id:", error);
      throw error;
    }
    return data;
  },

  async createUser(
    user: Omit<User, "id" | "created_at" | "updated_at" | "synced_from_device_at">,
  ): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .insert(user)
      .select()
      .single();

    if (error) {
      console.error("Error creating user:", error);
      throw error;
    }
    return data;
  },

  async updateUser(id: number, user: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .update({ ...user, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user:", error);
      throw error;
    }
    return data;
  },

  async deleteUser(id: number): Promise<void> {
    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },
};
