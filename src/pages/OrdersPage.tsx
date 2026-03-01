import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CirclePlus, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrderFiltersBar } from "@/components/orders/OrderFiltersBar";
import { OrderStatsCards } from "@/components/orders/OrderStatsCards";
import { OrdersTable } from "@/components/orders/OrdersTable";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { customersService } from "@/services/customers.service";
import {
  ordersService,
  type OrderStatsSummary,
  type OrderWithItems,
} from "@/services/orders.service";
import type { Customer } from "@/types/database";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

const getPaginationPages = (
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push("ellipsis");
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);
  return pages;
};

export const OrdersPage = () => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStatsSummary>({
    total: 0,
    pending: 0,
    completed: 0,
    withCustomer: 0,
  });
  const [filteredOrdersCount, setFilteredOrdersCount] = useState(0);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      setError(null);
      const { data, count } = await ordersService.getOrdersPage({
        page: currentPage,
        pageSize,
        searchQuery,
        statusFilter,
        sourceFilter,
      });
      setOrders(data);
      setFilteredOrdersCount(count);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load orders.";
      setError(message);
      setOrders([]);
      setFilteredOrdersCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, sourceFilter, statusFilter]);

  const loadMetadata = useCallback(async () => {
    try {
      const [stats, filterOptions, customerData] = await Promise.all([
        ordersService.getOrderStats(),
        ordersService.getOrderFilterOptions(),
        customersService.getCustomers(),
      ]);

      setOrderStats(stats);
      setStatusOptions(filterOptions.statuses);
      setSourceOptions(filterOptions.orderSources);
      setCustomers(customerData);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load order metadata.";
      setError(message);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    void loadMetadata();
  }, [loadMetadata]);

  const customerNameById = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.name])),
    [customers],
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== "all" ||
    sourceFilter !== "all";

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, searchQuery, sourceFilter, statusFilter]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredOrdersCount / pageSize));
  }, [filteredOrdersCount, pageSize]);

  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage !== safeCurrentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  const visibleStart =
    filteredOrdersCount === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const visibleEnd = Math.min(safeCurrentPage * pageSize, filteredOrdersCount);
  const paginationPages = getPaginationPages(safeCurrentPage, totalPages);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSourceFilter("all");
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    await Promise.all([loadOrders(), loadMetadata()]);
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Delete this order?");
    if (!confirmed) {
      return;
    }

    setError(null);
    setDeletingId(id);

    try {
      await ordersService.deleteOrder(id);
      await Promise.all([loadOrders(), loadMetadata()]);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete order.";
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-7xl space-y-6 pb-8"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
            Order Management
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Order Directory</h1>
          <p className="text-muted-foreground text-sm">
            Search, filter, and maintain complete order records from one view.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="glass-pill w-fit text-xs">
            {orderStats.total.toLocaleString()} total orders
          </Badge>
          <Button variant="outline" size="sm" onClick={() => void handleRefresh()}>
            <RefreshCcw className="size-4" />
            Refresh
          </Button>
          <Button asChild size="sm">
            <Link to="/orders/new">
              <CirclePlus className="size-4" />
              Create Order
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <OrderStatsCards stats={orderStats} />

      <Card className="glass-panel border-white/60 dark:border-white/25">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">Order Records</CardTitle>
              <CardDescription>
                Results update instantly from search and filters.
              </CardDescription>
            </div>
            <Badge variant="outline" className="glass-pill text-xs">
              Showing {filteredOrdersCount.toLocaleString()} of{" "}
              {orderStats.total.toLocaleString()}
            </Badge>
          </div>

          <OrderFiltersBar
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            sourceFilter={sourceFilter}
            statusOptions={statusOptions}
            sourceOptions={sourceOptions}
            hasActiveFilters={hasActiveFilters}
            onSearchChange={setSearchQuery}
            onStatusChange={setStatusFilter}
            onSourceChange={setSourceFilter}
            onClear={handleClearFilters}
          />
        </CardHeader>

        <CardContent>
          <OrdersTable
            orders={orders}
            totalOrders={orderStats.total}
            filteredOrdersCount={filteredOrdersCount}
            isLoading={isLoading}
            deletingId={deletingId}
            customerNameById={customerNameById}
            onDelete={(id) => void handleDelete(id)}
          />

          {!isLoading && filteredOrdersCount > 0 && (
            <div className="mt-5 flex flex-col gap-4 border-t border-white/50 pt-4 dark:border-white/20 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-muted-foreground text-sm">
                  Showing {visibleStart.toLocaleString()}-{visibleEnd.toLocaleString()} of{" "}
                  {filteredOrdersCount.toLocaleString()} records
                </p>

                <div className="flex items-center gap-2">
                  <label htmlFor="page-size" className="text-muted-foreground text-sm">
                    Rows:
                  </label>
                  <select
                    id="page-size"
                    value={String(pageSize)}
                    onChange={(event) => setPageSize(Number(event.target.value))}
                    className="focus-visible:border-ring focus-visible:ring-ring/50 border-white/60 dark:border-white/25 h-9 rounded-xl border bg-white/48 dark:bg-slate-900/45 px-3 text-sm shadow-[0_10px_28px_-24px_rgba(15,23,42,0.75)] dark:shadow-[0_14px_30px_-24px_rgba(2,6,23,0.95)] backdrop-blur-xl outline-none focus-visible:ring-[3px]"
                  >
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Pagination className="mx-0 w-auto justify-start xl:justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (safeCurrentPage > 1) {
                          setCurrentPage(safeCurrentPage - 1);
                        }
                      }}
                      className={
                        safeCurrentPage === 1
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                    />
                  </PaginationItem>

                  {paginationPages.map((page, index) => {
                    if (page === "ellipsis") {
                      return (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={page === safeCurrentPage}
                          onClick={(event) => {
                            event.preventDefault();
                            setCurrentPage(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (safeCurrentPage < totalPages) {
                          setCurrentPage(safeCurrentPage + 1);
                        }
                      }}
                      className={
                        safeCurrentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
