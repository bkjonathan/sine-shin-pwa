import { useMemo } from "react";
import { Building2, Globe2, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { CustomerStatsSummary } from "@/services/customers.service";

interface CustomerStatsCardsProps {
  stats: CustomerStatsSummary;
}

export const CustomerStatsCards = ({ stats }: CustomerStatsCardsProps) => {
  const metrics = useMemo(() => {
    const { total, withPhone, withPlatform, withSocialUrl } = stats;

    return [
      {
        label: "Total Customers",
        value: total.toLocaleString(),
        helper: "Active profiles",
        icon: Users,
      },
      {
        label: "Profiles With Phone",
        value: withPhone.toLocaleString(),
        helper: `${Math.round(
          total === 0 ? 0 : (withPhone / total) * 100,
        )}% contact readiness`,
        icon: Building2,
      },
      {
        label: "Digital Profiles",
        value: withPlatform.toLocaleString(),
        helper: `${withSocialUrl.toLocaleString()} with social links`,
        icon: Globe2,
      },
    ];
  }, [stats]);

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.label} className="glass-panel border-white/60">
          <CardContent className="flex items-start justify-between p-5">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                {metric.label}
              </p>
              <p className="text-2xl font-semibold tracking-tight">{metric.value}</p>
              <p className="text-muted-foreground text-xs">{metric.helper}</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/70 p-2.5">
              <metric.icon className="text-foreground size-4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
};
