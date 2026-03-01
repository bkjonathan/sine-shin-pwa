import { useMemo } from "react";
import { CircleCheckBig, Clock3, PackageSearch, UserRoundCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { OrderStatsSummary } from "@/services/orders.service";

interface OrderStatsCardsProps {
  stats: OrderStatsSummary;
}

export const OrderStatsCards = ({ stats }: OrderStatsCardsProps) => {
  const metrics = useMemo(() => {
    const { total, pending, completed, withCustomer } = stats;

    return [
      {
        label: "Total Orders",
        value: total.toLocaleString(),
        helper: "All recorded orders",
        icon: PackageSearch,
      },
      {
        label: "Pending Orders",
        value: pending.toLocaleString(),
        helper: `${Math.round(total === 0 ? 0 : (pending / total) * 100)}% of total`,
        icon: Clock3,
      },
      {
        label: "Completed Orders",
        value: completed.toLocaleString(),
        helper: `${Math.round(total === 0 ? 0 : (completed / total) * 100)}% closed`,
        icon: CircleCheckBig,
      },
      {
        label: "Mapped Customers",
        value: withCustomer.toLocaleString(),
        helper: `${Math.round(total === 0 ? 0 : (withCustomer / total) * 100)}% linked`,
        icon: UserRoundCheck,
      },
    ];
  }, [stats]);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="glass-panel border-white/60 dark:border-white/25">
          <CardContent className="flex items-start justify-between p-5">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                {metric.label}
              </p>
              <p className="text-2xl font-semibold tracking-tight">{metric.value}</p>
              <p className="text-muted-foreground text-xs">{metric.helper}</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/70 p-2.5 dark:border-white/25 dark:bg-slate-900/55">
              <metric.icon className="text-foreground size-4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
};
