import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, Package, FlaskRound } from "lucide-react";
import { type RawMaterial } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ConfirmationModal from "@/components/common/confirmation-modal";

interface MaterialListProps {
  materials: RawMaterial[];
  isLoading: boolean;
  onEdit: (material: RawMaterial) => void;
}

export default function MaterialList({ materials, isLoading, onEdit }: MaterialListProps) {
  const [deletingMaterial, setDeletingMaterial] = useState<RawMaterial | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/raw-materials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Material deleted successfully" });
      setDeletingMaterial(null);
    },
    onError: () => {
      toast({ title: "Failed to delete material", variant: "destructive" });
    },
  });

  const getCategoryColor = (categoryId: number | null) => {
    const colors = {
      1: "bg-blue-100 text-blue-800",
      2: "bg-purple-100 text-purple-800",
      3: "bg-green-100 text-green-800",
      4: "bg-yellow-100 text-yellow-800",
      5: "bg-red-100 text-red-800",
    };
    return colors[categoryId as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getCategoryName = (categoryId: number | null) => {
    const names = {
      1: "Base Oils",
      2: "Essential Oils", 
      3: "Butters",
      4: "Waxes",
      5: "Additives",
    };
    return names[categoryId as keyof typeof names] || "Uncategorized";
  };

  const handleDelete = (material: RawMaterial) => {
    setDeletingMaterial(material);
  };

  const confirmDelete = () => {
    if (deletingMaterial) {
      deleteMutation.mutate(deletingMaterial.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center space-x-4">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
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

  if (materials.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No materials found</h3>
        <p className="text-slate-600">Get started by adding your first raw material.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-slate-600">Material</th>
              <th className="text-left p-4 text-sm font-medium text-slate-600">Category</th>
              <th className="text-left p-4 text-sm font-medium text-slate-600">Vendor</th>
              <th className="text-right p-4 text-sm font-medium text-slate-600">Unit Cost</th>
              <th className="text-right p-4 text-sm font-medium text-slate-600">Stock</th>
              <th className="text-right p-4 text-sm font-medium text-slate-600">Total Value</th>
              <th className="text-center p-4 text-sm font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {materials.map((material) => {
              const isLowStock = Number(material.quantity) < 5;
              const categoryColor = getCategoryColor(material.categoryId);
              const categoryName = getCategoryName(material.categoryId);
              
              return (
                <tr key={material.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        material.categoryId === 2 ? "bg-purple-100" : "bg-blue-100"
                      }`}>
                        {material.categoryId === 2 ? (
                          <FlaskRound className={`h-4 w-4 ${
                            material.categoryId === 2 ? "text-purple-600" : "text-blue-600"
                          }`} />
                        ) : (
                          <Package className={`h-4 w-4 ${
                            material.categoryId === 2 ? "text-purple-600" : "text-blue-600"
                          }`} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{material.name}</p>
                        <p className="text-sm text-slate-500">
                          {material.sku || `MAT-${material.id.toString().padStart(3, '0')}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge className={categoryColor}>
                      {categoryName}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-slate-900">
                      {material.vendorId ? `Vendor ${material.vendorId}` : "No vendor"}
                    </p>
                  </td>
                  <td className="p-4 text-right">
                    <p className="text-sm font-medium text-slate-900">
                      ${material.unitCost}/{material.unit}
                    </p>
                  </td>
                  <td className="p-4 text-right">
                    <p className={`text-sm ${isLowStock ? "text-amber-600 font-medium" : "text-slate-900"}`}>
                      {material.quantity}{material.unit}
                    </p>
                  </td>
                  <td className="p-4 text-right">
                    <p className="text-sm font-medium text-slate-900">
                      ${material.totalCost}
                    </p>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(material)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(material)}
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
        isOpen={!!deletingMaterial}
        onClose={() => setDeletingMaterial(null)}
        onConfirm={confirmDelete}
        title="Delete Material"
        description={`Are you sure you want to delete "${deletingMaterial?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
