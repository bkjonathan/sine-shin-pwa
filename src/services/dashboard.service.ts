import { supabase } from "@/lib/supabase";
import type { DashboardStats } from "@/types/database";

export interface DashboardStatsOptions {
  dateFrom?: string;
  dateTo?: string;
  dateField?: "order_date" | "created_at";
  status?: string;
}

export const dashboardService = {
  async getDashboardStats(
    options: DashboardStatsOptions = {},
  ): Promise<DashboardStats> {
    const { data, error } = await supabase.rpc("get_dashboard_stats", {
      p_date_from: options.dateFrom || null,
      p_date_to: options.dateTo || null,
      p_date_field: options.dateField || "order_date",
      p_status: options.status || null,
    });

    if (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
    return data as DashboardStats;
  },
};
