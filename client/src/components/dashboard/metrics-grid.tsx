import { Card, CardContent } from "@/components/ui/card";
import { Package, FlaskRound, TrendingUp, DollarSign, ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricsGridProps {
  stats?: {
    totalMaterials: number;
    activeFormulations: number;
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
      change: "+12.5%",
      positive: true,
    },
    {
      title: "Active Formulations",
      value: stats?.activeFormulations || 0,
      icon: FlaskRound,
      color: "emerald",
      change: "+8.1%",
      positive: true,
    },
    {
      title: "Avg. Profit Margin",
      value: `${stats?.avgProfitMargin || 0}%`,
      icon: TrendingUp,
      color: "green",
      change: "+2.3%",
      positive: true,
    },
    {
      title: "Total Inventory Value",
      value: `$${stats?.inventoryValue || "0.00"}`,
      icon: DollarSign,
      color: "purple",
      change: "-3.2%",
      positive: false,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const colorClasses = {
          blue: "bg-blue-50 text-blue-600",
          emerald: "bg-emerald-50 text-emerald-600",
          green: "bg-green-50 text-green-600",
          purple: "bg-purple-50 text-purple-600",
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
              <div className="flex items-center mt-4">
                <span className={`text-sm font-medium flex items-center ${
                  metric.positive ? "text-green-600" : "text-red-600"
                }`}>
                  {metric.positive ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {metric.change}
                </span>
                <span className="text-sm text-slate-500 ml-2">vs last month</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
