import { useQuery } from "@tanstack/react-query";
import { type Formulation } from "@shared/schema";

export function useFormulations(forceRefresh?: boolean) {
  const timestamp = forceRefresh ? Date.now() : undefined;
  return useQuery<Formulation[]>({
    queryKey: ["/api/formulations", timestamp].filter(Boolean),
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache responses
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
