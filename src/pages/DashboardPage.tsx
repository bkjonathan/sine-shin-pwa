import { useEffect, useState } from "react";
import {
  subDays,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
  format,
} from "date-fns";
import type { DateRange } from "react-day-picker";
import { motion } from "framer-motion";
import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  Truck,
  LogOut,
  Calendar,
  ChevronDown,
  PackageSearch,
  UserRoundSearch,
  HandCoins,
  Settings,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { dashboardService } from "@/services/dashboard.service";
import type { DashboardStats } from "@/types/database";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const DashboardPage = () => {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [timeFilter, setTimeFilter] = useState("3 Months");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateField, setDateField] = useState<"order_date" | "created_at">(
    "order_date",
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        let dateFrom: string | undefined;
        let dateTo: string | undefined;

        const end = endOfDay(new Date());
        dateTo = end.toISOString();

        switch (timeFilter) {
          case "This Week":
            dateFrom = startOfDay(subDays(new Date(), 7)).toISOString();
            break;
          case "This Month":
            dateFrom = startOfDay(subMonths(new Date(), 1)).toISOString();
            break;
          case "3 Months":
            dateFrom = startOfDay(subMonths(new Date(), 3)).toISOString();
            break;
          case "6 Months":
            dateFrom = startOfDay(subMonths(new Date(), 6)).toISOString();
            break;
          case "This Year":
            dateFrom = startOfDay(subYears(new Date(), 1)).toISOString();
            break;
          case "Custom":
            if (dateRange?.from) {
              dateFrom = startOfDay(dateRange.from).toISOString();
            }
            if (dateRange?.to) {
              dateTo = endOfDay(dateRange.to).toISOString();
            } else if (dateRange?.from) {
              dateTo = endOfDay(dateRange.from).toISOString();
            } else {
              dateFrom = undefined;
              dateTo = undefined;
            }
            break;
          default:
            dateFrom = undefined;
            dateTo = undefined;
        }

        const data = await dashboardService.getDashboardStats({
          dateFrom,
          dateTo,
          dateField,
          status:
            statusFilter === "All" ? undefined : statusFilter.toLowerCase(),
        });
        setStats(data);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [timeFilter, statusFilter, dateRange, dateField]);

  const userName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Good morning,"
      : hour < 18
        ? "Good afternoon,"
        : "Good evening,";

  const timeOptions = [
    "This Week",
    "This Month",
    "3 Months",
    "6 Months",
    "This Year",
    "Custom",
  ];

  const statusOptions = [
    { label: "All", color: "bg-pink-500" },
    { label: "Pending", color: "bg-amber-400" },
    { label: "Confirmed", color: "bg-emerald-400" },
    { label: "Shipping", color: "bg-sky-400" },
    { label: "Completed", color: "bg-green-500" },
    { label: "Cancelled", color: "bg-red-400" },
  ];

  const metrics = [
    {
      title: "Total Revenue",
      value: `฿ ${(stats?.total_revenue || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      bgClass: "bg-[#e1ecfc]/80 backdrop-blur-sm",
      iconBgClass: "bg-sky-500 text-white",
    },
    {
      title: "Total Orders",
      value: `${stats?.total_orders || 0}`,
      icon: ShoppingBag,
      bgClass: "bg-[#e3dcfa]/80 backdrop-blur-sm",
      iconBgClass: "bg-purple-500 text-white",
    },
    {
      title: "Total Customers",
      value: `${stats?.total_customers || 0}`,
      icon: Users,
      bgClass: "bg-[#d3ebe1]/80 backdrop-blur-sm",
      iconBgClass: "bg-emerald-500 text-white",
    },
    {
      title: "Total Profit",
      value: `฿ ${(stats?.total_profit || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: TrendingUp,
      bgClass: "bg-[#f9eddf]/80 backdrop-blur-sm",
      iconBgClass: "bg-orange-500 text-white",
    },
    {
      title: "Total Cargo Fee",
      value: `฿ ${(stats?.total_cargo_fee || 0).toLocaleString()}`,
      icon: Truck,
      bgClass: "bg-[#ddeafa]/80 backdrop-blur-sm",
      iconBgClass: "bg-blue-500 text-white",
    },
  ];

  const quickActions = [
    {
      label: "Orders",
      path: "/orders",
      icon: PackageSearch,
      iconBgClass: "bg-sky-500 text-white",
    },
    {
      label: "Customers",
      path: "/customers",
      icon: UserRoundSearch,
      iconBgClass: "bg-purple-500 text-white",
    },
    {
      label: "Expenses",
      path: "/expenses",
      icon: HandCoins,
      iconBgClass: "bg-orange-500 text-white",
    },
    {
      label: "Settings",
      path: "/settings",
      icon: Settings,
      iconBgClass: "bg-amber-500 text-white",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-6xl space-y-2 pb-10"
    >
      {/* Header Area */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Avatar className="size-14 shadow-sm border-[3px] border-white bg-white">
            <AvatarFallback className="font-bold text-slate-700 bg-sky-100 text-xl">
              {userName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            {greeting} <span className="text-pink-500">{userName}</span>
          </h1>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-2xl bg-white shadow-sm border-slate-100 h-11 w-11 text-slate-500 hover:text-red-500 hover:bg-slate-50 shrink-0"
          onClick={() => void signOut()}
        >
          <LogOut className="size-5" />
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white/95 backdrop-blur-2xl rounded-[1.5rem] p-4 shadow-sm border border-white mb-6">
        <div className="flex flex-col gap-4">
          {/* Time Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {timeOptions.map((opt) => {
              const isActive = timeFilter === opt;

              if (opt === "Custom") {
                return (
                  <Popover key={opt}>
                    <PopoverTrigger asChild>
                      <button
                        onClick={() => setTimeFilter(opt)}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors flex items-center gap-2",
                          isActive
                            ? "bg-pink-100 text-pink-600"
                            : "bg-transparent text-slate-400 border border-slate-200 hover:bg-slate-50 hover:text-slate-600",
                        )}
                      >
                        {isActive && dateRange?.from ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")}
                            {dateRange.to
                              ? ` - ${format(dateRange.to, "LLL dd, y")}`
                              : ""}
                          </>
                        ) : (
                          "Custom"
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                );
              }

              return (
                <button
                  key={opt}
                  onClick={() => setTimeFilter(opt)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors",
                    isActive
                      ? "bg-pink-100 text-pink-600"
                      : "bg-transparent text-slate-400 border border-slate-200 hover:bg-slate-50 hover:text-slate-600",
                  )}
                >
                  {opt}
                </button>
              );
            })}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-semibold text-slate-400 border border-slate-200 hover:bg-slate-50 hover:text-slate-600 ml-auto md:ml-2">
                  <Calendar className="size-3.5" />
                  {dateField === "order_date" ? "Order Date" : "Created Date"}
                  <ChevronDown className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="rounded-2xl p-2 min-w-[140px] border-white backdrop-blur-3xl bg-white/95 shadow-sm"
                align="end"
              >
                <DropdownMenuRadioGroup
                  value={dateField}
                  onValueChange={(v) =>
                    setDateField(v as "order_date" | "created_at")
                  }
                >
                  <DropdownMenuRadioItem
                    value="order_date"
                    className="rounded-xl text-[13px] font-semibold text-slate-600 h-9 data-[state=checked]:text-pink-600 data-[state=checked]:bg-pink-50"
                  >
                    Order Date
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="created_at"
                    className="rounded-xl text-[13px] font-semibold text-slate-600 h-9 data-[state=checked]:text-pink-600 data-[state=checked]:bg-pink-50"
                  >
                    Created Date
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-2">
              Status
            </span>
            {statusOptions.map((opt) => {
              const isActive = statusFilter === opt.label;
              return (
                <button
                  key={opt.label}
                  onClick={() => setStatusFilter(opt.label)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors",
                    isActive
                      ? "bg-slate-100 text-slate-800"
                      : "bg-transparent text-slate-400 border border-slate-200 hover:bg-slate-50 hover:text-slate-600",
                  )}
                >
                  <span className={cn("size-2 rounded-full", opt.color)} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 pt-2">
        {metrics.map((metric) => (
          <div
            key={metric.title}
            className={cn(
              "p-5 rounded-[1.4rem] flex flex-col justify-center border border-white/40",
              metric.bgClass,
            )}
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                  metric.iconBgClass,
                )}
              >
                <metric.icon className="size-4" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {metric.title}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
              {isLoading ? "..." : metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white/95 backdrop-blur-2xl rounded-[1.5rem] p-6 shadow-sm border border-white min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">
              Recent Activity
            </h2>
            <Link
              to="/orders"
              className="text-sm font-bold text-pink-500 hover:text-pink-600 transition-colors flex items-center gap-1"
            >
              View All <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-slate-500 text-sm font-medium">
                Loading activities...
              </div>
            ) : stats?.recent_orders?.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm font-medium">
                No recent orders found.
              </div>
            ) : (
              stats?.recent_orders?.map((order, i) => {
                const colors = [
                  "bg-emerald-500",
                  "bg-sky-500",
                  "bg-orange-500",
                  "bg-purple-500",
                  "bg-indigo-500",
                ];
                const bgCol = colors[i % colors.length];

                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between group py-1.5"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar
                        className={cn(
                          "size-11 text-white font-bold text-sm shadow-sm",
                          bgCol,
                        )}
                      >
                        <AvatarFallback className="bg-transparent">
                          {order.customer_name?.substring(0, 2).toUpperCase() ||
                            "UN"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {order.customer_name || "Unknown"}
                        </p>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">
                          {order.order_id || `ID: ${order.id}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center justify-end gap-6 sm:gap-12 w-1/3">
                      <span className="text-[15px] font-bold text-slate-800">
                        ฿{" "}
                        {order.total_price.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-[13px] font-semibold text-slate-400 w-16 text-right hidden sm:inline-block">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                              },
                            )
                          : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-[1.5rem] p-6 shadow-sm border border-white">
          <h2 className="text-lg font-bold text-slate-800 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.path}
                className="flex flex-col items-center justify-center p-6 border border-slate-100 rounded-[1.25rem] hover:shadow-md hover:border-slate-200 transition-all bg-white group cursor-pointer"
              >
                <div
                  className={cn(
                    "size-14 rounded-2xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300",
                    action.iconBgClass,
                  )}
                >
                  <action.icon className="size-6" />
                </div>
                <span className="text-[13px] font-bold text-slate-600">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
