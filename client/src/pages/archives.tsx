import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Archive, ArchiveRestore, X, ArrowLeft } from "lucide-react";
import FormulationList from "@/components/formulations/formulation-list";
import FormulationForm from "@/components/formulations/formulation-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFormulations } from "@/hooks/use-formulations";
import { LandscapeNotice } from "@/components/common/mobile-notice";
import { Link } from "wouter";

type FormulationSortField = 'name' | 'totalCost' | 'profitMargin' | 'markupPercentage' | 'targetPrice';
type SortDirection = 'asc' | 'desc';

export default function Archives() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<FormulationSortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingFormulation, setEditingFormulation] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Fetch all formulations including archived ones
  const { data: allFormulations, isLoading, refetch } = useFormulations(true);

  // Filter to show only archived formulations
  const archivedFormulations = useMemo(() => {
    return allFormulations?.filter(formulation => !formulation.isActive) || [];
  }, [allFormulations]);

  const filteredAndSortedFormulations = useMemo(() => {
    const filtered = archivedFormulations.filter(formulation => {
      const matchesSearch = formulation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formulation.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });

    return filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'totalCost':
          aValue = Number(a.totalCost || 0);
          bValue = Number(b.totalCost || 0);
          break;
        case 'profitMargin':
          const aTargetPrice = Number(a.targetPrice || 0);
          const aCost = Number(a.totalCost || 0);
          const bTargetPrice = Number(b.targetPrice || 0);
          const bCost = Number(b.totalCost || 0);
          aValue = aTargetPrice > 0 ? ((aTargetPrice - aCost) / aTargetPrice * 100) : 0;
          bValue = bTargetPrice > 0 ? ((bTargetPrice - bCost) / bTargetPrice * 100) : 0;
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
  }, [archivedFormulations, searchQuery, sortField, sortDirection]);

  const handleSort = (field: FormulationSortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (formulation: any) => {
    setEditingFormulation(formulation);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingFormulation(null);
    refetch(); // Refresh data after editing
  };

  return (
    <div className="space-y-6">
      <LandscapeNotice />
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/formulations">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Formulations
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Archive className="h-6 w-6 text-slate-600" />
              Archived Formulations
            </h2>
            <p className="text-slate-600 mt-1">View and restore your archived formulation recipes</p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-amber-900 mb-1">Search Archived Formulations</h3>
              <p className="text-sm text-amber-700">Find and restore formulations from your archive</p>
            </div>
            <div className="flex items-center space-x-4 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-4 h-5 w-5 text-amber-500" />
                <Input
                  placeholder="Search archived formulations by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base bg-white border-amber-300 focus:border-amber-500 focus:ring-amber-500"
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
            </div>
            {searchQuery && (
              <div className="text-center">
                <span className="text-sm text-amber-700">
                  Found {filteredAndSortedFormulations.length} archived formulation{filteredAndSortedFormulations.length !== 1 ? 's' : ''} 
                  {searchQuery && ` matching "${searchQuery}"`}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Archive Notice */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-4">
          <div className="flex items-start space-x-3">
            <Archive className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900 mb-1">About Archived Formulations</h4>
              <p className="text-sm text-amber-700">
                Archived formulations are preserved with their complete history and can be restored at any time. 
                They don't appear in your main formulations list but remain accessible here for future reference.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Archived Formulations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArchiveRestore className="h-5 w-5" />
            Archived Formulations
            {filteredAndSortedFormulations.length > 0 && (
              <span className="text-sm font-normal text-slate-500 ml-2">
                ({filteredAndSortedFormulations.length} archived)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAndSortedFormulations.length === 0 && !isLoading ? (
            <div className="text-center py-12">
              <Archive className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No archived formulations</h3>
              <p className="text-slate-600">
                {searchQuery 
                  ? `No archived formulations match "${searchQuery}"`
                  : "You haven't archived any formulations yet."
                }
              </p>
            </div>
          ) : (
            <FormulationList 
              formulations={filteredAndSortedFormulations as any}
              isLoading={isLoading}
              onEdit={handleEdit}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Formulation Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Archived Formulation</DialogTitle>
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
