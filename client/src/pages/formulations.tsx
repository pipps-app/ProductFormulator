import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, RefreshCw, X } from "lucide-react";
import FormulationList from "@/components/formulations/formulation-list";
import FormulationForm from "@/components/formulations/formulation-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFormulations } from "@/hooks/use-formulations";
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

type FormulationSortField = 'name' | 'totalCost' | 'profitMargin' | 'markupPercentage' | 'targetPrice';
type SortDirection = 'asc' | 'desc';

export default function Formulations() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFormulation, setEditingFormulation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortField, setSortField] = useState<FormulationSortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showArchived, setShowArchived] = useState(false);
  
  const { data: formulations, isLoading, refetch } = useFormulations(true); // Always fetch all formulations
  const { data: rawMaterials } = useMaterials();
  const { canCreate: canCreateFormulation } = useCanCreateResource('formulations');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filteredAndSortedFormulations = useMemo(() => {
    const filtered = formulations?.filter(formulation => {
      // Filter by archive status
      const matchesArchiveFilter = showArchived ? !formulation.isActive : formulation.isActive;
      
      // Filter by search query
      const matchesSearch = formulation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formulation.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesArchiveFilter && matchesSearch;
    }) || [];

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
        case 'markupPercentage':
          aValue = Number(a.markupPercentage || 30);
          bValue = Number(b.markupPercentage || 30);
          break;
        case 'targetPrice':
          aValue = Number(a.targetPrice || 0);
          bValue = Number(b.targetPrice || 0);
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
      
      // Remove all cached data to force fresh requests
      queryClient.removeQueries({ queryKey: ["/api/formulations"] });
      queryClient.removeQueries({ queryKey: ["/api/raw-materials"] });
      queryClient.removeQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.removeQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key?.includes('/api/formulations') || key?.includes('/ingredients');
        }
      });
      
      // Force complete refetch with fresh data - use timestamp to bypass server cache
      await queryClient.fetchQuery({
        queryKey: ["/api/formulations", Date.now()],
        queryFn: () => fetch(`/api/formulations?_t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }).then(res => res.json()),
        staleTime: 0,
        gcTime: 0
      });
      
      // Now invalidate and refetch the normal query
      await queryClient.invalidateQueries({ queryKey: ["/api/formulations"] });
      await refetch();
      
      toast({ 
        title: "Costs refreshed and updated", 
        description: "All formulation costs have been recalculated",
        duration: 3000
      });
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

  // Auto-refresh on mount and when window/tab regains focus
  useEffect(() => {
    // Refetch on mount
    refetch();
    // Refetch on window focus
    const handleFocus = () => refetch();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetch]);

  // Refetch formulations whenever raw material prices change
  useEffect(() => {
    if (rawMaterials && rawMaterials.length > 0) {
      console.log('Raw materials updated, refreshing formulation costs...');
      // Add a small delay to ensure database updates are complete
      const timeoutId = setTimeout(async () => {
        try {
          await apiRequest("POST", "/api/formulations/refresh-costs");
          await refetch();
          console.log('Formulation costs refreshed automatically');
          toast({ 
            title: "Costs Updated", 
            description: "Formulation costs have been recalculated based on updated materials",
            duration: 3000
          });
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        }
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [rawMaterials, refetch]);

  useEffect(() => {
    // Always fetch latest data on mount and on route change
    refetch();
    queryClient.invalidateQueries({ queryKey: ["/api/raw-materials"] });
  }, []); // Only on mount

  return (
    <div className="space-y-6">
      <LandscapeNotice />
      
      {/* Subscription Alerts */}
      <SoftLockAlert resourceType="formulations" className="mb-4" />
      <CreateBlockAlert resourceType="formulations" className="mb-4" />
      
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
          <Button onClick={() => setIsAddModalOpen(true)} disabled={!canCreateFormulation}>
            <Plus className="h-4 w-4 mr-2" />
            New Formulation
          </Button>
        </div>
      </div>

      {/* Enhanced Search Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-1">Find Your Formulations</h3>
              <p className="text-sm text-blue-700">Search by name, description, or filter by status</p>
            </div>
            <div className="flex items-center space-x-4 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-4 h-5 w-5 text-blue-500" />
                <Input
                  placeholder="Type to search formulations by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button variant="outline" className="h-12 px-6 border-blue-300 hover:bg-blue-50">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button 
                variant={showArchived ? "default" : "outline"} 
                className="h-12 px-6 border-blue-300 hover:bg-blue-50"
                onClick={() => setShowArchived(!showArchived)}
              >
                {showArchived ? "Show Active" : "Show Archived"}
              </Button>
            </div>
            {searchQuery && (
              <div className="text-center">
                <span className="text-sm text-blue-700">
                  Found {filteredAndSortedFormulations.length} formulation{filteredAndSortedFormulations.length !== 1 ? 's' : ''} 
                  {searchQuery && ` matching "${searchQuery}"`}
                </span>
              </div>
            )}
          </div>
          
          {/* Subscription Usage */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <SubscriptionUsage resourceType="formulations" showProgressBar />
          </div>
        </CardContent>
      </Card>

      {/* Refresh Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start space-x-3">
            <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Data Refresh Notice</h4>
              <p className="text-sm text-blue-700">
                After modifying raw material costs or formulation ingredients, click the "Refresh" button above to update calculated costs and see the latest values.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulations List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {showArchived ? "Archived Formulations" : "Active Formulations"}
            {filteredAndSortedFormulations.length > 0 && (
              <span className="text-sm font-normal text-slate-500 ml-2">
                ({filteredAndSortedFormulations.length} {showArchived ? "archived" : "active"})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormulationList 
            formulations={filteredAndSortedFormulations as any}
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
