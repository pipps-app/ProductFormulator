import { useQuery } from "@tanstack/react-query";
import { type User } from "@shared/schema";

export function useUser() {
  return useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await fetch("/api/user", {
        credentials: "include",
      });
      
      if (response.status === 401) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      
      return response.json();
    },
    retry: false,
  });
}