import { supabase } from "@/lib/supabase";
import type { Order, OrderItem } from "@/types/database";

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export const ordersService = {
  async getOrders(): Promise<OrderWithItems[]> {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (*)
      `,
      )
      .is("deleted_at", null)
      .is("order_items.deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
    return (data || []) as OrderWithItems[];
  },

  async getOrderById(id: number): Promise<OrderWithItems | null> {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (*)
      `,
      )
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
