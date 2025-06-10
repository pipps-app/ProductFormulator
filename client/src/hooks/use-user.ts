import { useQuery } from "@tanstack/react-query";
import { type User } from "@shared/schema";

export function useUser() {
  return useQuery<User>({
    queryKey: ["/api/user"],
    retry: false,
  });
}