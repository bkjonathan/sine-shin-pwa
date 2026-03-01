import { PencilLine, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateOrderTotal } from "@/components/orders/order-form.types";
import type { OrderWithItems } from "@/services/orders.service";

interface OrdersTableProps {
  orders: OrderWithItems[];
  totalOrders: number;
  filteredOrdersCount: number;
  isLoading: boolean;
  deletingId: number | null;
  customerNameById: Map<number, string>;
  onDelete: (id: number) => void;
}

const formatOrderDate = (value: string | null): string => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const OrdersTable = ({
  orders,
  totalOrders,
  filteredOrdersCount,
  isLoading,
  deletingId,
  customerNameById,
  onDelete,
}: OrdersTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/40 hover:bg-transparent dark:border-white/20">
          <TableHead>Order</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && (
          <TableRow>
            <TableCell colSpan={7} className="py-6 text-center">
              Loading orders...
            </TableCell>
          </TableRow>
        )}

        {!isLoading && totalOrders === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="py-6 text-center">
              No orders available yet.
            </TableCell>
          </TableRow>
        )}

        {!isLoading && totalOrders > 0 && filteredOrdersCount === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="py-6 text-center">
              No records match the current filters.
            </TableCell>
          </TableRow>
        )}

        {orders.map((order) => (
          <TableRow
            key={order.id}
            className="border-white/35 hover:bg-white/30 dark:border-white/15 dark:hover:bg-slate-900/45"
          >
            <TableCell className="font-medium">
              {order.order_id || `ID: ${order.id}`}
            </TableCell>
            <TableCell>
              {order.customer_id
                ? customerNameById.get(order.customer_id) || "Unknown"
                : "-"}
            </TableCell>
            <TableCell>{order.status || "-"}</TableCell>
            <TableCell>{order.order_items.length}</TableCell>
            <TableCell>${calculateOrderTotal(order).toLocaleString()}</TableCell>
            <TableCell>{formatOrderDate(order.order_date)}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/orders/${order.id}/edit`}>
                    <PencilLine className="size-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deletingId === order.id}
                  onClick={() => onDelete(order.id)}
                >
                  <Trash2 className="size-4" />
                  {deletingId === order.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
