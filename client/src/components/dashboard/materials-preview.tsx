import { useMaterials, useMaterialCategories } from "@/hooks/use-materials";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, Edit, Trash2, Package, FlaskRound } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function MaterialsPreview() {
  const { data: materials, isLoading } = useMaterials();
  const { data: categories } = useMaterialCategories();

  const recentMaterials = materials?.slice(0, 5) || [];

  const getCategoryInfo = (categoryId: number | null) => {
    if (!categoryId || !categories || !Array.isArray(categories)) {
      return {
        name: "Uncategorized",
        color: "bg-gray-100 text-gray-800"
      };
    }
    
    const category = categories.find((cat: any) => cat.id === categoryId);
    if (!category) {
      return {
        name: "Uncategorized", 
        color: "bg-gray-100 text-gray-800"
      };
    }

    // Convert category color to Tailwind classes
    const colorMap: Record<string, string> = {
      "blue": "bg-blue-100 text-blue-800",
      "#3b82f6": "bg-blue-100 text-blue-800",
      "green": "bg-green-100 text-green-800", 
      "#10b981": "bg-green-100 text-green-800",
      "red": "bg-red-100 text-red-800",
      "#ef4444": "bg-red-100 text-red-800",
      "yellow": "bg-yellow-100 text-yellow-800",
      "#f59e0b": "bg-yellow-100 text-yellow-800",
      "purple": "bg-purple-100 text-purple-800",
      "#8b5cf6": "bg-purple-100 text-purple-800",
      "pink": "bg-pink-100 text-pink-800",
      "indigo": "bg-indigo-100 text-indigo-800",
      "gray": "bg-gray-100 text-gray-800",
    };

    return {
      name: category.name,
      color: colorMap[category.color] || "bg-gray-100 text-gray-800"
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Materials</CardTitle>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-slate-200">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16" />
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
          <CardTitle>Recent Materials</CardTitle>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Link href="/materials" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all materials
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {recentMaterials.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No materials yet. Add your first material to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Material</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Category</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Vendor</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-600">Unit Cost</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-600">Stock</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-600">Value</th>
                  <th className="text-center p-4 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentMaterials.map((material, index) => {
                  const isLowStock = Number(material.quantity) < 5;
                  const categoryInfo = getCategoryInfo(material.categoryId);
                  
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
                        <Badge className={categoryInfo.color}>
                          {categoryInfo.name}
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
                          <Button variant="ghost" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
