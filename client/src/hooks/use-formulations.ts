import { useQuery } from "@tanstack/react-query";
import { type Formulation } from "@shared/schema";

export function useFormulations(includeArchived = false) {
  return useQuery<Formulation[]>({
    queryKey: ["/api/formulations", { includeArchived }],
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache responses
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
    queryFn: async () => {
      const response = await fetch(`/api/formulations?includeArchived=${includeArchived}`);
      if (!response.ok) {
        throw new Error('Failed to fetch formulations');
      }
      return response.json();
    },
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
