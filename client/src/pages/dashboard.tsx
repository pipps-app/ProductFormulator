import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";
import { useState } from "react";
import MetricsGrid from "@/components/dashboard/metrics-grid";
import RecentFormulations from "@/components/dashboard/recent-formulations";
import MaterialsPreview from "@/components/dashboard/materials-preview";
import FormulationOverview from "@/components/dashboard/formulation-overview";
import { useDashboardStats, useRecentActivity } from "@/hooks/use-formulations";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, refetch } = useDashboardStats();
  const { data: recentActivity, isLoading: activityLoading, refetch: refetchActivity } = useRecentActivity();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force refetch all dashboard queries
      await Promise.all([
        refetch(),
        refetchActivity()
      ]);
      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/material-categories"] });
      // Also invalidate formulation ingredients
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key?.includes('/api/formulations') && key?.includes('/ingredients');
        }
      });
    } finally {
      // Add a small delay to ensure the animation is visible
      setTimeout(() => setIsRefreshing(false), 500);
    }
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
            disabled={isRefreshing || statsLoading}
            data-tour="refresh-button"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing || statsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Formulation
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div data-tour="dashboard-stats">
        <MetricsGrid stats={stats as any} isLoading={statsLoading} />
      </div>

      {/* Formulation Performance Overview */}
      <FormulationOverview />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Formulations */}
        <div className="lg:col-span-2">
          <RecentFormulations />
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                </div>
              ) : recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-900 capitalize">
                          {activity.action} {activity.entityType}
                        </p>
                        <p className="text-xs text-slate-500">
                          {activity.timestamp && !isNaN(new Date(activity.timestamp).getTime()) 
                            ? new Date(activity.timestamp).toLocaleDateString() 
                            : 'Recently'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Materials Preview */}
      <div data-tour="materials-preview">
        <MaterialsPreview />
      </div>
    </div>
  );
}
