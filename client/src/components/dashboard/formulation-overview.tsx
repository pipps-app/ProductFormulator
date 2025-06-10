import { useFormulations } from "@/hooks/use-formulations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskRound, TrendingUp, DollarSign, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function FormulationOverview() {
  const { data: formulations, isLoading } = useFormulations();

  const activeFormulations = formulations?.filter(f => f.isActive) || [];
  
  // Calculate aggregate metrics from formulations
  const totalTargetPrice = activeFormulations.reduce((sum, f) => 
    sum + (f.targetPrice ? Number(f.targetPrice) : 0), 0
  );
  
  // Calculate profit margin based on selling price: (Selling Price - Cost) / Selling Price * 100
  const avgProfitMargin = activeFormulations.length > 0 
    ? activeFormulations.reduce((sum, f) => {
        const targetPrice = f.targetPrice ? Number(f.targetPrice) : 0;
        const cost = Number(f.totalCost);
        if (targetPrice > 0) {
          return sum + ((targetPrice - cost) / targetPrice * 100);
        }
        return sum;
      }, 0) / activeFormulations.filter(f => f.targetPrice && Number(f.targetPrice) > 0).length
    : 0;

  const totalCost = activeFormulations.reduce((sum, f) => sum + Number(f.totalCost), 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Formulation Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
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
        <CardTitle className="flex items-center">
          <FlaskRound className="h-5 w-5 mr-2" />
          Formulation Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-slate-600">
              <Target className="h-4 w-4 mr-1" />
              Total Target Revenue
            </div>
            <div className="text-2xl font-bold text-slate-900">
              ${totalTargetPrice.toFixed(2)}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-slate-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              Average Profit Margin
            </div>
            <div className="text-2xl font-bold text-green-600">
              {avgProfitMargin.toFixed(1)}%
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-sm text-slate-600">
              <DollarSign className="h-4 w-4 mr-1" />
              Total Production Cost
            </div>
            <div className="text-2xl font-bold text-slate-900">
              ${totalCost.toFixed(2)}
            </div>
          </div>
        </div>

        {activeFormulations.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Active Formulations</h4>
            <div className="space-y-2">
              {activeFormulations.slice(0, 3).map((formulation) => {
                const targetPrice = formulation.targetPrice ? Number(formulation.targetPrice) : 0;
                const cost = Number(formulation.totalCost);
                const actualProfitMargin = targetPrice > 0 ? ((targetPrice - cost) / targetPrice * 100) : 0;
                
                return (
                  <div key={formulation.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{formulation.name}</div>
                      <div className="text-xs text-slate-600">
                        Cost: ${cost.toFixed(2)} | 
                        Target: ${targetPrice > 0 ? targetPrice.toFixed(2) : 'Not set'}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {actualProfitMargin.toFixed(1)}% margin
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}