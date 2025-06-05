import { Link, useLocation } from "wouter";
import { ChartLine, CheckSquare, Target, FileText, Building, Users, Mail, Palette, BarChart3, Star, Shield, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: ChartLine },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/opportunities", label: "Opportunities", icon: Target },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/companies", label: "Companies", icon: Building },
  { href: "/contacts", label: "Contacts (Users)", icon: Users },
  { href: "/email", label: "Email", icon: Mail },
  { href: "/designs", label: "Designs", icon: Palette },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin", label: "Admin Hub", icon: Shield },
];

export function Sidebar() {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={cn(
      "bg-[#ffffff] shadow-lg border-r border-[#e5e7eb] transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className={cn(
        "p-6 border-b border-[#e5e7eb] flex items-center",
        isCollapsed ? "justify-center p-4" : "justify-between"
      )}>
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#d2232a] rounded-lg flex items-center justify-center">
              <Star className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-lato font-bold text-[#2d3333]">Sugarwish CRM</h1>
              <p className="text-sm font-lato text-[#666666]">Wish Desk Management</p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-[#2d3333] hover:bg-[#f5f7fa]"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        {isCollapsed && (
          <div className="w-10 h-10 bg-[#d2232a] rounded-lg flex items-center justify-center mt-2">
            <Star className="text-white w-5 h-5" />
          </div>
        )}
      </div>
      
      <nav className={cn("p-4 space-y-2", isCollapsed && "px-2")}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
          
          if (isCollapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-lg transition-colors cursor-pointer",
                        isActive
                          ? "bg-[#d2232a] text-white"
                          : "text-[#2d3333] hover:bg-[#f5f7fa]"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-lato">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer font-lato",
                  isActive
                    ? "bg-[#d2232a] text-white"
                    : "text-[#2d3333] hover:bg-[#f5f7fa]"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
