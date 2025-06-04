import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Download, User } from "lucide-react";

interface HeaderProps {
  title: string;
  description: string;
}

const sectionInfo = {
  dashboard: { 
    title: "Dashboard", 
    description: "Overview of your CRM activities and performance" 
  },
  tasks: { 
    title: "Task Management", 
    description: "Organize and track your team's tasks" 
  },
  github: { 
    title: "GitHub Integration", 
    description: "Connect and sync your GitHub repositories" 
  },
  email: { 
    title: "Email Center", 
    description: "Manage notifications and communications" 
  },
  reports: { 
    title: "Reports & Analytics", 
    description: "Generate insights and export data" 
  },
  docs: { 
    title: "Documentation", 
    description: "Process documentation and implementation guides" 
  },
};

export function Header({ title, description }: HeaderProps) {
  const handleExportData = () => {
    // TODO: Implement data export functionality
    console.log("Exporting data...");
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={handleExportData} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
