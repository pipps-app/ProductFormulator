import { useQuery } from "@tanstack/react-query";
import { type RawMaterial } from "@shared/schema";

export function useMaterials() {
  return useQuery<RawMaterial[]>({
    queryKey: ["/api/raw-materials"],
  });
}

export function useMaterial(id: number) {
  return useQuery<RawMaterial>({
    queryKey: ["/api/raw-materials", id],
    enabled: !!id,
  });
}

export function useMaterialCategories() {
  return useQuery({
    queryKey: ["/api/material-categories"],
  });
}

export function useVendors() {
  return useQuery({
    queryKey: ["/api/vendors"],
  });
}
