import { supabase } from "@/lib/supabase";
import {
  getNextLocalId,
  stripIdentityFields,
  withLegacyId,
  withLegacyIds,
} from "@/services/local-id.utils";
import type { Order, OrderItem } from "@/types/database";

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

interface GetOrdersPageParams {
  page: number;
  pageSize: number;
  searchQuery?: string;
  statusFilter?: string;
  sourceFilter?: string;
}

interface OrdersPageResult {
  data: OrderWithItems[];
  count: number;
}

export interface OrderStatsSummary {
  total: number;
  pending: number;
  completed: number;
  withCustomer: number;
}

interface OrderFilterOptions {
  statuses: string[];
  orderSources: string[];
}

const DEFAULT_ORDER_ID_PREFIX = "SSO-";
const ORDER_ID_PAD_LENGTH = 5;

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
    `order_id.ilike.%${sanitized}%`,
    `status.ilike.%${sanitized}%`,
    `order_from.ilike.%${sanitized}%`,
  ].join(",");
};

const orderSelectQuery = `
        *,
        order_items (*)
      `;

const mapOrderWithItems = (order: OrderWithItems): OrderWithItems => ({
  ...withLegacyId(order),
  order_items: withLegacyIds(order.order_items as OrderItem[]),
});

const mapOrdersWithItems = (
  orders: OrderWithItems[] | null | undefined,
): OrderWithItems[] => (orders ?? []).map(mapOrderWithItems);

export const ordersService = {
  async getNextOrderCodePreview(): Promise<string> {
    const [settingsResult, latestOrderResult] = await Promise.all([
      supabase
        .from("shop_settings")
        .select("order_id_prefix")
        .order("local_id", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("orders")
        .select("local_id")
        .order("local_id", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (settingsResult.error) {
      console.error("Error fetching order id prefix:", settingsResult.error);
      throw settingsResult.error;
    }

    if (latestOrderResult.error) {
      console.error("Error fetching latest order id for preview:", latestOrderResult.error);
      throw latestOrderResult.error;
    }

    const prefix = settingsResult.data?.order_id_prefix ?? DEFAULT_ORDER_ID_PREFIX;
    const nextId = (latestOrderResult.data?.local_id ?? 0) + 1;
    return `${prefix}${nextId.toString().padStart(ORDER_ID_PAD_LENGTH, "0")}`;
  },

  async getOrders(): Promise<OrderWithItems[]> {
    const { data, error } = await supabase
      .from("orders")
      .select(orderSelectQuery)
      .is("deleted_at", null)
      .is("order_items.deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }

    return mapOrdersWithItems(data as OrderWithItems[]);
  },

  async getOrdersPage({
    page,
    pageSize,
    searchQuery,
    statusFilter,
    sourceFilter,
  }: GetOrdersPageParams): Promise<OrdersPageResult> {
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, pageSize);
    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;
    const searchFilter = buildSearchFilter(searchQuery);

    let query = supabase
      .from("orders")
      .select(orderSelectQuery, { count: "exact" })
      .is("deleted_at", null)
      .is("order_items.deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (sourceFilter && sourceFilter !== "all") {
      query = query.eq("order_from", sourceFilter);
    }

    if (searchFilter) {
      query = query.or(searchFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching paginated orders:", error);
      throw error;
    }

    return {
      data: mapOrdersWithItems(data as OrderWithItems[]),
      count: count ?? 0,
    };
  },

  async getOrderStats(): Promise<OrderStatsSummary> {
    const [totalResult, pendingResult, completedResult, withCustomerResult] =
      await Promise.all([
        supabase
          .from("orders")
          .select("local_id", { count: "exact", head: true })
          .is("deleted_at", null),
        supabase
          .from("orders")
          .select("local_id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("status", "pending"),
        supabase
          .from("orders")
          .select("local_id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("status", "completed"),
        supabase
          .from("orders")
          .select("local_id", { count: "exact", head: true })
          .is("deleted_at", null)
          .not("customer_id", "is", null),
      ]);

    const statsError =
      totalResult.error ||
      pendingResult.error ||
      completedResult.error ||
      withCustomerResult.error;

    if (statsError) {
      console.error("Error fetching order stats:", statsError);
      throw statsError;
    }

    return {
      total: totalResult.count ?? 0,
      pending: pendingResult.count ?? 0,
      completed: completedResult.count ?? 0,
      withCustomer: withCustomerResult.count ?? 0,
    };
  },

  async getOrderFilterOptions(): Promise<OrderFilterOptions> {
    const statusesSet = new Set<string>();
    const sourcesSet = new Set<string>();
    const batchSize = 1000;
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from("orders")
        .select("status, order_from")
        .is("deleted_at", null)
        .range(from, from + batchSize - 1);

      if (error) {
        console.error("Error fetching order filter options:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        break;
      }

      data.forEach((row) => {
        const status = row.status?.trim();
        const orderFrom = row.order_from?.trim();

        if (status) {
          statusesSet.add(status);
        }

        if (orderFrom) {
          sourcesSet.add(orderFrom);
        }
      });

      if (data.length < batchSize) {
        break;
      }

      from += batchSize;
    }

    return {
      statuses: Array.from(statusesSet).sort((a, b) => a.localeCompare(b)),
      orderSources: Array.from(sourcesSet).sort((a, b) => a.localeCompare(b)),
    };
  },

  async getOrderById(id: number): Promise<OrderWithItems | null> {
    const { data, error } = await supabase
      .from("orders")
      .select(orderSelectQuery)
      .eq("local_id", id)
      .is("deleted_at", null)
      .is("order_items.deleted_at", null)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching order by id:", error);
      throw error;
    }

    return data ? mapOrderWithItems(data as OrderWithItems) : null;
  },

  async createOrder(
    order: Omit<Order, "id" | "created_at" | "updated_at" | "deleted_at">,
    items: Omit<
      OrderItem,
      "id" | "order_id" | "created_at" | "updated_at" | "deleted_at"
    >[],
  ): Promise<OrderWithItems> {
    const orderLocalId =
      typeof order.local_id === "number"
        ? order.local_id
        : await getNextLocalId("orders");

    const orderPayload = stripIdentityFields(order);

    const { data: newOrderData, error: orderError } = await supabase
      .from("orders")
      .insert({ ...orderPayload, local_id: orderLocalId })
      .select();

    if (orderError) {
      console.error("Error creating order:", orderError);
      throw orderError;
    }

    if (!newOrderData || newOrderData.length === 0) {
      throw new Error(
        "Order was not created properly. Please check your permissions.",
      );
    }

    const newOrder = withLegacyId(newOrderData[0] as Order);

    if (items && items.length > 0) {
      const nextItemLocalId = await getNextLocalId("order_items");
      let offset = 0;

      const itemsToInsert = items.map((item) => {
        const localId =
          typeof item.local_id === "number"
            ? item.local_id
            : nextItemLocalId + offset++;
        const itemPayload = stripIdentityFields(item);

        return {
          ...itemPayload,
          local_id: localId,
          order_id: newOrder.id,
        };
      });

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsToInsert);

      if (itemsError) {
        console.error("Error creating order items:", itemsError);
        throw itemsError;
      }
    }

    return this.getOrderById(newOrder.id) as Promise<OrderWithItems>;
  },

  async updateOrder(id: number, order: Partial<Order>): Promise<Order> {
    const updatePayload = stripIdentityFields(order);

    const { data: updatedData, error } = await supabase
      .from("orders")
      .update({ ...updatePayload, updated_at: new Date().toISOString() })
      .eq("local_id", id)
      .select();

    if (error) {
      console.error("Error updating order:", error);
      throw error;
    }

    if (!updatedData || updatedData.length === 0) {
      throw new Error(
        "Order was not updated. It may not exist or you lack UPDATE permissions.",
      );
    }

    return withLegacyId(updatedData[0] as Order);
  },

  async deleteOrder(id: number): Promise<void> {
    const { error } = await supabase
      .from("orders")
      .update({ deleted_at: new Date().toISOString() })
      .eq("local_id", id);

    if (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  },
};

export const orderItemsService = {
  async addOrderItem(
    item: Omit<OrderItem, "id" | "created_at" | "updated_at" | "deleted_at">,
  ): Promise<OrderItem> {
    const localId =
      typeof item.local_id === "number"
        ? item.local_id
        : await getNextLocalId("order_items");

    const itemPayload = stripIdentityFields(item);

    const { data: insertedData, error } = await supabase
      .from("order_items")
      .insert({ ...itemPayload, local_id: localId })
      .select();

    if (error) {
      console.error("Error adding order item:", error);
      throw error;
    }

    if (!insertedData || insertedData.length === 0) {
      throw new Error(
        "Order item was not created properly. Please check your permissions.",
      );
    }

    return withLegacyId(insertedData[0] as OrderItem);
  },

  async updateOrderItem(
    id: number,
    item: Partial<OrderItem>,
  ): Promise<OrderItem> {
    const updatePayload = stripIdentityFields(item);

    const { data: updatedData, error } = await supabase
      .from("order_items")
      .update({ ...updatePayload, updated_at: new Date().toISOString() })
      .eq("local_id", id)
      .select();

    if (error) {
      console.error("Error updating order item:", error);
      throw error;
    }

    if (!updatedData || updatedData.length === 0) {
      throw new Error(
        "Order item was not updated. It may not exist or you lack UPDATE permissions.",
      );
    }

    return withLegacyId(updatedData[0] as OrderItem);
  },

  async deleteOrderItem(id: number): Promise<void> {
    const { error } = await supabase
      .from("order_items")
      .update({ deleted_at: new Date().toISOString() })
      .eq("local_id", id);

    if (error) {
      console.error("Error deleting order item:", error);
      throw error;
    }
  },
};
