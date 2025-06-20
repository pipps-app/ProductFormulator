import { useRecentActivity } from "@/hooks/use-formulations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, FlaskRound, Building2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

export default function RecentFormulations() {
  const { data: activities, isLoading } = useRecentActivity();

  const recentActivities = activities?.slice(0, 5) || [];

  const getIcon = (entityType: string, action: string) => {
    if (entityType === "material") return Package;
    if (entityType === "formulation") return FlaskRound;
    if (entityType === "vendor") return Building2;
    return Clock;
  };

  const getActionColor = (action: string) => {
    if (action === "create") return "text-green-600";
    if (action === "update") return "text-blue-600";
    if (action === "delete") return "text-red-600";
    return "text-gray-600";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Skeleton className="h-4 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3 border border-slate-200 rounded-lg">
                <Skeleton className="w-8 h-8 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentActivities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No recent activity</h3>
            <p className="text-slate-600">Activity will appear here when you add, edit, or delete items.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <span className="text-sm text-slate-600">{recentActivities.length} recent</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentActivities.map((activity) => {
            const IconComponent = getIcon(activity.entityType, activity.action);
            let description = "Activity occurred";
            
            try {
              const changes = JSON.parse(activity.changes || "{}");
              description = changes.description || description;
            } catch (e) {
              // Fallback for old format
            }

            return (
              <div key={activity.id} className="flex items-start space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={`p-2 rounded-lg ${getActionColor(activity.action)} bg-slate-100`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 break-words">{description}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : 'Recently'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}