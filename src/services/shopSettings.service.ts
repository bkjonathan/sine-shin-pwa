import { supabase } from "@/lib/supabase";
import {
  getNextLocalId,
  stripIdentityFields,
  withLegacyId,
} from "@/services/local-id.utils";
import type { ShopSettings } from "@/types/database";

export const shopSettingsService = {
  async getSettings(): Promise<ShopSettings | null> {
    const { data, error } = await supabase
      .from("shop_settings")
      .select("*")
      .order("local_id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching shop settings:", error);
      throw error;
    }

    return data ? withLegacyId(data as ShopSettings) : null;
  },

  async updateSettings(settings: Partial<ShopSettings>): Promise<ShopSettings> {
    const targetId =
      typeof settings.local_id === "number"
        ? settings.local_id
        : settings.id;

    if (typeof targetId !== "number") {
      throw new Error("Missing local_id while updating shop settings.");
    }

    const payload = stripIdentityFields(settings);

    const { data: updatedData, error } = await supabase
      .from("shop_settings")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("local_id", targetId)
      .select();

    if (error) {
      console.error("Error updating shop settings:", error);
      throw error;
    }

    if (!updatedData || updatedData.length === 0) {
      throw new Error(
        "Shop settings were not updated. They may not exist or you lack UPDATE permissions.",
      );
    }

    return withLegacyId(updatedData[0] as ShopSettings);
  },

  async createSettings(
    settings: Omit<ShopSettings, "id" | "created_at" | "updated_at">,
  ): Promise<ShopSettings> {
    const localId =
      typeof settings.local_id === "number"
        ? settings.local_id
        : await getNextLocalId("shop_settings");

    const payload = stripIdentityFields(settings);

    const { data: insertedData, error } = await supabase
      .from("shop_settings")
      .insert({ ...payload, local_id: localId })
      .select();

    if (error) {
      console.error("Error creating shop settings:", error);
      throw error;
    }

    if (!insertedData || insertedData.length === 0) {
      throw new Error(
        "Shop settings was not created properly. Please check your permissions.",
      );
    }

    return withLegacyId(insertedData[0] as ShopSettings);
  },

  async deleteSettings(id: number): Promise<void> {
    const { error } = await supabase
      .from("shop_settings")
      .delete()
      .eq("local_id", id);

    if (error) {
      console.error("Error deleting shop settings:", error);
      throw error;
    }
  },
};
