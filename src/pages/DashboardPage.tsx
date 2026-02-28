import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ShoppingBag,
  TrendingUp,
  CircleDollarSign,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dashboardService } from "@/services/dashboard.service";
import type { DashboardStats } from "@/types/database";

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const metrics = [
    {
      title: "Total Revenue",
      value: `$${(stats?.total_revenue || 0).toLocaleString()}`,
      trend: "+0.0%",
      progress: 100,
      icon: TrendingUp,
      tone: "text-emerald-600",
      chip: "bg-emerald-500/15 text-emerald-700",
    },
    {
      title: "Total Profit",
      value: `$${(stats?.total_profit || 0).toLocaleString()}`,
      trend: "+0.0%",
      progress: 100,
      icon: CircleDollarSign,
      tone: "text-sky-600",
      chip: "bg-sky-500/15 text-sky-700",
    },
    {
      title: "Total Orders",
      value: `${stats?.total_orders || 0}`,
      trend: "+0.0%",
      progress: 100,
      icon: ShoppingBag,
      tone: "text-amber-600",
      chip: "bg-amber-500/15 text-amber-700",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-6xl space-y-6"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Operations Overview
          </h1>
          <p className="text-muted-foreground text-sm">
            Real-time signals from your liquid production floor.
          </p>
        </div>
        <Badge
          variant="outline"
          className="glass-pill w-fit border-white/70 bg-white/70 text-xs"
        >
          Synced Just Now
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.title} className="glass-panel border-white/60">
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between">
                <CardDescription>{metric.title}</CardDescription>
                <div className={`rounded-xl p-2 ${metric.chip}`}>
                  <metric.icon className={`size-4 ${metric.tone}`} />
                </div>
              </div>
              <CardTitle className="text-3xl">
                {isLoading ? "..." : metric.value}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="secondary" className="bg-white/65">
                  <ArrowUpRight className="size-3" />
                  {metric.trend}
                </Badge>
                <span className="text-muted-foreground">vs last week</span>
              </div>
              <Progress value={metric.progress} className="h-2 bg-white/55" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-1">
        <Card className="glass-panel border-white/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Recent Orders</CardTitle>
            <CardDescription>
              A breakdown of the most recent orders mapped in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/40 hover:bg-transparent">
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Service Fee</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Loading stats...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && stats?.recent_orders?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No recent orders found.
                    </TableCell>
                  </TableRow>
                )}
                {stats?.recent_orders?.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-white/35 hover:bg-white/30"
                  >
                    <TableCell className="font-medium">
                      {row.order_id || `ID: ${row.id}`}
                    </TableCell>
                    <TableCell>{row.customer_name || "Unknown"}</TableCell>
                    <TableCell>${row.total_price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-sky-500/45 bg-sky-500/10 text-sky-700"
                      >
                        {row.service_fee.toLocaleString()} (
                        {row.service_fee_type})
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString()
                        : ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
