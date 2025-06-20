import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: user, isLoading } = useUser();
  const [, setLocation] = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    setLocation("/login");
    return null;
  }

  return <>{children}</>;
}