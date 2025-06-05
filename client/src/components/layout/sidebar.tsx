import { Link, useLocation } from "wouter";
import { ChartLine, CheckSquare, Mail, BarChart3, FileText, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: ChartLine },
  { href: "/tasks", label: "Task Management", icon: CheckSquare },
  { href: "/email", label: "Email Center", icon: Mail },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/documentation", label: "Documentation", icon: FileText },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-surface shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Star className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-gray-900">Sugarwish CRM</h1>
            <p className="text-sm font-body text-gray-500">Internal Management</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
          
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
