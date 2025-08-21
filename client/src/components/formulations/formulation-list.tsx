import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, FlaskRound, Calculator, ChevronUp, ChevronDown, Eye, Archive, ArchiveRestore } from "lucide-react";
import { Link } from "wouter";
import ConfirmationModal from "@/components/common/confirmation-modal";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchFormulations, deleteFormulation, archiveFormulation, restoreFormulation, Formulation } from "@/store/formulationsSlice";
import { selectRawMaterials } from "@/store/selectors";
import { updateRawMaterialPrice } from "@/store/rawMaterialsSlice";
import { updateFormulation } from "@/store/formulationsSlice";

type FormulationSortField = 'name' | 'totalCost' | 'profitMargin';
type SortDirection = 'asc' | 'desc';

interface FormulationListProps {
  formulations: Formulation[];
  isLoading: boolean;
  sortField: FormulationSortField;
  sortDirection: SortDirection;
  onEdit: (formulation: Formulation) => void;
  onSort: (field: FormulationSortField) => void;
}

export default function FormulationList({ formulations, isLoading, sortField, sortDirection, onEdit, onSort }: FormulationListProps) {
  const [deletingFormulation, setDeletingFormulation] = useState<Formulation | null>(null);
  const [archivingFormulation, setArchivingFormulation] = useState<Formulation | null>(null);
  const [restoringFormulation, setRestoringFormulation] = useState<Formulation | null>(null);
  const dispatch = useAppDispatch();
  const rawMaterials = useAppSelector(selectRawMaterials);

  // Use the passed formulations data directly - costs should already be calculated by the API
  const sortedFormulations: Formulation[] = useMemo(() => {
    if (!formulations) return [];
    
    return formulations.slice().sort((a: Formulation, b: Formulation) => {
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
          aValue = Number(a.profitMargin || 0);
          bValue = Number(b.profitMargin || 0);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [formulations, sortField, sortDirection]);

  const handleDelete = (formulation: Formulation) => {
    setDeletingFormulation(formulation);
  };

  const handleArchive = (formulation: Formulation) => {
    setArchivingFormulation(formulation);
  };

  const handleRestore = (formulation: Formulation) => {
    setRestoringFormulation(formulation);
  };

  const confirmDelete = async () => {
    if (deletingFormulation) {
      try {
        const result = await dispatch(deleteFormulation(deletingFormulation.id)).unwrap();
        console.log('Delete result:', result);
        
        // Show user-friendly message based on result
        if (result.result.archived) {
          // Show toast or alert that it was archived instead
          alert(`Formulation "${deletingFormulation.name}" has been archived instead of deleted due to existing history.`);
        } else if (result.result.deleted) {
          alert(`Formulation "${deletingFormulation.name}" has been permanently deleted.`);
        }
      } catch (error) {
        alert(`Error: ${error}`);
      } finally {
        setDeletingFormulation(null);
      }
    }
  };

  const confirmArchive = async () => {
    if (archivingFormulation) {
      try {
        await dispatch(archiveFormulation(archivingFormulation.id)).unwrap();
        alert(`Formulation "${archivingFormulation.name}" has been archived.`);
      } catch (error) {
        alert(`Error: ${error}`);
      } finally {
        setArchivingFormulation(null);
      }
    }
  };

  const confirmRestore = async () => {
    if (restoringFormulation) {
      try {
        await dispatch(restoreFormulation(restoringFormulation.id)).unwrap();
        alert(`Formulation "${restoringFormulation.name}" has been restored from archive.`);
      } catch (error) {
        alert(`Error: ${error}`);
      } finally {
        setRestoringFormulation(null);
      }
    }
  };

  const formatCurrency = (value?: number) =>
    `$${(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
      onClick={() => {
        console.log('Sorting formulations by:', field);
        onSort(field);
      }}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field ? (
          sortDirection === 'asc' ?
            <ChevronUp className="h-4 w-4" /> :
            <ChevronDown className="h-4 w-4" />
        ) : (
          <div className="h-4 w-4 opacity-30">
            <ChevronUp className="h-4 w-4" />
          </div>
        )}
      </div>
    </th>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sortedFormulations.length === 0) {
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
              <SortableHeader field="name" className="text-left">Formulation</SortableHeader>
              <th className="text-left p-4 text-sm font-medium text-slate-600">Batch Size</th>
              <SortableHeader field="totalCost" className="text-right">Total Cost</SortableHeader>
              <th className="text-right p-4 text-sm font-medium text-slate-600">Unit Cost</th>
              <th className="text-center p-4 text-sm font-medium text-slate-600"># Ingredients</th>
              <SortableHeader field="profitMargin" className="text-right">Profit Margin</SortableHeader>
              <th className="text-right p-4 text-sm font-medium text-slate-600">Target Price</th>
              <th className="text-center p-4 text-sm font-medium text-slate-600">Status</th>
              <th className="text-center p-4 text-sm font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedFormulations.map((formulation: Formulation) => {
              const profitMarginColor = getProfitMarginColor(formulation.profitMargin?.toString() ?? "0");
              let targetPriceDisplay;
              
              if (formulation.targetPrice) {
                targetPriceDisplay = (
                  <span className="text-slate-900 font-medium">{formatCurrency(Number(formulation.targetPrice))}</span>
                );
              } else {
                // Calculate suggested target price (30% markup over total cost)
                const totalCost = Number(formulation.totalCost || 0);
                const markupPercentage = Number(formulation.markupPercentage || 30);
                const suggestedPrice = totalCost * (1 + markupPercentage / 100);
                targetPriceDisplay = (
                  <span className="italic text-blue-600" title="Suggested price (30% markup)">{formatCurrency(suggestedPrice)}</span>
                );
              }
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
                      {formatCurrency(Number(formulation.totalCost) || 0)}
                    </p>
                  </td>
                  <td className="p-4 text-right">
                    <p className="text-sm font-medium text-slate-900">
                      {formatCurrency(Number(formulation.unitCost) || 0)}
                    </p>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-sm font-medium text-slate-900">{formulation.ingredients?.length || 0}</span>
                  </td>
                  <td className="p-4 text-right">
                    <p className={`text-sm font-medium ${profitMarginColor}`}>{Number(formulation.profitMargin || 0).toFixed(1)}%</p>
                  </td>
                  <td className="p-4 text-right">
                    {targetPriceDisplay}
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
                        title="Edit formulation"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {formulation.isActive ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchive(formulation)}
                            title="Archive formulation"
                            className="text-orange-600 hover:text-orange-800"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(formulation)}
                            title="Delete formulation"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestore(formulation)}
                          title="Restore from archive"
                          className="text-green-600 hover:text-green-800"
                        >
                          <ArchiveRestore className="h-4 w-4" />
                        </Button>
                      )}
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
        description={`Are you sure you want to delete "${deletingFormulation?.name}"? If this formulation has history, it will be archived instead of permanently deleted.`}
        confirmText="Delete"
        isLoading={false}
      />

      <ConfirmationModal
        isOpen={!!archivingFormulation}
        onClose={() => setArchivingFormulation(null)}
        onConfirm={confirmArchive}
        title="Archive Formulation"
        description={`Are you sure you want to archive "${archivingFormulation?.name}"? Archived formulations can be restored later.`}
        confirmText="Archive"
        isLoading={false}
      />

      <ConfirmationModal
        isOpen={!!restoringFormulation}
        onClose={() => setRestoringFormulation(null)}
        onConfirm={confirmRestore}
        title="Restore Formulation"
        description={`Are you sure you want to restore "${restoringFormulation?.name}" from the archive?`}
        confirmText="Restore"
        isLoading={false}
      />
    </>
  );
}
