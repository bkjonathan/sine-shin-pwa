import { supabase } from "@/lib/supabase";
import type { ShopSettings } from "@/types/database";

export const shopSettingsService = {
  async getSettings(): Promise<ShopSettings | null> {
    const { data, error } = await supabase
      .from("shop_settings")
      .select("*")
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching shop settings:", error);
      throw error;
    }
    return data;
  },

  async updateSettings(settings: Partial<ShopSettings>): Promise<ShopSettings> {
    const { data, error } = await supabase
      .from("shop_settings")
      .update(settings)
      .eq("id", settings.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating shop settings:", error);
      throw error;
    }
    return data;
  },

  async createSettings(
    settings: Omit<ShopSettings, "id" | "created_at" | "updated_at">,
  ): Promise<ShopSettings> {
    const { data, error } = await supabase
      .from("shop_settings")
      .insert(settings)
      .select()
      .single();

    if (error) {
      console.error("Error creating shop settings:", error);
      throw error;
    }
    return data;
  },

  async deleteSettings(id: number): Promise<void> {
    const { error } = await supabase.from("shop_settings").delete().eq("id", id);

    if (error) {
      console.error("Error deleting shop settings:", error);
      throw error;
    }
  },
};
