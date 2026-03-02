import { supabase } from "@/lib/supabase";
import {
  getNextLocalId,
  stripIdentityFields,
  withLegacyId,
  withLegacyIds,
} from "@/services/local-id.utils";
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

    return withLegacyIds(data as User[]);
  },

  async getUserById(id: number): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("local_id", id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching user by id:", error);
      throw error;
    }

    return data ? withLegacyId(data as User) : null;
  },

  async createUser(
    user: Omit<
      User,
      "id" | "created_at" | "updated_at" | "synced_from_device_at"
    >,
  ): Promise<User> {
    const localId =
      typeof user.local_id === "number" ? user.local_id : await getNextLocalId("users");

    const payload = stripIdentityFields(user);

    const { data: insertedData, error } = await supabase
      .from("users")
      .insert({ ...payload, local_id: localId })
      .select();

    if (error) {
      console.error("Error creating user:", error);
      throw error;
    }

    if (!insertedData || insertedData.length === 0) {
      throw new Error(
        "User was not created properly. Please check your permissions.",
      );
    }

    return withLegacyId(insertedData[0] as User);
  },

  async updateUser(id: number, user: Partial<User>): Promise<User> {
    const updatePayload = stripIdentityFields(user);

    const { data: updatedData, error } = await supabase
      .from("users")
      .update({ ...updatePayload, updated_at: new Date().toISOString() })
      .eq("local_id", id)
      .select();

    if (error) {
      console.error("Error updating user:", error);
      throw error;
    }

    if (!updatedData || updatedData.length === 0) {
      throw new Error(
        "User was not updated. It may not exist or you lack UPDATE permissions.",
      );
    }

    return withLegacyId(updatedData[0] as User);
  },

  async deleteUser(id: number): Promise<void> {
    const { error } = await supabase.from("users").delete().eq("local_id", id);

    if (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },
};
