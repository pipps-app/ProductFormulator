import { Card, CardContent } from "@/components/ui/card";
import { Package, FlaskRound, Truck, TrendingUp, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricsGridProps {
  stats?: {
    totalMaterials: number;
    activeFormulations: number;
    vendorsCount: number;
    avgProfitMargin: string;
    inventoryValue: string;
  };
  isLoading: boolean;
}

export default function MetricsGrid({ stats, isLoading }: MetricsGridProps) {
  const metrics = [
    {
      title: "Total Materials",
      value: stats?.totalMaterials || 0,
      icon: Package,
      color: "blue",
    },
    {
      title: "Active Formulations",
      value: stats?.activeFormulations || 0,
      icon: FlaskRound,
      color: "emerald",
    },
    {
      title: "Vendors",
      value: stats?.vendorsCount || 0,
      icon: Truck,
      color: "purple",
    },
    {
      title: "Avg Profit Margin",
      value: stats?.avgProfitMargin ? `${stats.avgProfitMargin}%` : "0%",
      icon: TrendingUp,
      color: "green",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const colorClasses = {
          blue: "bg-blue-50 text-blue-600",
          emerald: "bg-emerald-50 text-emerald-600",
          purple: "bg-purple-50 text-purple-600",
          green: "bg-green-50 text-green-600",
          orange: "bg-orange-50 text-orange-600",
        };

        return (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{metric.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[metric.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
