import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, RefreshCw } from "lucide-react";
import FormulationList from "@/components/formulations/formulation-list";
import FormulationForm from "@/components/formulations/formulation-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFormulations } from "@/hooks/use-formulations";
import { useQueryClient } from "@tanstack/react-query";
import { LandscapeNotice } from "@/components/common/mobile-notice";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type FormulationSortField = 'name' | 'totalCost' | 'profitMargin';
type SortDirection = 'asc' | 'desc';

export default function Formulations() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFormulation, setEditingFormulation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortField, setSortField] = useState<FormulationSortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const { data: formulations, isLoading, refetch } = useFormulations();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filteredAndSortedFormulations = useMemo(() => {
    const filtered = formulations?.filter(formulation =>
      formulation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formulation.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'totalCost':
          aValue = Number(a.totalCost);
          bValue = Number(b.totalCost);
          break;
        case 'profitMargin':
          // Calculate actual profit margin based on target price and total cost
          const aTargetPrice = Number(a.targetPrice || 0);
          const aTotalCost = Number(a.totalCost || 0);
          const bTargetPrice = Number(b.targetPrice || 0);
          const bTotalCost = Number(b.totalCost || 0);
          
          aValue = aTargetPrice > 0 ? ((aTargetPrice - aTotalCost) / aTargetPrice * 100) : 0;
          bValue = bTargetPrice > 0 ? ((bTargetPrice - bTotalCost) / bTargetPrice * 100) : 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [formulations, searchQuery, sortField, sortDirection]);

  const handleSort = (field: FormulationSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (formulation: any) => {
    setEditingFormulation(formulation);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingFormulation(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // First refresh formulation costs to ensure they're up to date
      await apiRequest("POST", "/api/formulations/refresh-costs");
      
      // Small delay to ensure database writes are complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force invalidate all formulation-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key?.includes('/api/formulations') || key?.includes('/ingredients');
        }
      });
      
      // Force refetch with fresh data
      await refetch();
      
      toast({ title: "Costs refreshed and updated" });
    } catch (error) {
      toast({ 
        title: "Refresh completed", 
        description: "Some costs may need manual calculation",
        variant: "default"
      });
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div className="space-y-6">
      <LandscapeNotice />
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Product Formulations</h2>
          <p className="text-slate-600 mt-1">Create and manage your product recipes</p>
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
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Formulation
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
                placeholder="Search formulations..."
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
        </CardContent>
      </Card>

      {/* Formulations List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Formulations</CardTitle>
        </CardHeader>
        <CardContent>
          <FormulationList 
            formulations={filteredAndSortedFormulations}
            isLoading={isLoading}
            onEdit={handleEdit}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Formulation Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFormulation ? 'Edit Formulation' : 'New Formulation'}
            </DialogTitle>
          </DialogHeader>
          <FormulationForm 
            formulation={editingFormulation}
            onSuccess={handleCloseModal}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
