import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  CheckSquare, 
  Github, 
  Mail, 
  FileText, 
  FileBarChart,
  Star
} from "lucide-react";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "tasks", label: "Task Management", icon: CheckSquare },
  { id: "github", label: "GitHub Integration", icon: Github },
  { id: "email", label: "Email Center", icon: Mail },
  { id: "reports", label: "Reports", icon: FileBarChart },
  { id: "docs", label: "Documentation", icon: FileText },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-card shadow-lg border-r border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Star className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Wish Desk CRM</h1>
            <p className="text-sm text-muted-foreground">Internal Management</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "sidebar-item w-full text-left",
                isActive && "active"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
