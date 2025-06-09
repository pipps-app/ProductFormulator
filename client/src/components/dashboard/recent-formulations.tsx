import { useFormulations } from "@/hooks/use-formulations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskRound, Leaf, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function RecentFormulations() {
  const { data: formulations, isLoading } = useFormulations();

  const recentFormulations = formulations?.slice(0, 3) || [];

  const icons = [FlaskRound, Leaf, Heart];
  const gradients = [
    "from-blue-500 to-purple-600",
    "from-green-500 to-teal-600",
    "from-pink-500 to-rose-600",
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Formulations</CardTitle>
            <Skeleton className="h-4 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-12 ml-auto" />
                  <Skeleton className="h-3 w-16 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Formulations</CardTitle>
          <Link href="/formulations" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentFormulations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No formulations yet. Create your first formulation to get started.
            </div>
          ) : (
            recentFormulations.map((formulation, index) => {
              const Icon = icons[index % icons.length];
              const gradient = gradients[index % gradients.length];
              
              return (
                <div
                  key={formulation.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{formulation.name}</h4>
                      <p className="text-sm text-slate-500">
                        {formulation.batchSize} {formulation.batchUnit} batch • Updated recently
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">${formulation.unitCost}</p>
                    <p className="text-sm text-green-600">{formulation.profitMargin}% margin</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
