import { ReactNode } from "react";
import { useLocation } from "wouter";
import Header from "./header";
import Sidebar from "./sidebar";
import MobileNotice from "../common/mobile-notice";
import { useUser } from "@/hooks/use-user";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <div className="flex-1 flex">
        <div data-tour="navigation">
          <Sidebar />
        </div>
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <MobileNotice />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
