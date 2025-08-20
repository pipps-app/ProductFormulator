import { Bell, FlaskRound, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { HelpButton } from "@/components/onboarding/help-button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import logoPath from "@assets/pipps-app-logo_1749571716445.jpg";

export default function Header() {
  const { data: user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Remove token from localStorage immediately
      localStorage.removeItem('auth_token');
      
      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Include cookies
        });
        
        const raw = await response.text();
        let parsed: any = null;
        if (raw) {
          try { parsed = JSON.parse(raw); } catch (e) {
            console.warn('Logout response not JSON:', raw);
          }
        }
        
        if (!response.ok) {
          console.warn('Logout server error:', response.status, raw);
          // Don't throw error - we still want to clear client state
        }
        
        return parsed || { success: true };
      } catch (error) {
        console.warn('Logout network error:', error);
        // Don't throw error - we still want to clear client state
        return { success: true };
      }
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Specifically invalidate user query
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      setLocation("/login");
    },
    onError: (error) => {
      // This should rarely happen now since we catch errors in mutationFn
      console.error('Logout mutation error:', error);
      
      // Still try to clear state and redirect
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Logged out",
        description: "You have been logged out (with warnings).",
        variant: "destructive",
      });
      setLocation("/login");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <img 
              src={logoPath} 
              alt="PIPPS Logo" 
              className="h-10 w-auto"
            />
            <h1 className="text-xl font-bold text-slate-900">PIPPS Maker Calc</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <HelpButton />
          
          <Button 
            variant="destructive" 
            size="default"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white font-medium"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </Button>
          
          <Link href="/profile">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">
                {user?.email || 'User'}
              </p>
              <p className="text-xs text-slate-500">
                {user?.company || user?.email || ''}
              </p>
            </div>
            <Avatar>
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
