import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

const sectionInfo = {
  "/dashboard": { title: "Dashboard", description: "Overview of your CRM activities and performance" },
  "/": { title: "Dashboard", description: "Overview of your CRM activities and performance" },
  "/tasks": { title: "Task Management", description: "Organize and track your team's tasks" },
  "/email": { title: "Email Center", description: "Manage notifications and communications" },
  "/reports": { title: "Reports & Analytics", description: "Generate insights and export data" },
  "/documentation": { title: "Documentation", description: "Process documentation and implementation guides" },
};

export function Header() {
  const [location] = useLocation();
  const currentSection = sectionInfo[location as keyof typeof sectionInfo] || sectionInfo["/dashboard"];

  return (
    <header className="bg-surface border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{currentSection.title}</h2>
          <p className="text-sm text-gray-500">{currentSection.description}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button variant="outline" size="icon" className="w-10 h-10 rounded-full">
              <User className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
