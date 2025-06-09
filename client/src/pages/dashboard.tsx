import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";
import MetricsGrid from "@/components/dashboard/metrics-grid";
import RecentFormulations from "@/components/dashboard/recent-formulations";
import MaterialsPreview from "@/components/dashboard/materials-preview";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, refetch } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-activity"],
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-600 mt-1">Overview of your formulation business</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={statsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Formulation
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <MetricsGrid stats={stats} isLoading={statsLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Formulations */}
        <div className="lg:col-span-2">
          <RecentFormulations />
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-slate-600">Base Materials</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">68%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-slate-600">Essential Oils</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">18%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-slate-600">Packaging</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">14%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Low Stock Alert</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <p className="text-sm font-medium text-amber-900">Shea Butter</p>
                    <p className="text-xs text-amber-700">2.3kg remaining</p>
                  </div>
                  <div className="text-amber-600">⚠️</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="text-sm font-medium text-red-900">Lavender EO</p>
                    <p className="text-xs text-red-700">45ml remaining</p>
                  </div>
                  <div className="text-red-600">⚠️</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Materials Preview */}
      <MaterialsPreview />
    </div>
  );
}
