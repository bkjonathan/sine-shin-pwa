import { supabase } from "@/lib/supabase";
import {
  getNextLocalId,
  stripIdentityFields,
  withLegacyId,
  withLegacyIds,
} from "@/services/local-id.utils";
import type { Customer } from "@/types/database";

interface GetCustomersPageParams {
  page: number;
  pageSize: number;
  searchQuery?: string;
  cityFilter?: string;
  platformFilter?: string;
}

interface CustomersPageResult {
  data: Customer[];
  count: number;
}

export interface CustomerStatsSummary {
  total: number;
  withPhone: number;
  withPlatform: number;
  withSocialUrl: number;
}

interface CustomerFilterOptions {
  cities: string[];
  platforms: string[];
}

const DEFAULT_CUSTOMER_ID_PREFIX = "SSC-";
const CUSTOMER_ID_PAD_LENGTH = 5;

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
    `customer_id.ilike.%${sanitized}%`,
    `name.ilike.%${sanitized}%`,
    `phone.ilike.%${sanitized}%`,
    `city.ilike.%${sanitized}%`,
    `platform.ilike.%${sanitized}%`,
  ].join(",");
};

export const customersService = {
  async getNextCustomerCodePreview(): Promise<string> {
    const [settingsResult, latestCustomerResult] = await Promise.all([
      supabase
        .from("shop_settings")
        .select("customer_id_prefix")
        .order("local_id", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("customers")
        .select("local_id")
        .order("local_id", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (settingsResult.error) {
      console.error("Error fetching customer id prefix:", settingsResult.error);
      throw settingsResult.error;
    }

    if (latestCustomerResult.error) {
      console.error(
        "Error fetching latest customer id for preview:",
        latestCustomerResult.error,
      );
      throw latestCustomerResult.error;
    }

    const prefix =
      settingsResult.data?.customer_id_prefix ?? DEFAULT_CUSTOMER_ID_PREFIX;
    const nextId = (latestCustomerResult.data?.local_id ?? 0) + 1;
    return `${prefix}${nextId.toString().padStart(CUSTOMER_ID_PAD_LENGTH, "0")}`;
  },

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

    return withLegacyIds(data as Customer[]);
  },

  async getCustomersPage({
    page,
    pageSize,
    searchQuery,
    cityFilter,
    platformFilter,
  }: GetCustomersPageParams): Promise<CustomersPageResult> {
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, pageSize);
    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;
    const searchFilter = buildSearchFilter(searchQuery);

    let query = supabase
      .from("customers")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (cityFilter && cityFilter !== "all") {
      query = query.eq("city", cityFilter);
    }

    if (platformFilter && platformFilter !== "all") {
      query = query.eq("platform", platformFilter);
    }

    if (searchFilter) {
      query = query.or(searchFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching paginated customers:", error);
      throw error;
    }

    return {
      data: withLegacyIds(data as Customer[]),
      count: count ?? 0,
    };
  },

  async getCustomerStats(): Promise<CustomerStatsSummary> {
    const [totalResult, withPhoneResult, withPlatformResult, withSocialUrlResult] =
      await Promise.all([
        supabase
          .from("customers")
          .select("local_id", { count: "exact", head: true })
          .is("deleted_at", null),
        supabase
          .from("customers")
          .select("local_id", { count: "exact", head: true })
          .is("deleted_at", null)
          .not("phone", "is", null)
          .neq("phone", ""),
        supabase
          .from("customers")
          .select("local_id", { count: "exact", head: true })
          .is("deleted_at", null)
          .not("platform", "is", null)
          .neq("platform", ""),
        supabase
          .from("customers")
          .select("local_id", { count: "exact", head: true })
          .is("deleted_at", null)
          .not("social_media_url", "is", null)
          .neq("social_media_url", ""),
      ]);

    const statsError =
      totalResult.error ||
      withPhoneResult.error ||
      withPlatformResult.error ||
      withSocialUrlResult.error;

    if (statsError) {
      console.error("Error fetching customer stats:", statsError);
      throw statsError;
    }

    return {
      total: totalResult.count ?? 0,
      withPhone: withPhoneResult.count ?? 0,
      withPlatform: withPlatformResult.count ?? 0,
      withSocialUrl: withSocialUrlResult.count ?? 0,
    };
  },

  async getCustomerFilterOptions(): Promise<CustomerFilterOptions> {
    const citiesSet = new Set<string>();
    const platformsSet = new Set<string>();
    const batchSize = 1000;
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from("customers")
        .select("city, platform")
        .is("deleted_at", null)
        .range(from, from + batchSize - 1);

      if (error) {
        console.error("Error fetching customer filter options:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        break;
      }

      data.forEach((row) => {
        const city = row.city?.trim();
        const platform = row.platform?.trim();

        if (city) {
          citiesSet.add(city);
        }
        if (platform) {
          platformsSet.add(platform);
        }
      });

      if (data.length < batchSize) {
        break;
      }

      from += batchSize;
    }

    return {
      cities: Array.from(citiesSet).sort((a, b) => a.localeCompare(b)),
      platforms: Array.from(platformsSet).sort((a, b) => a.localeCompare(b)),
    };
  },

  async getCustomerById(id: number): Promise<Customer | null> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("local_id", id)
      .is("deleted_at", null)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching customer by id:", error);
      throw error;
    }

    return data ? withLegacyId(data as Customer) : null;
  },

  async createCustomer(
    customer: Omit<Customer, "id" | "created_at" | "updated_at" | "deleted_at">,
  ): Promise<Customer> {
    const localId =
      typeof customer.local_id === "number"
        ? customer.local_id
        : await getNextLocalId("customers");

    const rest = stripIdentityFields(customer);

    const { data: insertedData, error } = await supabase
      .from("customers")
      .insert({ ...rest, local_id: localId })
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

    return withLegacyId(insertedData[0] as Customer);
  },

  async updateCustomer(
    id: number,
    customer: Partial<Customer>,
  ): Promise<Customer> {
    const updatePayload = stripIdentityFields(customer);

    const { data: updatedData, error } = await supabase
      .from("customers")
      .update({ ...updatePayload, updated_at: new Date().toISOString() })
      .eq("local_id", id)
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

    return withLegacyId(updatedData[0] as Customer);
  },

  async deleteCustomer(id: number): Promise<void> {
    const { error } = await supabase
      .from("customers")
      .update({ deleted_at: new Date().toISOString() })
      .eq("local_id", id);

    if (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  },
};
