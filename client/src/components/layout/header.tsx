import { Bell, FlaskRound, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { HelpButton } from "@/components/onboarding/help-button";
import logoPath from "@assets/pipps-app-logo_1749571716445.jpg";

export default function Header() {
  const { data: user } = useUser();

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <img 
              src={logoPath} 
              alt="Pipps Logo" 
              className="h-10 w-auto"
            />
            <h1 className="text-xl font-bold text-slate-900">Pipps Maker Calc</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <HelpButton />
          <Link href="/profile">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">
                {user?.username || 'User'}
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
