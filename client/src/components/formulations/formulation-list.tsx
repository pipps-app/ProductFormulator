import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, FlaskRound, Calculator, ChevronUp, ChevronDown } from "lucide-react";
import { type Formulation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ConfirmationModal from "@/components/common/confirmation-modal";

type FormulationSortField = 'name' | 'totalCost' | 'profitMargin';
type SortDirection = 'asc' | 'desc';

interface FormulationListProps {
  formulations: Formulation[];
  isLoading: boolean;
  onEdit: (formulation: Formulation) => void;
  sortField: FormulationSortField;
  sortDirection: SortDirection;
  onSort: (field: FormulationSortField) => void;
}

export default function FormulationList({ formulations, isLoading, onEdit, sortField, sortDirection, onSort }: FormulationListProps) {
  const [deletingFormulation, setDeletingFormulation] = useState<Formulation | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/formulations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Formulation deleted successfully" });
      setDeletingFormulation(null);
    },
    onError: () => {
      toast({ title: "Failed to delete formulation", variant: "destructive" });
    },
  });

  const handleDelete = (formulation: Formulation) => {
    setDeletingFormulation(formulation);
  };

  const confirmDelete = () => {
    if (deletingFormulation) {
      deleteMutation.mutate(deletingFormulation.id);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
    );
  };

  const getProfitMarginColor = (margin: string) => {
    const marginValue = Number(margin);
    if (marginValue >= 40) return "text-green-600";
    if (marginValue >= 20) return "text-yellow-600";
    return "text-red-600";
  };

  const SortableHeader = ({ field, children, className = "" }: { 
    field: FormulationSortField; 
    children: React.ReactNode; 
    className?: string; 
  }) => (
    <th 
      className={`p-4 text-sm font-medium text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors ${className}`}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          sortDirection === 'asc' ? 
            <ChevronUp className="h-4 w-4" /> : 
            <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </th>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center space-x-4">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (formulations.length === 0) {
    return (
      <div className="text-center py-12">
        <FlaskRound className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No formulations found</h3>
        <p className="text-slate-600">Create your first formulation to start calculating costs and margins.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-slate-600">Formulation</th>
              <th className="text-left p-4 text-sm font-medium text-slate-600">Batch Size</th>
              <th className="text-right p-4 text-sm font-medium text-slate-600">Total Cost</th>
              <th className="text-right p-4 text-sm font-medium text-slate-600">Unit Cost</th>
              <th className="text-right p-4 text-sm font-medium text-slate-600">Profit Margin</th>
              <th className="text-right p-4 text-sm font-medium text-slate-600">Target Price</th>
              <th className="text-center p-4 text-sm font-medium text-slate-600">Status</th>
              <th className="text-center p-4 text-sm font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {formulations.map((formulation) => {
              const hasTargetPrice = formulation.targetPrice && Number(formulation.targetPrice) > 0;
              const targetPrice = Number(formulation.targetPrice || 0);
              const totalCost = Number(formulation.totalCost || 0);
              const actualProfitMargin = hasTargetPrice && targetPrice > 0 
                ? ((targetPrice - totalCost) / targetPrice * 100) 
                : 0;
              const profitMarginColor = getProfitMarginColor(actualProfitMargin.toString());
              
              return (
                <tr key={formulation.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <FlaskRound className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{formulation.name}</p>
                        {formulation.description && (
                          <p className="text-sm text-slate-500 truncate max-w-xs">
                            {formulation.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-slate-900">
                      {formulation.batchSize} {formulation.batchUnit}
                    </p>
                  </td>
                  <td className="p-4 text-right">
                    <p className="text-sm font-medium text-slate-900">
                      ${Number(formulation.totalCost).toFixed(2)}
                    </p>
                  </td>
                  <td className="p-4 text-right">
                    <p className="text-sm font-medium text-slate-900">
                      ${Number(formulation.unitCost).toFixed(4)}
                    </p>
                  </td>
                  <td className="p-4 text-right">
                    <p className={`text-sm font-medium ${profitMarginColor}`}>
                      {hasTargetPrice ? actualProfitMargin.toFixed(1) : "0.0"}%
                    </p>
                  </td>
                  <td className="p-4 text-right">
                    {hasTargetPrice ? (
                      <p className="text-sm font-medium text-slate-900">
                        ${Number(formulation.targetPrice).toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500">Not set</p>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {getStatusBadge(formulation.isActive ?? true)}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(formulation)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(formulation)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={!!deletingFormulation}
        onClose={() => setDeletingFormulation(null)}
        onConfirm={confirmDelete}
        title="Delete Formulation"
        description={`Are you sure you want to delete "${deletingFormulation?.name}"? This action cannot be undone and will remove all associated ingredients.`}
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
