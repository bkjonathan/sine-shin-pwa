import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Clock3,
  Layers,
  ShoppingBag,
  TrendingUp,
  Users,
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

const metrics = [
  {
    title: "Active Operators",
    value: "1,240",
    trend: "+8.2%",
    progress: 78,
    icon: Users,
    tone: "text-sky-600",
    chip: "bg-sky-500/15 text-sky-700",
  },
  {
    title: "Revenue Run Rate",
    value: "$45,231",
    trend: "+12.4%",
    progress: 66,
    icon: TrendingUp,
    tone: "text-emerald-600",
    chip: "bg-emerald-500/15 text-emerald-700",
  },
  {
    title: "Open Orders",
    value: "38",
    trend: "-2.1%",
    progress: 54,
    icon: ShoppingBag,
    tone: "text-amber-600",
    chip: "bg-amber-500/15 text-amber-700",
  },
];

const activityRows = [
  {
    order: "INV-2026-001",
    stage: "Cutting",
    assignee: "Jordan K.",
    status: "In Progress",
    eta: "22m",
  },
  {
    order: "INV-2026-004",
    stage: "Pattern",
    assignee: "Alex M.",
    status: "Completed",
    eta: "Done",
  },
  {
    order: "INV-2026-007",
    stage: "Sewing",
    assignee: "Priya R.",
    status: "Queued",
    eta: "1h 5m",
  },
  {
    order: "INV-2026-012",
    stage: "Finishing",
    assignee: "Noah T.",
    status: "In Progress",
    eta: "35m",
  },
];

export const DashboardPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-6xl space-y-6"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Operations Overview</h1>
          <p className="text-muted-foreground text-sm">
            Real-time signals from your liquid production floor.
          </p>
        </div>
        <Badge variant="outline" className="glass-pill w-fit border-white/70 bg-white/70 text-xs">
          Synced 10s ago
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
              <CardTitle className="text-3xl">{metric.value}</CardTitle>
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

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="glass-panel border-white/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Live Stage Activity</CardTitle>
            <CardDescription>
              Immediate status updates for active order flow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/40 hover:bg-transparent">
                  <TableHead>Order</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">ETA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityRows.map((row) => (
                  <TableRow key={row.order} className="border-white/35 hover:bg-white/30">
                    <TableCell className="font-medium">{row.order}</TableCell>
                    <TableCell>{row.stage}</TableCell>
                    <TableCell>{row.assignee}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          row.status === "Completed"
                            ? "border-emerald-500/45 bg-emerald-500/10 text-emerald-700"
                            : row.status === "In Progress"
                              ? "border-sky-500/45 bg-sky-500/10 text-sky-700"
                              : "border-amber-500/45 bg-amber-500/10 text-amber-700"
                        }
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{row.eta}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="glass-panel liquid-grid border-white/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Pipeline Health</CardTitle>
            <CardDescription>Stage throughput balance across the day.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Pattern", value: 96, icon: Layers },
              { name: "Cutting", value: 72, icon: Clock3 },
              { name: "Sewing", value: 51, icon: TrendingUp },
            ].map((item) => (
              <div key={item.name} className="space-y-2 rounded-2xl border border-white/55 bg-white/55 p-3 backdrop-blur-xl">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <item.icon className="text-primary size-4" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-muted-foreground">{item.value}%</span>
                </div>
                <Progress value={item.value} className="h-2 bg-white/60" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
