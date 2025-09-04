import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SoftLaunchStatus {
  softLaunchMode: boolean;
  availablePlans: string[];
  message: string;
}

export function useSoftLaunchStatus() {
  return useQuery<SoftLaunchStatus>({
    queryKey: ["/api/soft-launch-status"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/soft-launch-status");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
