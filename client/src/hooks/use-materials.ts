import { useQuery } from "@tanstack/react-query";
import { type RawMaterial, type MaterialCategory, type Vendor } from "@shared/schema";

interface MaterialWithDetails extends RawMaterial {
  category?: {
    id: number;
    name: string;
    color: string;
  };
  vendor?: {
    id: number;
    name: string;
    contactEmail?: string;
  };
}

export function useMaterials() {
  return useQuery<MaterialWithDetails[]>({
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
  return useQuery<MaterialCategory[]>({
    queryKey: ["/api/material-categories"],
  });
}

export function useVendors() {
  return useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });
}
