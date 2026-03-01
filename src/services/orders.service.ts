import { supabase } from "@/lib/supabase";
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

export const ordersService = {
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
    return (data || []) as OrderWithItems[];
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
      data: (data ?? []) as OrderWithItems[],
      count: count ?? 0,
    };
  },

  async getOrderStats(): Promise<OrderStatsSummary> {
    const [totalResult, pendingResult, completedResult, withCustomerResult] =
      await Promise.all([
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("status", "pending"),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("status", "completed"),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
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
      .eq("id", id)
      .is("deleted_at", null)
      .is("order_items.deleted_at", null)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching order by id:", error);
      throw error;
    }
    return data as OrderWithItems | null;
  },

  async createOrder(
    order: Omit<Order, "id" | "created_at" | "updated_at" | "deleted_at">,
    items: Omit<
      OrderItem,
      "id" | "order_id" | "created_at" | "updated_at" | "deleted_at"
    >[],
  ): Promise<OrderWithItems> {
    const { data: newOrderData, error: orderError } = await supabase
      .from("orders")
      .insert(order)
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

    const newOrder = newOrderData[0];

    if (items && items.length > 0) {
      const itemsToInsert = items.map((item) => ({
        ...item,
        order_id: newOrder.id,
      }));

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
    const { data: updatedData, error } = await supabase
      .from("orders")
      .update({ ...order, updated_at: new Date().toISOString() })
      .eq("id", id)
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

    return updatedData[0];
  },

  async deleteOrder(id: number): Promise<void> {
    const { error } = await supabase
      .from("orders")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

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
    const { data: insertedData, error } = await supabase
      .from("order_items")
      .insert(item)
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

    return insertedData[0];
  },

  async updateOrderItem(
    id: number,
    item: Partial<OrderItem>,
  ): Promise<OrderItem> {
    const { data: updatedData, error } = await supabase
      .from("order_items")
      .update({ ...item, updated_at: new Date().toISOString() })
      .eq("id", id)
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

    return updatedData[0];
  },

  async deleteOrderItem(id: number): Promise<void> {
    const { error } = await supabase
      .from("order_items")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error deleting order item:", error);
      throw error;
    }
  },
};
