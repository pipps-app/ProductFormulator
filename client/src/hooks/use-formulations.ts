import { useQuery } from "@tanstack/react-query";
import { type Formulation } from "@shared/schema";

export function useFormulations() {
  return useQuery<Formulation[]>({
    queryKey: ["/api/formulations"],
  });
}

export function useFormulation(id: number) {
  return useQuery<Formulation>({
    queryKey: ["/api/formulations", id],
    enabled: !!id,
  });
}

export function useFormulationIngredients(formulationId: number) {
  return useQuery({
    queryKey: ["/api/formulations", formulationId, "ingredients"],
    enabled: !!formulationId,
  });
}

export function useDashboardStats() {
  return useQuery<{
    totalMaterials: number;
    activeFormulations: number;
    vendorsCount: number;
    avgProfitMargin: string;
    inventoryValue: string;
  }>({
    queryKey: ["/api/dashboard/stats"],
    staleTime: 0, // Always refetch to get latest data
    cacheTime: 0, // Don't cache the result
  });
}

export function useRecentActivity() {
  return useQuery<Array<{
    id: number;
    userId: number;
    action: 'create' | 'update' | 'delete';
    entityType: 'material' | 'formulation' | 'vendor';
    entityId: number;
    changes?: string;
    timestamp: Date;
  }>>({
    queryKey: ["/api/dashboard/recent-activity"],
  });
}
