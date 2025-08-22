import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, RefreshCw } from "lucide-react";
import MaterialList from "@/components/materials/material-list";
import MaterialForm from "@/components/materials/material-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMaterials } from "@/hooks/use-materials";
import { useQueryClient } from "@tanstack/react-query";
import { LandscapeNotice } from "@/components/common/mobile-notice";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  SoftLockAlert, 
  CreateBlockAlert, 
  SubscriptionUsage 
} from "@/components/subscription/subscription-components";
import { useCanCreateResource } from "@/hooks/use-subscription";

type SortField = 'name' | 'unitCost' | 'totalValue' | 'category' | 'vendor';
type SortDirection = 'asc' | 'desc';

export default function Materials() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const { data: materials, isLoading, refetch } = useMaterials();
  const { canCreate: canCreateMaterial } = useCanCreateResource('materials');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filteredAndSortedMaterials = useMemo(() => {
    const filtered = materials?.filter(material =>
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'unitCost':
          aValue = Number(a.unitCost);
          bValue = Number(b.unitCost);
          break;
        case 'totalValue':
          aValue = Number(a.totalCost);
          bValue = Number(b.totalCost);
          break;
        case 'category':
          aValue = a.category?.name?.toLowerCase() || '';
          bValue = b.category?.name?.toLowerCase() || '';
          break;
        case 'vendor':
          aValue = a.vendor?.name?.toLowerCase() || '';
          bValue = b.vendor?.name?.toLowerCase() || '';
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [materials, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (material: any) => {
    setEditingMaterial(material);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingMaterial(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      // Refresh formulation costs to ensure they're up to date
      await apiRequest("POST", "/api/formulations/refresh-costs");
      // Invalidate related caches to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/material-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      toast({ title: "Data refreshed successfully" });
    } catch (error) {
      toast({ 
        title: "Refresh completed", 
        description: "Materials updated, some formulation costs may need manual refresh",
        variant: "default"
      });
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div className="space-y-6">
      <LandscapeNotice />
      
      {/* Subscription Alerts */}
      <SoftLockAlert resourceType="materials" className="mb-4" />
      <CreateBlockAlert resourceType="materials" className="mb-4" />
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Raw Materials</h2>
          <p className="text-slate-600 mt-1">Manage your materials and material costs</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            disabled={!canCreateMaterial}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
          
          {/* Subscription Usage */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <SubscriptionUsage resourceType="materials" showProgressBar />
          </div>
        </CardContent>
      </Card>

      {/* Materials List */}
      <Card>
        <CardHeader>
          <CardTitle>Materials Library</CardTitle>
        </CardHeader>
        <CardContent>
          <MaterialList 
            materials={filteredAndSortedMaterials}
            isLoading={isLoading}
            onEdit={handleEdit}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Material Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? 'Edit Material' : 'Add New Material'}
            </DialogTitle>
          </DialogHeader>
          <MaterialForm 
            material={editingMaterial}
            onSuccess={handleCloseModal}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
