import { Bell, FlaskRound, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const { data: user } = useQuery({
    queryKey: ['/api/user/profile'],
  });

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <FlaskRound className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Pipps Maker Calc</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
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
