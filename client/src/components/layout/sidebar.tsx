import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BarChart3, Package, FlaskRound, Truck, FileText, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export default function Sidebar() {
  const [location] = useLocation();

  // Fetch dashboard stats to show real counts
  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const navigation = [
    { name: "Dashboard", href: "/", icon: BarChart3, count: null },
    { name: "Raw Materials", href: "/materials", icon: Package, count: stats?.totalMaterials },
    { name: "Formulations", href: "/formulations", icon: FlaskRound, count: stats?.activeFormulations },
    { name: "Vendors", href: "/vendors", icon: Truck, count: stats?.vendorsCount },
    { name: "Import/Export", href: "/import-export", icon: FileText, count: null },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/" || location === "/dashboard";
    }
    return location.startsWith(href);
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 px-4 py-6">
      <nav className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  active
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
                {item.count && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.count}
                  </Badge>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-6 border-t border-slate-200">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Quick Actions
        </h3>
        <div className="space-y-2">
          <Link href="/materials">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </Link>
          <Link href="/formulations">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Formulation
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
}
