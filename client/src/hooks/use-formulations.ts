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
  return useQuery({
    queryKey: ["/api/dashboard/stats"],
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["/api/dashboard/recent-activity"],
  });
}
