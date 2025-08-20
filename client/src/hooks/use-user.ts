import { useQuery } from "@tanstack/react-query";
import { type User } from "@shared/schema";

export function useUser() {
  return useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      // Get JWT token from localStorage
      const token = localStorage.getItem('auth_token');
      
      // Prepare headers
      const headers: Record<string, string> = {};
      
      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch("/api/user", {
        headers,
        credentials: "include", // Keep for backward compatibility
      });
      
      if (response.status === 401) {
        // Clear token if unauthorized
        localStorage.removeItem('auth_token');
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