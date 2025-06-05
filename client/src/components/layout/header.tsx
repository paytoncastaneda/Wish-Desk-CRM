import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Download, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const currentSection = sectionInfo[location as keyof typeof sectionInfo] || sectionInfo["/dashboard"];

  const handleExport = () => {
    toast({
      title: "Export Initiated",
      description: "Data export has been started. You will be notified when complete.",
    });
  };

  return (
    <header className="bg-surface border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{currentSection.title}</h2>
          <p className="text-sm text-gray-500">{currentSection.description}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={handleExport} className="bg-primary hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
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
